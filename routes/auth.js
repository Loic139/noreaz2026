const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');
const db      = require('../config/db');

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
        req.session.user = { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email };
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

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
        'INSERT INTO users (email, first_name, last_name, password) VALUES (?,?,?,?)',
        [email.toLowerCase(), first_name, last_name, hash]
    );
    req.session.user = { id: result.insertId, first_name, last_name, email: email.toLowerCase() };
    res.redirect(redirect);
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

// GET logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;
