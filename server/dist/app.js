import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { trackVisit } from './middlewares/visits.middleware.js';
import routes from './routes/index.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const app = express();
// Tras un proxy/balanceador, req.ip sería el del proxy: define TRUST_PROXY (p.ej. 1) para leer la IP real.
if (process.env.TRUST_PROXY) {
    const hops = Number(process.env.TRUST_PROXY);
    app.set('trust proxy', Number.isNaN(hops) ? process.env.TRUST_PROXY : hops);
}
app.use(express.json());
// Registro de visitas: cada carga de página (HTML) cuenta una visita. Antes del front estático.
app.use(trackVisit);
// --- API ---
app.use('/api', routes);
// --- Front en producción (client/dist) ---
if (process.env.NODE_ENV === 'production') {
    const dist = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(dist));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
