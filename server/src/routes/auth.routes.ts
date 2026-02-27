import { Router } from 'express';
import * as authController from '../controllers/authController';
import { rateLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', authController.register);
router.post('/login', rateLimiter, authController.login);
router.post('/register-collaborator', rateLimiter, authController.registerCollaborator);
router.get('/me', authenticateToken, authController.getProfile);

router.post('/2fa/setup', authenticateToken, authController.setup2FA);
router.post('/2fa/verify', authenticateToken, authController.verify2FA);
router.post('/2fa/disable', authenticateToken, authController.disable2FA);

export default router;
