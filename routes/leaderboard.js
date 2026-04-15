const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

router.get('/', async (req, res) => {
    const [ranking] = await db.query(
        `SELECT u.first_name, u.last_name, SUM(s.points) AS total, COUNT(s.id) AS monuments_joues
         FROM scores s JOIN users u ON u.id = s.user_id
         GROUP BY s.user_id ORDER BY total DESC, monuments_joues ASC`
    );
    const [[{ nb }]] = await db.query('SELECT COUNT(*) AS nb FROM monuments WHERE active=1');

    let myRank = null, myScore = null;
    if (req.session.user) {
        ranking.forEach((row, i) => {
            if (row.first_name === req.session.user.first_name &&
                row.last_name  === req.session.user.last_name) {
                myRank  = i + 1;
                myScore = row.total;
            }
        });
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
