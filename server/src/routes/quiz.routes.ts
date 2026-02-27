import { Router } from 'express';
import { createQuiz, addQuestion, getQuiz, submitQuiz, deleteQuiz, deleteQuestion, getQuizEditor } from '../controllers/quizController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/', requireRole(['MASTER', 'RH']), createQuiz);
router.delete('/:id', requireRole(['MASTER', 'RH']), deleteQuiz);
router.get('/:id/editor', requireRole(['MASTER', 'RH']), getQuizEditor);
router.post('/questions', requireRole(['MASTER', 'RH']), addQuestion);
router.delete('/questions/:id', requireRole(['MASTER', 'RH']), deleteQuestion);
router.get('/:id', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), getQuiz);
router.post('/:id/submit', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), submitQuiz);

export default router;
