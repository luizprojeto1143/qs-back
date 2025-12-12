import { Router } from 'express';
import * as courseController from '../controllers/courseController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/courses', courseController.listCourses);
router.post('/courses', requireRole(['MASTER', 'RH']), courseController.createCourse);
router.put('/courses/:id', requireRole(['MASTER', 'RH']), courseController.updateCourse);
router.delete('/courses/:id', requireRole(['MASTER', 'RH']), courseController.deleteCourse);

router.post('/modules', requireRole(['MASTER', 'RH']), courseController.createModule);
router.post('/lessons', requireRole(['MASTER', 'RH']), courseController.createLesson);

router.get('/courses/:id', courseController.getCourseDetails);
router.post('/progress', courseController.updateLessonProgress);

router.get('/courses/reports/progress', requireRole(['MASTER', 'RH']), courseController.getCompanyProgress);
router.get('/courses/reports/analytics', requireRole(['MASTER', 'RH']), courseController.getAnalytics);
router.get('/courses/users/:userId', requireRole(['MASTER', 'RH']), courseController.getUserUniversityDetails);

export default router;
