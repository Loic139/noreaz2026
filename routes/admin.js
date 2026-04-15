const express    = require('express');
const router     = express.Router();
const db         = require('../config/db');
const qrcode     = require('qrcode');
const { requireAdmin } = require('../middleware/auth');
const upload     = require('../middleware/upload');
const crypto     = require('crypto');
const path       = require('path');
const fs         = require('fs');

// ---- Login ----
router.get('/login', (req, res) => {
    if (req.session.isAdmin) return res.redirect('/admin');
    res.render('admin/login', { pageTitle: 'Admin — Connexion' });
});

router.post('/login', (req, res) => {
    if (req.body.password === (process.env.ADMIN_PASSWORD || 'noreaz2026admin')) {
        req.session.isAdmin = true;
        return res.redirect('/admin');
    }
    req.flash('error', 'Mot de passe incorrect.');
    res.redirect('/admin/login');
});

router.get('/logout', (req, res) => {
    req.session.isAdmin = false;
    res.redirect('/admin/login');
});

// Toutes les routes suivantes nécessitent d'être admin
router.use(requireAdmin);

// ---- Dashboard ----
router.get('/', async (req, res) => {
    const [[{ monuments }]] = await db.query('SELECT COUNT(*) AS monuments FROM monuments');
    const [[{ users }]]     = await db.query('SELECT COUNT(*) AS users FROM users');
    const [[{ scores }]]    = await db.query('SELECT COALESCE(SUM(points),0) AS scores FROM scores');

    const [monumentList] = await db.query('SELECT id, name, qr_token, active FROM monuments ORDER BY id');
    const [ranking]      = await db.query(
        `SELECT u.first_name, u.last_name, SUM(s.points) AS total, COUNT(s.id) AS nb
         FROM scores s JOIN users u ON u.id = s.user_id
         GROUP BY s.user_id ORDER BY total DESC`
    );

    // Génération QR codes en base64
    const qrCodes = {};
    for (const m of monumentList) {
        const url = process.env.APP_URL + '/monument?token=' + m.qr_token;
        qrCodes[m.id] = await qrcode.toDataURL(url, { width: 200, color: { dark: '#1A1A1A', light: '#FFFFFF' } });
    }

    res.render('admin/index', {
        pageTitle: 'Admin — Tableau de bord',
        stats: { monuments, users, scores },
        monumentList,
        ranking,
        qrCodes,
    });
});

// ---- Monuments ----
router.get('/monuments', async (req, res) => {
    const [monuments] = await db.query(
        `SELECT m.*, COUNT(q.id) AS nb_questions
         FROM monuments m LEFT JOIN questions q ON q.monument_id = m.id
         GROUP BY m.id ORDER BY m.id`
    );
    res.render('admin/monuments', {
        pageTitle: 'Admin — Monuments',
        monuments,
        msg: req.query.msg || null,
        msgType: req.query.type || 'success',
    });
});

router.post('/monuments/add', upload.single('image'), async (req, res) => {
    const { name, country, desc, hint } = req.body;
    if (!name) return res.redirect('/admin/monuments');

    const slug  = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const token = crypto.randomBytes(16).toString('hex');
    const [result] = await db.query(
        'INSERT INTO monuments (name, slug, description, country, hint, qr_token) VALUES (?,?,?,?,?,?)',
        [name, slug, desc || null, country || null, hint || null, token]
    );

    if (req.file) {
        const ext     = path.extname(req.file.originalname).toLowerCase();
        const newName = 'monument_' + result.insertId + ext;
        const dest    = path.join(__dirname, '../public/img/monuments', newName);
        fs.renameSync(req.file.path, dest);
        await db.query('UPDATE monuments SET image=? WHERE id=?', [newName, result.insertId]);
    }

    res.redirect('/admin/monuments?msg=Monument+ajouté');
});

router.post('/monuments/:id/upload', (req, res, next) => {
    upload.single('image')(req, res, async (err) => {
        if (err || !req.file) {
            return res.redirect('/admin/monuments?msg=Erreur+upload&type=danger');
        }
        const id  = parseInt(req.params.id);
        const ext = path.extname(req.file.originalname).toLowerCase();
        const filename = 'monument_' + id + ext;
        const dest = path.join(__dirname, '../public/img/monuments', filename);
        fs.renameSync(req.file.path, dest);
        await db.query('UPDATE monuments SET image=? WHERE id=?', [filename, id]);
        res.redirect('/admin/monuments?msg=Photo+mise+à+jour');
    });
});

router.get('/monuments/:id/toggle', async (req, res) => {
    const [[m]] = await db.query('SELECT active FROM monuments WHERE id=?', [req.params.id]);
    if (m) await db.query('UPDATE monuments SET active=? WHERE id=?', [m.active ? 0 : 1, req.params.id]);
    res.redirect('/admin/monuments');
});

router.get('/monuments/:id/delete', async (req, res) => {
    await db.query('DELETE FROM monuments WHERE id=?', [req.params.id]);
    res.redirect('/admin/monuments');
});

// ---- Questions ----
router.get('/questions', async (req, res) => {
    const monumentId = parseInt(req.query.monument_id);
    if (!monumentId) return res.redirect('/admin/monuments');

    const [[monument]] = await db.query('SELECT * FROM monuments WHERE id=?', [monumentId]);
    if (!monument) return res.redirect('/admin/monuments');

    const [questions] = await db.query(
        'SELECT * FROM questions WHERE monument_id=? ORDER BY sort_order', [monumentId]
    );
    const editId = req.query.edit ? parseInt(req.query.edit) : null;
    const editQ  = editId ? questions.find(q => q.id === editId) : null;

    res.render('admin/questions', {
        pageTitle: 'Admin — Questions',
        monument,
        questions,
        editQ,
        msg: req.flash('success')[0] || null,
        QUIZ_QUESTIONS: parseInt(process.env.QUIZ_QUESTIONS) || 5,
    });
});

router.post('/questions/add', async (req, res) => {
    const { monument_id, question, correct, wrong1, wrong2, wrong3 } = req.body;
    const mid = parseInt(monument_id);
    if (question && correct && wrong1 && wrong2 && wrong3) {
        const [[{ cnt }]] = await db.query('SELECT COUNT(*) AS cnt FROM questions WHERE monument_id=?', [mid]);
        await db.query(
            'INSERT INTO questions (monument_id, question_text, answer_correct, answer_wrong1, answer_wrong2, answer_wrong3, sort_order) VALUES (?,?,?,?,?,?,?)',
            [mid, question, correct, wrong1, wrong2, wrong3, cnt + 1]
        );
        req.flash('success', 'Question ajoutée.');
    }
    res.redirect('/admin/questions?monument_id=' + mid);
});

router.post('/questions/edit', async (req, res) => {
    const { question_id, monument_id, question, correct, wrong1, wrong2, wrong3 } = req.body;
    if (question && correct && wrong1 && wrong2 && wrong3) {
        await db.query(
            'UPDATE questions SET question_text=?, answer_correct=?, answer_wrong1=?, answer_wrong2=?, answer_wrong3=? WHERE id=? AND monument_id=?',
            [question, correct, wrong1, wrong2, wrong3, question_id, monument_id]
        );
        req.flash('success', 'Question modifiée.');
    }
    res.redirect('/admin/questions?monument_id=' + monument_id);
});

router.get('/questions/delete', async (req, res) => {
    const { id, monument_id } = req.query;
    await db.query('DELETE FROM questions WHERE id=? AND monument_id=?', [id, monument_id]);
    res.redirect('/admin/questions?monument_id=' + monument_id);
});

// ---- Joueurs ----
router.get('/users', async (req, res) => {
    const [users] = await db.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.created_at,
                COALESCE(SUM(s.points),0) AS total_points, COUNT(s.id) AS monuments_joues
         FROM users u LEFT JOIN scores s ON s.user_id = u.id
         GROUP BY u.id ORDER BY total_points DESC`
    );
    res.render('admin/users', { pageTitle: 'Admin — Joueurs', users });
});

router.get('/users/:id/reset', async (req, res) => {
    await db.query('DELETE FROM scores WHERE user_id=?', [req.params.id]);
    res.redirect('/admin/users');
});

router.get('/users/:id/delete', async (req, res) => {
    await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
    res.redirect('/admin/users');
});

module.exports = router;
