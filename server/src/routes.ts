import { Router } from 'express';
import { authenticateToken, requireRole } from './middleware/authMiddleware';
import { rateLimiter } from './middleware/rateLimiter';

// Import Modular Routes
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import universityRoutes from './routes/university.routes';
import qsInclusionRoutes from './routes/qsInclusion.routes';
import talentRoutes from './routes/talent.routes';
import collaboratorRoutes from './routes/collaborator.routes';
import feedRoutes from './routes/feed.routes';
import visitRoutes from './routes/visit.routes';
import pendencyRoutes from './routes/pendency.routes';
import scheduleRoutes from './routes/schedule.routes';
import reportRoutes from './routes/report.routes';
import settingsRoutes from './routes/settings.routes';
import librasRoutes from './routes/libras.routes';
import specialistRoutes from './routes/specialist.routes';
import pdiRoutes from './routes/pdi.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';
import quizRoutes from './routes/quiz.routes';
import aiRoutes from './routes/ai.routes';
import gamificationRoutes from './routes/gamification.routes';
import interpreterRoutes from './routes/interpreterRoutes';

// Import Remaining Controllers/Middlewares
import * as healthController from './controllers/healthController';
import * as authController from './controllers/authController';
import * as uploadController from './controllers/uploadController';
import { workScheduleController, dayOffController } from './controllers/workScheduleController';

const router = Router();

// Public Routes
router.get('/status', healthController.checkStatus);
router.use('/auth', authRoutes);
router.use('/', companyRoutes); // Mounts /companies, /sectors, /areas, /structure, /public/areas

// Protected Routes Middleware
router.use(authenticateToken);

// User Profile Route
router.get('/me', authController.getProfile);

// Mount Modular Routes
router.use('/university', universityRoutes);
router.use('/talent', talentRoutes);
router.use('/gamification', gamificationRoutes);
router.use('/collaborators', collaboratorRoutes);
router.use('/feed', feedRoutes);
router.use('/visits', visitRoutes);
router.use('/pendencies', pendencyRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/reports', reportRoutes); // Includes dashboard routes
router.use('/settings', settingsRoutes);
router.use('/libras', librasRoutes);
router.use('/specialists', specialistRoutes);
router.use('/pdis', pdiRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/quizzes', quizRoutes);
router.use('/ai', aiRoutes);
router.use('/interpreter', interpreterRoutes);

// Days Off / Work Schedule (QS Inclusion specific context usually, but mounting here for backward compatibility)
router.post('/days-off', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), dayOffController.create);
router.get('/days-off/my-requests', dayOffController.myRequests);
router.get('/days-off/pending', requireRole(['MASTER', 'RH', 'LIDER']), dayOffController.listPending);
router.post('/days-off/:id/review', requireRole(['MASTER', 'RH', 'LIDER']), dayOffController.review);
router.get('/collaborators/:collaboratorId/days-off', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), dayOffController.listByCollaborator);
router.delete('/days-off/:id', requireRole(['MASTER', 'RH', 'LIDER', 'COLABORADOR']), dayOffController.delete);

// Mount QS Inclusion Main Hub
router.use('/', qsInclusionRoutes);

// Upload Routes
router.post('/upload', rateLimiter, uploadController.uploadMiddleware, uploadController.handleUploadError, uploadController.uploadFile);

export default router;
