const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcrypt');
const crypto   = require('crypto');
const db       = require('../config/db');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../config/mailer');

// GET login
router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('login', {
        pageTitle: 'Connexion — Noréaz 2026',
        redirect: req.query.redirect || '/',
    });
});

// POST login
router.post('/login', async (req, res) => {
    const { email, password, redirect = '/' } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    const user   = rows[0];

    if (user && await bcrypt.compare(password, user.password)) {
        const pt = crypto.randomBytes(32).toString('hex');
        await db.query('UPDATE users SET persistent_token = ? WHERE id = ?', [pt, user.id]);
        req.session.user = { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, email_verified: user.email_verified, persistent_token: pt };
        return res.redirect(redirect);
    }
    req.flash('error', 'Email ou mot de passe incorrect.');
    res.redirect('/auth/login?redirect=' + encodeURIComponent(redirect));
});

// GET register
router.get('/register', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('register', {
        pageTitle: 'Inscription — Noréaz 2026',
        redirect: req.query.redirect || '/',
    });
});

// POST register
router.post('/register', async (req, res) => {
    const { first_name, last_name, email, password, confirm, redirect = '/' } = req.body;

    if (!first_name || !last_name || !email || !password) {
        req.flash('error', 'Tous les champs sont obligatoires.');
        return res.redirect('/auth/register?redirect=' + encodeURIComponent(redirect));
    }
    if (password.length < 6) {
        req.flash('error', 'Le mot de passe doit contenir au moins 6 caractères.');
        return res.redirect('/auth/register?redirect=' + encodeURIComponent(redirect));
    }
    if (password !== confirm) {
        req.flash('error', 'Les mots de passe ne correspondent pas.');
        return res.redirect('/auth/register?redirect=' + encodeURIComponent(redirect));
    }

    const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    if (exists.length) {
        req.flash('error', 'Cette adresse e-mail est déjà utilisée.');
        return res.redirect('/auth/register?redirect=' + encodeURIComponent(redirect));
    }

    const hash  = await bcrypt.hash(password, 12);
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [result] = await db.query(
        'INSERT INTO users (email, first_name, last_name, password, verification_token, token_expires_at) VALUES (?,?,?,?,?,?)',
        [email.toLowerCase(), first_name, last_name, hash, token, expires]
    );
    const pt = crypto.randomBytes(32).toString('hex');
    await db.query('UPDATE users SET persistent_token = ? WHERE id = ?', [pt, result.insertId]);
    req.session.user = { id: result.insertId, first_name, last_name, email: email.toLowerCase(), email_verified: 0, persistent_token: pt };

    try {
        await sendVerificationEmail(email.toLowerCase(), first_name, token);
    } catch (e) {
        console.error('Erreur envoi email:', e.message);
    }

    req.flash('success', 'Compte créé ! Vérifiez votre e-mail pour activer votre compte.');
    res.redirect(redirect);
});

// GET verify email
router.get('/verify/:token', async (req, res) => {
    const [rows] = await db.query(
        'SELECT id, first_name, last_name, email, persistent_token FROM users WHERE verification_token = ? AND token_expires_at > NOW()',
        [req.params.token]
    );
    if (!rows.length) {
        req.flash('error', 'Lien de vérification invalide ou expiré.');
        return res.redirect('/');
    }
    const user = rows[0];
    await db.query(
        'UPDATE users SET email_verified = 1, verification_token = NULL, token_expires_at = NULL WHERE id = ?',
        [user.id]
    );
    const pt = user.persistent_token || crypto.randomBytes(32).toString('hex');
    if (!user.persistent_token) await db.query('UPDATE users SET persistent_token = ? WHERE id = ?', [pt, user.id]);
    req.session.user = { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, email_verified: 1, persistent_token: pt };
    req.flash('success', 'E-mail confirmé ! Bienvenue ' + user.first_name + ' !');
    res.redirect('/');
});

// POST renvoyer l'email de vérification
router.post('/resend-verification', async (req, res) => {
    if (!req.session.user) return res.redirect('/auth/login');
    if (req.session.user.email_verified) return res.redirect('/');

    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.query(
        'UPDATE users SET verification_token = ?, token_expires_at = ? WHERE id = ?',
        [token, expires, req.session.user.id]
    );
    try {
        await sendVerificationEmail(req.session.user.email, req.session.user.first_name, token);
        req.flash('success', 'E-mail de vérification renvoyé.');
    } catch (e) {
        req.flash('error', 'Erreur lors de l\'envoi. Réessayez plus tard.');
    }
    res.redirect('/');
});

// GET profile
router.get('/profile', (req, res) => {
    if (!req.session.user) return res.redirect('/auth/login');
    res.render('profile', { pageTitle: 'Mon profil — Noréaz 2026' });
});

// POST profile
router.post('/profile', async (req, res) => {
    if (!req.session.user) return res.redirect('/auth/login');
    const { first_name, last_name } = req.body;

    if (!first_name || !last_name) {
        req.flash('error', 'Prénom et nom sont obligatoires.');
        return res.redirect('/auth/profile');
    }

    await db.query(
        'UPDATE users SET first_name = ?, last_name = ? WHERE id = ?',
        [first_name, last_name, req.session.user.id]
    );
    req.session.user.first_name = first_name;
    req.session.user.last_name  = last_name;
    req.flash('success', 'Profil mis à jour.');
    res.redirect('/auth/profile');
});

// POST auto-login via persistent token (localStorage)
router.post('/auto-login', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.json({ ok: false });
    const [rows] = await db.query(
        'SELECT id, first_name, last_name, email, email_verified, persistent_token FROM users WHERE persistent_token = ?',
        [token]
    );
    if (!rows.length) return res.json({ ok: false });
    const u = rows[0];
    req.session.user = { id: u.id, first_name: u.first_name, last_name: u.last_name, email: u.email, email_verified: u.email_verified, persistent_token: u.persistent_token };
    res.json({ ok: true });
});

// GET forgot password
router.get('/forgot-password', (req, res) => {
    if (req.session.user) return res.redirect('/');
    res.render('forgot-password', { pageTitle: 'Mot de passe oublié — Noréaz 2026' });
});

// POST forgot password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const [rows] = await db.query('SELECT id, first_name FROM users WHERE email = ?', [email.toLowerCase()]);

    // Même réponse si l'email existe ou non (sécurité)
    req.flash('success', 'Si cette adresse existe, un e-mail vous a été envoyé.');

    if (rows.length) {
        const token   = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
        await db.query(
            'UPDATE users SET reset_token = ?, reset_expires_at = ? WHERE id = ?',
            [token, expires, rows[0].id]
        );
        try {
            await sendPasswordResetEmail(email.toLowerCase(), rows[0].first_name, token);
        } catch (e) {
            console.error('Erreur envoi email reset:', e.message);
        }
    }
    res.redirect('/auth/forgot-password');
});

// GET reset password
router.get('/reset-password/:token', async (req, res) => {
    const [rows] = await db.query(
        'SELECT id, reset_expires_at FROM users WHERE reset_token = ?',
        [req.params.token]
    );
    if (!rows.length || !rows[0].reset_expires_at || new Date(rows[0].reset_expires_at) < new Date()) {
        req.flash('error', 'Lien invalide ou expiré. Faites une nouvelle demande.');
        return res.redirect('/auth/forgot-password');
    }
    res.render('reset-password', { pageTitle: 'Nouveau mot de passe — Noréaz 2026', token: req.params.token });
});

// POST reset password
router.post('/reset-password/:token', async (req, res) => {
    const { password, confirm } = req.body;
    const [rows] = await db.query(
        'SELECT id, first_name, last_name, email, reset_expires_at FROM users WHERE reset_token = ?',
        [req.params.token]
    );
    if (rows.length && (!rows[0].reset_expires_at || new Date(rows[0].reset_expires_at) < new Date())) {
        req.flash('error', 'Lien invalide ou expiré. Faites une nouvelle demande.');
        return res.redirect('/auth/forgot-password');
    }
    if (!rows.length) {
        req.flash('error', 'Lien invalide ou expiré. Faites une nouvelle demande.');
        return res.redirect('/auth/forgot-password');
    }
    if (!password || password.length < 6) {
        req.flash('error', 'Le mot de passe doit contenir au moins 6 caractères.');
        return res.redirect(`/auth/reset-password/${req.params.token}`);
    }
    if (password !== confirm) {
        req.flash('error', 'Les mots de passe ne correspondent pas.');
        return res.redirect(`/auth/reset-password/${req.params.token}`);
    }
    const hash = await bcrypt.hash(password, 12);
    const user = rows[0];
    await db.query(
        'UPDATE users SET password = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?',
        [hash, user.id]
    );
    req.session.user = { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, email_verified: 1 };
    req.flash('success', 'Mot de passe mis à jour ! Vous êtes connecté.');
    res.redirect('/');
});

// GET logout
router.get('/logout', async (req, res) => {
    if (req.session.user) {
        await db.query('UPDATE users SET persistent_token = NULL WHERE id = ?', [req.session.user.id]);
    }
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
