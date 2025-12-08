import { Router } from 'express';
import * as authController from './controllers/authController';
import * as companyController from './controllers/companyController';
import * as collaboratorController from './controllers/collaboratorController';
import { authenticateToken } from './middleware/authMiddleware';
import { createRoom } from './controllers/dailyController';

const router = Router();

// Auth Routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/register-collaborator', authController.registerCollaborator); // Public route
router.get('/public/areas/:companyId', companyController.listPublicAreas); // Public route

// Protected Routes
router.use(authenticateToken);

import prisma from './prisma';

router.get('/me', async (req, res) => {
    try {
        const userId = (req as any).user.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { company: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user profile' });
    }
});

// Structure Routes
router.get('/structure', companyController.getStructure);

router.get('/companies', companyController.listCompanies);
router.post('/companies', companyController.createCompany);
router.put('/companies/:id', companyController.updateCompany);

router.get('/sectors', companyController.listSectors);
router.post('/sectors', companyController.createSector);
router.put('/sectors/:id', companyController.updateSector);

router.get('/areas', companyController.listAreas);
router.post('/areas', companyController.createArea);
router.put('/areas/:id', companyController.updateArea);

// Collaborator Routes
router.get('/collaborators', collaboratorController.listCollaborators);
router.post('/collaborators', collaboratorController.createCollaborator);
router.get('/collaborators/:id', collaboratorController.getCollaborator);
router.put('/collaborators/:id', collaboratorController.updateCollaborator);

// Feed Routes
import * as feedController from './controllers/feedController';
router.get('/feed', feedController.listPosts);
router.post('/feed', feedController.createPost);
router.put('/feed/:id', feedController.updatePost);
router.delete('/feed/:id', feedController.deletePost);

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
router.delete('/pendencies/:id', pendencyController.deletePendency);

// Schedule Routes
import * as scheduleController from './controllers/scheduleController';
router.post('/schedules', scheduleController.createSchedule);
router.get('/schedules', scheduleController.listSchedules);
router.put('/schedules/:id', scheduleController.updateScheduleStatus);

// Dashboard Routes
import * as dashboardController from './controllers/dashboardController';
router.get('/dashboard/rh', dashboardController.getRHDashboardStats);
router.get('/dashboard/master', dashboardController.getMasterDashboardStats);

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
router.delete('/settings/feed-categories/:id', settingsController.deleteFeedCategory);

router.get('/settings/shifts', settingsController.getShifts);
router.post('/settings/shifts', settingsController.createShift);
router.delete('/settings/shifts/:id', settingsController.deleteShift);

// Availability
router.get('/settings/availability', settingsController.getAvailability);
router.post('/settings/availability', settingsController.updateAvailability);

// Libras Central Routes
import * as librasController from './controllers/librasController';
router.get('/libras/availability', librasController.checkAvailability);
router.get('/settings/libras', librasController.getSettings);
router.post('/settings/libras', librasController.updateSettings);
router.post('/daily/room', createRoom);

// Libras Call System
import * as librasCallController from './controllers/librasCallController';
router.post('/libras/calls', librasCallController.requestCall);
router.get('/libras/calls/pending', librasCallController.listPendingCalls);
router.get('/libras/calls/:id/status', librasCallController.checkCallStatus);
router.put('/libras/calls/:id/accept', librasCallController.acceptCall);
router.put('/libras/calls/:id/status', librasCallController.updateCallStatus);
router.post('/libras/calls/:id/invite', librasCallController.inviteToCall);

// User Management (MASTER only)
import * as userController from './controllers/userController';
router.get('/users', userController.listUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Upload Routes
import * as uploadController from './controllers/uploadController';
router.post('/upload', uploadController.uploadMiddleware, uploadController.uploadFile);

// Notification Routes
import * as notificationController from './controllers/notificationController';
router.get('/notifications', notificationController.listNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);

export default router;
