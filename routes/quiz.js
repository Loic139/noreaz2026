const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

router.get('/', async (req, res) => {
    const { token, mode = 'auth' } = req.query;
    if (!token) return res.redirect('/');

    const [rows] = await db.query(
        'SELECT * FROM monuments WHERE qr_token = ? AND active = 1', [token]
    );
    const monument = rows[0];
    if (!monument) return res.redirect('/');

    if (mode !== 'anon' && !req.session.user) {
        return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
    }

    if (req.session.user) {
        const [s] = await db.query(
            'SELECT id FROM scores WHERE user_id = ? AND monument_id = ?',
            [req.session.user.id, monument.id]
        );
        if (s.length) return res.redirect('/monument?token=' + encodeURIComponent(token));
    }

    const [questions] = await db.query(
        `SELECT question_text, answer_correct, answer_wrong1, answer_wrong2, answer_wrong3
         FROM questions WHERE monument_id = ? ORDER BY sort_order
         LIMIT ${parseInt(process.env.QUIZ_QUESTIONS) || 5}`,
        [monument.id]
    );

    if (!questions.length) return res.redirect('/monument?token=' + encodeURIComponent(token));

    const jsQuestions = questions.map(q => ({
        question: q.question_text,
        correct:  q.answer_correct,
        wrong1:   q.answer_wrong1,
        wrong2:   q.answer_wrong2,
        wrong3:   q.answer_wrong3,
    }));

    res.render('quiz', {
        pageTitle:   'Quiz — ' + monument.name,
        monument,
        token,
        mode,
        jsQuestions: JSON.stringify(jsQuestions),
        saveUrl:     mode === 'anon' ? '' : '/api/save-score',
    });
});

module.exports = router;
