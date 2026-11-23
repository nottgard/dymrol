import { Router } from 'express';
import { addForgeCounter, getForgeCounter } from '../controllers/forge-counter.controller.js';

const router = Router();

router.get('/', getForgeCounter);
router.post('/', addForgeCounter);

export default router;
