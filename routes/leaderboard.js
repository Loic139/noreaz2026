const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

router.get('/', async (req, res) => {
    const [ranking] = await db.query(
        `SELECT u.id AS user_id, u.first_name, u.last_name,
                SUM(s.points) AS total, COUNT(s.id) AS monuments_joues
         FROM scores s JOIN users u ON u.id = s.user_id
         GROUP BY s.user_id ORDER BY total DESC, monuments_joues ASC`
    );
    const [[{ nb }]] = await db.query('SELECT COUNT(*) AS nb FROM monuments WHERE active=1');

    let myRank = null, myScore = null;
    if (req.session.user) {
        const idx = ranking.findIndex(row => row.user_id === req.session.user.id);
        if (idx !== -1) {
            myRank  = idx + 1;
            myScore = ranking[idx].total;
        }
    }

    res.render('leaderboard', {
        pageTitle:    'Classement — Noréaz 2026',
        ranking,
        nbMonuments:  nb,
        myRank,
        myScore,
    });
});

module.exports = router;
