const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// ---- Utilitaires (dupliqués serveur pour être la source de vérité) ----
function haversineKm(lat1, lon1, lat2, lon2) {
    const R  = 6371;
    const dL = (lat2 - lat1) * Math.PI / 180;
    const dG = (lon2 - lon1) * Math.PI / 180;
    const a  = Math.sin(dL / 2) ** 2
             + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
             * Math.sin(dG / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcPoints(km) {
    if (km <=    1) return 5;
    if (km <=   10) return 4;
    if (km <=   50) return 3;
    if (km <=  500) return 2;
    if (km <= 1000) return 1;
    return 0;
}

function isValidCoord(lat, lng) {
    return Number.isFinite(lat) && Number.isFinite(lng)
        && lat >= -90 && lat <= 90
        && lng >= -180 && lng <= 180;
}

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

    // IMPORTANT : on ne transmet plus latitude/longitude au client tant que
    // le joueur n'a pas confirmé sa position (anti-triche via "view source").
    // Si déjà joué, on peut les fournir pour afficher la correction sur la carte.
    const publicMonument = {
        id:    monument.id,
        name:  monument.name,
        country: monument.country,
        image: monument.image,
    };
    if (bestScore) {
        publicMonument.latitude  = monument.latitude;
        publicMonument.longitude = monument.longitude;
    }

    res.render('geo-quiz', {
        pageTitle: 'Géo-Quiz — ' + monument.name,
        monument: publicMonument,
        token,
        bestScore,
        alreadyPlayed: !!bestScore,
    });
});

// POST /geo-quiz/check
// Le client envoie uniquement sa position cliquée. Le serveur :
//  - calcule la distance et les points (autorité)
//  - enregistre si l'utilisateur est connecté et n'a pas déjà joué
//  - renvoie la position réelle du monument pour affichage
router.post('/check', async (req, res) => {
    const monumentId = parseInt(req.body.monument_id, 10);
    const userLat    = parseFloat(req.body.lat);
    const userLng    = parseFloat(req.body.lng);

    if (!monumentId || !isValidCoord(userLat, userLng)) {
        return res.status(400).json({ ok: false, error: 'invalid_input' });
    }

    const [rows] = await db.query(
        'SELECT id, name, latitude, longitude FROM monuments WHERE id = ? AND active = 1',
        [monumentId]
    );
    const monument = rows[0];
    if (!monument || !monument.latitude || !monument.longitude) {
        return res.status(404).json({ ok: false, error: 'monument_not_found' });
    }

    // Si l'utilisateur est connecté et a déjà joué, on bloque (une seule tentative).
    if (req.session.user) {
        const [existing] = await db.query(
            'SELECT 1 FROM geo_scores WHERE user_id = ? AND monument_id = ?',
            [req.session.user.id, monumentId]
        );
        if (existing.length) {
            return res.status(403).json({ ok: false, error: 'already_played' });
        }
    }

    const distance = Math.round(haversineKm(userLat, userLng, monument.latitude, monument.longitude));
    const points   = calcPoints(distance);

    if (req.session.user) {
        await db.query(
            `INSERT INTO geo_scores (user_id, monument_id, distance_km, points)
             VALUES (?, ?, ?, ?)`,
            [req.session.user.id, monumentId, distance, points]
        );
    }

    res.json({
        ok: true,
        distance_km: distance,
        points,
        target: { lat: monument.latitude, lng: monument.longitude, name: monument.name },
    });
});

module.exports = router;
