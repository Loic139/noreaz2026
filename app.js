require('dotenv').config();
const express       = require('express');
const session       = require('express-session');
const flash         = require('connect-flash');
const path          = require('path');
const { version }   = require('./package.json');
const { rememberMe } = require('./middleware/remember');

// ---- V\u00e9rifs d'environnement critiques ----
if (!process.env.SESSION_SECRET) {
    console.error('\u274c SESSION_SECRET manquant dans .env \u2014 arr\u00eat de l\'application.');
    console.error('   G\u00e9n\u00e8re-le avec : openssl rand -hex 64');
    process.exit(1);
}
if (!process.env.ADMIN_PASSWORD) {
    console.warn('\u26a0\ufe0f  ADMIN_PASSWORD non d\u00e9fini \u2014 la connexion admin sera d\u00e9sactiv\u00e9e.');
}

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Indispensable si on est derri\u00e8re un reverse proxy (HTTPS termin\u00e9 en amont)
if (isProd) app.set('trust proxy', 1);

// ---- Moteur de vues ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---- Middleware ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret:            process.env.SESSION_SECRET,
    resave:            false,
    saveUninitialized: false,
    name:              'noreaz.sid', // on ne divulgue pas le framework
    cookie: {
        httpOnly: true,            // non lisible en JS (anti-XSS sur le cookie)
        secure:   isProd,          // HTTPS uniquement en prod
        sameSite: 'lax',           // anti-CSRF basique
        maxAge:   7 * 24 * 60 * 60 * 1000, // 7 jours
    },
}));

app.use(flash());

// Auto-login transparent via cookie httpOnly (doit être après session)
app.use(rememberMe);

// Variables globales accessibles dans toutes les vues
app.use((req, res, next) => {
    res.locals.user         = req.session.user || null;
    res.locals.isAdmin      = req.session.isAdmin || false;
    res.locals.success      = req.flash('success');
    res.locals.error        = req.flash('error');
    res.locals.APP_URL      = process.env.APP_URL || 'http://localhost:3000';
    res.locals.QUIZ_TIMER    = parseInt(process.env.QUIZ_TIMER)    || 10;
    res.locals.QUIZ_QUESTIONS = parseInt(process.env.QUIZ_QUESTIONS) || 5;
    res.locals.APP_VERSION   = version;
    next();
});

// ---- Routes ----
app.use('/',           require('./routes/index'));
app.use('/monument',   require('./routes/monument'));
app.use('/quiz',       require('./routes/quiz'));
app.use('/leaderboard',require('./routes/leaderboard'));
app.use('/auth',       require('./routes/auth'));
app.use('/api',        require('./routes/api'));
app.use('/geo-quiz',   require('./routes/geo-quiz'));
app.use('/admin',      require('./routes/admin'));

// ---- 404 ----
app.use((req, res) => {
    res.status(404).render('404', { pageTitle: 'Page introuvable' });
});

// ---- Démarrage ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Noréaz 2026 démarré sur http://localhost:${PORT}`);
});
