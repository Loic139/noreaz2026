const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /geo-quiz?token=...
router.get('/', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.redirect('/');

    const [rows] = await db.query(
        'SELECT id, name, country, image, latitude, longitude FROM monuments WHERE qr_token = ? AND active = 1',
        [token]
    );
    const monument = rows[0];
    if (!monument) return res.redirect('/');
    if (!monument.latitude || !monument.longitude) {
        return res.redirect('/monument?token=' + encodeURIComponent(token));
    }

    let bestScore = null;
    if (req.session.user) {
        const [s] = await db.query(
            'SELECT distance_km, points FROM geo_scores WHERE user_id = ? AND monument_id = ?',
            [req.session.user.id, monument.id]
        );
        if (s.length) bestScore = s[0];
    }

    res.render('geo-quiz', {
        pageTitle: 'Géo-Quiz — ' + monument.name,
        monument,
        token,
        bestScore,
        alreadyPlayed: !!bestScore,
    });
});

// POST /geo-quiz/save
router.post('/save', async (req, res) => {
    if (!req.session.user) return res.json({ ok: false });
    const { monument_id, distance_km, points } = req.body;
    if (!monument_id || distance_km === undefined) return res.json({ ok: false });

    await db.query(
        `INSERT INTO geo_scores (user_id, monument_id, distance_km, points)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           distance_km = LEAST(VALUES(distance_km), distance_km),
           points      = GREATEST(VALUES(points), points),
           played_at   = NOW()`,
        [req.session.user.id, monument_id, distance_km, points]
    );
    res.json({ ok: true });
});

module.exports = router;
