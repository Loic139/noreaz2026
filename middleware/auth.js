function requireLogin(req, res, next) {
    if (req.session.user) return next();
    req.flash('error', 'Connecte-toi pour accéder à cette page.');
    res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
}

function requireAdmin(req, res, next) {
    if (req.session.isAdmin) return next();
    res.redirect('/admin/login');
}

module.exports = { requireLogin, requireAdmin };
