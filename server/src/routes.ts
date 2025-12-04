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

// Schedule Routes
import * as scheduleController from './controllers/scheduleController';
router.post('/schedules', scheduleController.createSchedule);
router.get('/schedules', scheduleController.listSchedules);

// Dashboard Routes
import * as dashboardController from './controllers/dashboardController';
router.get('/dashboard/rh', dashboardController.getRHDashboardStats);

export default router;
