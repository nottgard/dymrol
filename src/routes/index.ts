import { Router } from 'express';
import helloRoutes from './hello.routes.js';

const router = Router();

// Cada recurso tiene su fichero de rutas, montado bajo /api/<recurso>
router.use('/hello', helloRoutes);

export default router;
