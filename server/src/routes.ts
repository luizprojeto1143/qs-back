import { Router } from 'express';
import { authenticateToken, requireRole } from './middleware/authMiddleware';
import { rateLimiter } from './middleware/rateLimiter';

// Import Modular Routes
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import universityRoutes from './routes/university.routes';
import qsInclusionRoutes from './routes/qsInclusion.routes';

// Import Controllers for remaining inline routes
import * as collaboratorController from './controllers/collaboratorController';
import * as feedController from './controllers/feedController';
import * as visitController from './controllers/visitController';
import * as pendencyController from './controllers/pendencyController';
import * as scheduleController from './controllers/scheduleController';
import * as dashboardController from './controllers/dashboardController';
import * as reportController from './controllers/reportController';
import * as settingsController from './controllers/settingsController';
import * as librasController from './controllers/librasController';
import * as librasCallController from './controllers/librasCallController';
import * as specialistController from './controllers/specialistController';
import * as specialtyController from './controllers/specialtyController';
import * as pdiController from './controllers/pdiController';
import * as userController from './controllers/userController';
import * as uploadController from './controllers/uploadController';
import * as notificationController from './controllers/notificationController';
import * as workScheduleController from './controllers/workScheduleController';
import * as aiController from './controllers/aiController';
import * as healthController from './controllers/healthController';
import * as authController from './controllers/authController';
import { createRoom } from './controllers/dailyController';
import { createQuiz, addQuestion, getQuiz, submitQuiz, deleteQuiz, deleteQuestion, getQuizEditor } from './controllers/quizController';

const router = Router();

// Mount Modular Routes
router.use('/auth', authRoutes);
router.use('/', companyRoutes); // Mounts /companies, /sectors, /areas, /structure, /public/areas
router.use('/', universityRoutes); // Mounts /courses, etc.
router.use('/', qsInclusionRoutes); // Mounts /qs-score, /settings, /complaints, /work-schedule, /days-off

router.get('/status', healthController.checkStatus);

// Protected Routes Middleware (for inline routes)
router.use(authenticateToken);

// User Profile Route
router.get('/me', authController.getProfile);

// Collaborator Routes
router.get('/collaborators', collaboratorController.listCollaborators);
router.post('/collaborators', requireRole(['MASTER', 'RH']), collaboratorController.createCollaborator);
router.get('/collaborators/:id', collaboratorController.getCollaborator);
router.put('/collaborators/:id', requireRole(['MASTER', 'RH']), collaboratorController.updateCollaborator);

// Feed Routes
router.get('/feed', feedController.listPosts);
router.post('/feed', requireRole(['MASTER', 'RH']), feedController.createPost);
router.put('/feed/:id', requireRole(['MASTER', 'RH']), feedController.updatePost);
router.delete('/feed/:id', requireRole(['MASTER', 'RH']), feedController.deletePost);

// Visit Routes
router.get('/visits', visitController.listVisits);
router.post('/visits', requireRole(['MASTER', 'LIDER']), visitController.createVisit);
router.put('/visits/:id', requireRole(['MASTER', 'RH', 'LIDER']), visitController.updateVisit);
router.get('/visits/:id', visitController.getVisit);

// Pendency Routes
router.get('/pendencies', pendencyController.listPendencies);
router.post('/pendencies', requireRole(['MASTER', 'RH', 'LIDER']), pendencyController.createPendency);
router.put('/pendencies/:id', requireRole(['MASTER', 'RH', 'LIDER']), pendencyController.updatePendency);
router.delete('/pendencies/:id', requireRole(['MASTER', 'RH']), pendencyController.deletePendency);

// Schedule Routes
router.post('/schedules', scheduleController.createSchedule);
router.get('/schedules', scheduleController.listSchedules);
router.put('/schedules/:id', requireRole(['MASTER', 'RH']), scheduleController.updateScheduleStatus);

// Dashboard Routes
router.get('/dashboard/rh', requireRole(['MASTER', 'RH']), dashboardController.getRHDashboardStats);
router.get('/dashboard/master', requireRole(['MASTER']), dashboardController.getMasterDashboardStats);

// Report Routes
router.get('/reports', requireRole(['MASTER', 'RH']), reportController.listReports);
router.post('/reports', requireRole(['MASTER', 'RH']), reportController.generateReport);

// Settings Routes
router.get('/settings/terms', settingsController.getTerms);
router.get('/settings/terms/status', settingsController.checkTermsStatus);
router.post('/settings/terms', requireRole(['MASTER', 'RH']), settingsController.updateTerms);
router.post('/settings/terms/accept', settingsController.acceptTerms);
router.get('/settings/terms/report', requireRole(['MASTER', 'RH']), settingsController.getTermsAcceptanceReport);
router.get('/settings/feed-categories', settingsController.getFeedCategories);
router.post('/settings/feed-categories', requireRole(['MASTER', 'RH']), settingsController.createFeedCategory);
router.delete('/settings/feed-categories/:id', requireRole(['MASTER', 'RH']), settingsController.deleteFeedCategory);

// Shifts
router.get('/settings/shifts', settingsController.getShifts);
router.post('/settings/shifts', requireRole(['MASTER', 'RH']), settingsController.createShift);
router.put('/settings/shifts/:id', requireRole(['MASTER', 'RH']), settingsController.updateShift);
router.delete('/settings/shifts/:id', requireRole(['MASTER', 'RH']), settingsController.deleteShift);

// Availability
router.get('/settings/availability', settingsController.getAvailability);
router.post('/settings/availability', requireRole(['MASTER', 'RH']), settingsController.updateAvailability);

// Libras Central Routes
router.get('/libras/availability', librasController.checkAvailability);
router.get('/settings/libras', requireRole(['MASTER', 'RH']), librasController.getSettings);
router.post('/settings/libras', requireRole(['MASTER', 'RH']), librasController.updateSettings);
router.post('/daily/room', requireRole(['MASTER', 'RH', 'COLABORADOR']), createRoom);

// Libras Call System
router.post('/libras/calls', librasCallController.requestCall);
router.get('/libras/calls/pending', requireRole(['MASTER', 'RH']), librasCallController.listPendingCalls);
router.get('/libras/calls/:id/status', librasCallController.checkCallStatus);
router.put('/libras/calls/:id/accept', requireRole(['MASTER', 'RH']), librasCallController.acceptCall);
router.put('/libras/calls/:id/status', librasCallController.updateCallStatus);
router.post('/libras/calls/:id/invite', requireRole(['MASTER', 'RH']), librasCallController.inviteToCall);

// Specialist Routes
router.get('/specialists', specialistController.listSpecialists);
router.post('/specialists', requireRole(['MASTER', 'RH']), specialistController.createSpecialist);
router.put('/specialists/:id', requireRole(['MASTER', 'RH']), specialistController.updateSpecialist);
router.delete('/specialists/:id', requireRole(['MASTER', 'RH']), specialistController.deleteSpecialist);

// Specialty Routes
router.get('/specialties', specialtyController.listSpecialties);
router.post('/specialties', requireRole(['MASTER', 'RH']), specialtyController.createSpecialty);
router.delete('/specialties/:id', requireRole(['MASTER', 'RH']), specialtyController.deleteSpecialty);

// PDI Routes
router.post('/pdis', pdiController.createPDI);
router.get('/pdis', pdiController.listPDIs);
router.put('/pdis/:id', pdiController.updatePDI);
router.delete('/pdis/:id', pdiController.deletePDI);

// User Management (MASTER only)
// User Management
router.get('/users', requireRole(['MASTER', 'RH', 'LIDER']), userController.listUsers);

// Days Off Routes
router.post('/days-off', workScheduleController.dayOffController.create);
router.get('/days-off/pending', requireRole(['MASTER', 'RH', 'LIDER']), workScheduleController.dayOffController.listPending);
router.post('/days-off/:id/review', requireRole(['MASTER', 'RH', 'LIDER']), workScheduleController.dayOffController.review);
router.get('/collaborators/:collaboratorId/days-off', workScheduleController.dayOffController.listByCollaborator);
router.delete('/days-off/:id', workScheduleController.dayOffController.delete);
router.post('/users', requireRole(['MASTER']), userController.createUser);
router.put('/users/:id', requireRole(['MASTER']), userController.updateUser);
router.delete('/users/:id', requireRole(['MASTER']), userController.deleteUser);

// Upload Routes
router.post('/upload', rateLimiter, uploadController.uploadMiddleware, uploadController.handleUploadError, uploadController.uploadFile);

// Notification Routes
router.get('/notifications', notificationController.listNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);

// Quiz Routes
router.post('/quizzes', requireRole(['MASTER', 'RH']), createQuiz);
router.delete('/quizzes/:id', requireRole(['MASTER', 'RH']), deleteQuiz);
router.get('/quizzes/:id/editor', requireRole(['MASTER', 'RH']), getQuizEditor);
router.post('/quizzes/questions', requireRole(['MASTER', 'RH']), addQuestion);
router.delete('/quizzes/questions/:id', requireRole(['MASTER', 'RH']), deleteQuestion);
router.get('/quizzes/:id', getQuiz);
router.post('/quizzes/:id/submit', submitQuiz);


// AI Analysis Routes
router.post('/ai/analyze', requireRole(['MASTER', 'RH']), aiController.analyzePatterns);
router.get('/ai/alerts', requireRole(['MASTER', 'RH']), aiController.getSmartAlerts);

export default router;
