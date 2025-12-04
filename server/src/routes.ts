import { Router } from 'express';
import * as authController from './controllers/authController';
import * as companyController from './controllers/companyController';
import * as collaboratorController from './controllers/collaboratorController';
import { authenticateToken } from './middleware/authMiddleware';

const router = Router();

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Protected Routes
router.use(authenticateToken);

router.get('/me', (req, res) => {
    res.json({ user: (req as any).user });
});

// Structure Routes
router.get('/structure', companyController.getStructure);

router.get('/companies', companyController.listCompanies);
router.post('/companies', companyController.createCompany);

router.get('/sectors', companyController.listSectors);
router.post('/sectors', companyController.createSector);

router.get('/areas', companyController.listAreas);
router.post('/areas', companyController.createArea);

// Collaborator Routes
router.get('/collaborators', collaboratorController.listCollaborators);
router.post('/collaborators', collaboratorController.createCollaborator);
router.get('/collaborators/:id', collaboratorController.getCollaborator);

// Feed Routes
// Feed Routes
import * as feedController from './controllers/feedController';
router.get('/feed', feedController.listPosts);
router.post('/feed', feedController.createPost);

// Visit Routes
import * as visitController from './controllers/visitController';
router.get('/visits', visitController.listVisits);
router.post('/visits', visitController.createVisit);
router.get('/visits/:id', visitController.getVisit);

// Pendency Routes
import * as pendencyController from './controllers/pendencyController';
router.get('/pendencies', pendencyController.listPendencies);
router.post('/pendencies', pendencyController.createPendency);
router.put('/pendencies/:id', pendencyController.updatePendency);

// Schedule Routes
import * as scheduleController from './controllers/scheduleController';
router.post('/schedules', scheduleController.createSchedule);
router.get('/schedules', scheduleController.listSchedules);
router.put('/schedules/:id', scheduleController.updateScheduleStatus);

// Dashboard Routes
import * as dashboardController from './controllers/dashboardController';
router.get('/dashboard/rh', dashboardController.getRHDashboardStats);

// Report Routes
import * as reportController from './controllers/reportController';
router.get('/reports', reportController.listReports);
router.post('/reports', reportController.generateReport);

// Settings Routes
import * as settingsController from './controllers/settingsController';
router.get('/settings/terms', settingsController.getTerms);
router.post('/settings/terms', settingsController.updateTerms);
router.get('/settings/feed-categories', settingsController.getFeedCategories);
router.post('/settings/feed-categories', settingsController.createFeedCategory);
router.delete('/settings/feed-categories/:name', settingsController.deleteFeedCategory);

export default router;
