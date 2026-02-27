import { Router } from 'express';
import * as collaboratorController from '../controllers/collaboratorController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', collaboratorController.listCollaborators);
router.post('/', requireRole(['MASTER', 'RH']), collaboratorController.createCollaborator);
router.get('/:id', collaboratorController.getCollaborator);
router.put('/:id', requireRole(['MASTER', 'RH']), collaboratorController.updateCollaborator);
router.delete('/:id', requireRole(['MASTER', 'RH']), collaboratorController.deleteCollaborator);

export default router;
