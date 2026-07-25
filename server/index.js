import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import register from './auth/register.js';
import login from './auth/login.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'dist', 'public');
const port = Number(process.env.PORT || 3000);
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

app.post('/auth/register', register);
app.post('/auth/login', login);

app.use(express.static(publicDir, { index: 'index.html' }));

// SPA fallback for the client-side routes, while leaving unknown API routes
// as JSON 404 responses.
app.use((req, res, next) => {
  if (req.method === 'GET' && req.accepts('html')) {
    res.sendFile(path.join(publicDir, 'index.html'), (error) => {
      if (error) next(error);
    });
    return;
  }
  next();
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Tales Hero production server listening on port ${port}`);
});