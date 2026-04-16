const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Leaderboard JSON (refresh auto)
router.get('/leaderboard', async (req, res) => {
    const [ranking] = await db.query(
        `SELECT u.first_name, u.last_name, SUM(s.points) AS total, COUNT(s.id) AS nb
         FROM scores s JOIN users u ON u.id = s.user_id
         GROUP BY s.user_id ORDER BY total DESC`
    );
    const [[{ nb }]] = await db.query('SELECT COUNT(*) AS nb FROM monuments WHERE active=1');
    res.json({ ranking, nbMonuments: nb });
});

// Enregistrement du score
router.post('/save-score', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Non connecté' });

    const { monument_id, score } = req.body;
    const mid = parseInt(monument_id);
    const pts = Math.max(0, Math.min(parseInt(score), parseInt(process.env.QUIZ_QUESTIONS) || 5));

    if (!mid) return res.status(400).json({ error: 'Monument invalide' });

    const [m] = await db.query('SELECT id FROM monuments WHERE id=? AND active=1', [mid]);
    if (!m.length) return res.status(404).json({ error: 'Monument introuvable' });

    const [existing] = await db.query(
        'SELECT id, points FROM scores WHERE user_id=? AND monument_id=?',
        [req.session.user.id, mid]
    );
    if (existing.length && existing[0].points > 0) return res.json({ status: 'already_played' });

    if (existing.length) {
        // Mise à jour de la visite (points=0) avec le vrai score
        await db.query(
            'UPDATE scores SET points=?, completed_at=NOW() WHERE user_id=? AND monument_id=?',
            [pts, req.session.user.id, mid]
        );
    } else {
        await db.query(
            'INSERT INTO scores (user_id, monument_id, points) VALUES (?,?,?)',
            [req.session.user.id, mid, pts]
        );
    }
    res.json({ status: 'ok', points: pts });
});

module.exports = router;
