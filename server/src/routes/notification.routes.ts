import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', notificationController.listNotifications);
router.put('/:id/read', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

export default router;
