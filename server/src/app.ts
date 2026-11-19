import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();

app.use(express.json());

// --- API ---
app.use('/api', routes);

// --- Front en producción (client/dist) ---
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(dist));
  app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}
