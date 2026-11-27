import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { getVisitStats, registerVisit } from '../controllers/visits.controller.js';

const router = Router();

router.post('/', registerVisit);
router.get('/stats', requireAuth, getVisitStats);

export default router;
