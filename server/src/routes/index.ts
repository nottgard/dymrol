import { Router } from 'express';
import forgeCounterRoutes from './forge-counter.routes.js';
import helloRoutes from './hello.routes.js';

const router = Router();

// Cada recurso tiene su fichero de rutas, montado bajo /api/<recurso>
router.use('/hello', helloRoutes);
router.use('/forge-counter', forgeCounterRoutes);

export default router;
