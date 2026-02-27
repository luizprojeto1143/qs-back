import { Router } from 'express';
import * as librasController from '../controllers/librasController';
import * as librasCallController from '../controllers/librasCallController';
import { createRoom } from '../controllers/dailyController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

// Libras Central Routes
router.get('/availability', librasController.checkAvailability);
router.get('/settings', requireRole(['MASTER', 'RH']), librasController.getSettings);
router.post('/settings', requireRole(['MASTER', 'RH']), librasController.updateSettings);
router.post('/daily/room', requireRole(['MASTER', 'RH', 'COLABORADOR']), createRoom);

// Libras Call System
router.post('/calls', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), librasCallController.requestCall);
router.get('/calls/pending', requireRole(['MASTER', 'RH']), librasCallController.listPendingCalls);
router.get('/calls/:id/status', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), librasCallController.checkCallStatus);
router.put('/calls/:id/accept', requireRole(['MASTER', 'RH']), librasCallController.acceptCall);
router.put('/calls/:id/status', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), librasCallController.updateCallStatus);
router.post('/calls/:id/invite', requireRole(['MASTER', 'RH']), librasCallController.inviteToCall);

export default router;
