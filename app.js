require('dotenv').config();
const express       = require('express');
const session       = require('express-session');
const flash         = require('connect-flash');
const path          = require('path');
const { version }   = require('./package.json');

const app = express();

// ---- Moteur de vues ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---- Middleware ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret:            process.env.SESSION_SECRET || 'noreaz_secret',
    resave:            false,
    saveUninitialized: false,
    cookie:            { maxAge: 7 * 24 * 60 * 60 * 1000 }, // 7 jours
}));

app.use(flash());

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
