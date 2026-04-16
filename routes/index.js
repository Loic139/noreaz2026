const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

router.get('/', async (req, res) => {
    const [monuments] = await db.query(
        'SELECT id, name, country, description, image, hint, qr_token FROM monuments WHERE active = 1 ORDER BY id'
    );

    const [top5] = await db.query(
        `SELECT u.first_name, u.last_name, SUM(s.points) AS total
         FROM scores s JOIN users u ON u.id = s.user_id
         GROUP BY s.user_id ORDER BY total DESC LIMIT 5`
    );

    let foundIds = [];
    if (req.session.user) {
        const [rows] = await db.query(
            'SELECT monument_id FROM scores WHERE user_id = ?',
            [req.session.user.id]
        );
        foundIds = rows.map(r => r.monument_id);
    }

    res.render('index', {
        pageTitle: 'Noréaz 2026 — Chasse aux trésors',
        monuments,
        top5,
        foundIds,
    });
});

module.exports = router;
