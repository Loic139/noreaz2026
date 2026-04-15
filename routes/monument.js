const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

router.get('/', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.redirect('/');

    const [rows] = await db.query(
        'SELECT * FROM monuments WHERE qr_token = ? AND active = 1', [token]
    );
    const monument = rows[0];
    if (!monument) return res.redirect('/');

    let alreadyPlayed = false;
    let existingScore = null;

    if (req.session.user) {
        const [s] = await db.query(
            'SELECT points FROM scores WHERE user_id = ? AND monument_id = ?',
            [req.session.user.id, monument.id]
        );
        if (s.length) { alreadyPlayed = true; existingScore = s[0]; }
    }

    res.render('monument', {
        pageTitle: 'Tu as trouvé : ' + monument.name,
        monument,
        token,
        alreadyPlayed,
        existingScore,
    });
});

module.exports = router;
