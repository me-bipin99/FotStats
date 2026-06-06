import { Router } from 'express';
import { login, register, me } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/me', requireAuth, me as any);

export default router;
