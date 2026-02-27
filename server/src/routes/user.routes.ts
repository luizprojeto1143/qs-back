import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', requireRole(['MASTER', 'RH', 'LIDER']), userController.listUsers);
router.post('/', requireRole(['MASTER']), userController.createUser);
router.put('/:id', requireRole(['MASTER']), userController.updateUser);
router.delete('/:id', requireRole(['MASTER']), userController.deleteUser);

export default router;
