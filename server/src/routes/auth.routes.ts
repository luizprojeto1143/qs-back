import { Router } from 'express';
import * as authController from '../controllers/authController';
import { rateLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', rateLimiter, authController.login);
router.post('/register-collaborator', rateLimiter, authController.registerCollaborator);
router.get('/me', authenticateToken, authController.getProfile);

export default router;
