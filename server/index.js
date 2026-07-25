// ============================================================
//  Tales Hero Indonesia — Express API Server
//  Jalankan: node server/index.js
// ============================================================

import express from 'express';
import register from './auth/register.js';
import login    from './auth/login.js';

const app  = express();
const PORT = process.env.API_PORT ?? 3001;

app.use(express.json());

// ── CORS — izinkan request dari domain resmi ─────────────────
app.use((req, res, next) => {
    const allowed = ['https://taleshero.web.id', 'http://localhost:5000'];
    const origin  = req.headers.origin ?? '';
    if (allowed.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});

// ── Routes ───────────────────────────────────────────────────
app.post('/auth/register', register);
app.post('/auth/login',    login);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[server] ✅ API berjalan di http://localhost:${PORT}`);
});
