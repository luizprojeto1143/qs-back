import { Router } from 'express';
import * as aiController from '../controllers/aiController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/analyze', requireRole(['MASTER', 'RH']), aiController.analyzePatterns);
router.get('/alerts', requireRole(['MASTER', 'RH']), aiController.getSmartAlerts);

export default router;
