import { Router } from 'express';
import * as feedController from '../controllers/feedController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.get('/', feedController.listPosts);
router.post('/', requireRole(['MASTER', 'RH']), feedController.createPost);
router.put('/:id', requireRole(['MASTER', 'RH']), feedController.updatePost);
router.delete('/:id', requireRole(['MASTER', 'RH']), feedController.deletePost);

export default router;
