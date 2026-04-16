/**
 * Middleware "Remember me" — auto-login transparent via cookie httpOnly.
 *
 * Remplace l'ancien flow localStorage + /auth/auto-login + location.reload().
 * - Sécurité : le token n'est plus accessible au JS (immune XSS).
 * - UX : auto-login côté serveur dès la première requête → zéro reload, zéro
 *   course avec les clics de l'utilisateur.
 */
const db = require('../config/db');

const COOKIE_NAME = 'noreaz_rt';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 jours

/** Options de cookie homogènes, utilisées partout où on set/clear ce cookie. */
function cookieOptions(isProd) {
    return {
        httpOnly: true,
        secure:   isProd,
        sameSite: 'lax',
        path:     '/',
        maxAge:   COOKIE_MAX_AGE,
    };
}

/** Lecture manuelle d'un cookie pour éviter d'ajouter cookie-parser. */
function getCookie(req, name) {
    const header = req.headers.cookie;
    if (!header) return null;
    const parts = header.split(/;\s*/);
    for (const p of parts) {
        const idx = p.indexOf('=');
        if (idx > 0 && p.slice(0, idx) === name) {
            try { return decodeURIComponent(p.slice(idx + 1)); }
            catch (_) { return null; }
        }
    }
    return null;
}

/** Middleware : si pas de session user mais un cookie "remember" valide, auto-login. */
async function rememberMe(req, res, next) {
    if (req.session.user) return next();

    const token = getCookie(req, COOKIE_NAME);
    if (!token) return next();

    // Format attendu : 64 chars hex (crypto.randomBytes(32).toString('hex'))
    if (!/^[a-f0-9]{64}$/i.test(token)) {
        res.clearCookie(COOKIE_NAME, { path: '/' });
        return next();
    }

    try {
        const [rows] = await db.query(
            `SELECT id, first_name, last_name, email, email_verified, persistent_token
             FROM users WHERE persistent_token = ?`,
            [token]
        );
        if (rows.length) {
            const u = rows[0];
            req.session.user = {
                id:               u.id,
                first_name:       u.first_name,
                last_name:        u.last_name,
                email:            u.email,
                email_verified:   u.email_verified,
                persistent_token: u.persistent_token,
            };
        } else {
            // Token inconnu / invalidé côté serveur : on nettoie le cookie
            res.clearCookie(COOKIE_NAME, { path: '/' });
        }
    } catch (e) {
        console.error('[remember] erreur DB:', e.message);
    }
    next();
}

module.exports = { rememberMe, COOKIE_NAME, cookieOptions };
