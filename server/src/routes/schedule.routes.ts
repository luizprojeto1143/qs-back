import { Router } from 'express';
import * as scheduleController from '../controllers/scheduleController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), scheduleController.createSchedule);
router.get('/', scheduleController.listSchedules);
router.put('/:id', requireRole(['MASTER', 'RH']), scheduleController.updateScheduleStatus);

export default router;
