import { Router } from 'express';
import * as pdiController from '../controllers/pdiController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), pdiController.createPDI);
router.get('/', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), pdiController.listPDIs);
router.put('/:id', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), pdiController.updatePDI);
router.delete('/:id', requireRole(['MASTER', 'RH']), pdiController.deletePDI);

export default router;
