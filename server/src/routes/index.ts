import { Router } from 'express';
import authRoutes from './auth.routes.js';
import forgeCounterRoutes from './forge-counter.routes.js';
import helloRoutes from './hello.routes.js';
import visitsRoutes from './visits.routes.js';

const router = Router();

// Cada recurso tiene su fichero de rutas, montado bajo /api/<recurso>
router.use('/auth', authRoutes);
router.use('/hello', helloRoutes);
router.use('/forge-counter', forgeCounterRoutes);
router.use('/visits', visitsRoutes);

export default router;
