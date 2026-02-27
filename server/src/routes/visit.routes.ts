import { Router } from 'express';
import * as visitController from '../controllers/visitController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', visitController.listVisits);
router.post('/', requireRole(['MASTER', 'LIDER']), visitController.createVisit);
router.put('/:id', requireRole(['MASTER', 'RH', 'LIDER']), visitController.updateVisit);
router.delete('/:id', requireRole(['MASTER']), visitController.deleteVisit);
router.get('/:id', visitController.getVisit);

export default router;
