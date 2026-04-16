const nodemailer = require('nodemailer');

const BRAND_COLOR = '#8C2333'; // bordeaux Noréaz

const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    requireTLS: true, // force STARTTLS
    tls: { minVersion: 'TLSv1.2' },
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Échappement HTML pour empêcher l'injection via first_name (ou autre)
function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

const notifHeaders = {
    'Precedence':               'bulk',
    'X-Auto-Response-Suppress': 'OOF, AutoReply',
};

function messageId() {
    return `<${Date.now()}.${Math.random().toString(36).slice(2)}.noreaz2026@digitme.fun>`;
}

async function sendVerificationEmail(to, firstName, token) {
    const url = `${process.env.APP_URL}/auth/verify/${token}`;
    const name = escapeHtml(firstName);
    await transporter.sendMail({
        from: `"Noréaz 2026" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Confirmez votre adresse e-mail — Noréaz 2026',
        headers: { ...notifHeaders, 'Message-ID': messageId() },
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                <h2 style="color:#1a1a1a">Bonjour ${name} !</h2>
                <p>Merci de vous être inscrit à la chasse aux trésors <strong>Noréaz 2026</strong>.</p>
                <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse e-mail :</p>
                <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:${BRAND_COLOR};color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
                    Confirmer mon e-mail
                </a>
                <p style="color:#888;font-size:12px">Ce lien est valable 24 heures. Si vous n'avez pas créé de compte, ignorez cet e-mail.</p>
            </div>
        `,
    });
}

async function sendPasswordResetEmail(to, firstName, token) {
    const url = `${process.env.APP_URL}/auth/reset-password/${token}`;
    const name = escapeHtml(firstName);
    await transporter.sendMail({
        from: `"Noréaz 2026" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Réinitialisation de votre mot de passe — Noréaz 2026',
        headers: { ...notifHeaders, 'Message-ID': messageId() },
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
                <h2 style="color:#1a1a1a">Bonjour ${name} !</h2>
                <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
                <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :</p>
                <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:${BRAND_COLOR};color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
                    Réinitialiser mon mot de passe
                </a>
                <p style="color:#888;font-size:12px">Ce lien est valable 1 heure. Si vous n'avez pas fait cette demande, ignorez cet e-mail.</p>
            </div>
        `,
    });
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
