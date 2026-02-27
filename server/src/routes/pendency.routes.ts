import { Router } from 'express';
import * as pendencyController from '../controllers/pendencyController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', pendencyController.listPendencies);
router.post('/', requireRole(['MASTER', 'RH', 'LIDER']), pendencyController.createPendency);
router.put('/:id', requireRole(['MASTER', 'RH', 'LIDER']), pendencyController.updatePendency);
router.delete('/:id', requireRole(['MASTER', 'RH']), pendencyController.deletePendency);

export default router;
