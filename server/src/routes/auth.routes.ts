import { Router } from 'express';
import { login, logout, me } from '../controllers/auth.controller.js';
import { loginRateLimit } from '../middlewares/login-rate-limit.middleware.js';

const router = Router();

router.post('/login', loginRateLimit, login);
router.post('/logout', logout);
router.get('/me', me);

export default router;
