import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import * as reportController from '../controllers/reportController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

// Dashboard Routes
router.get('/dashboard/rh', requireRole(['MASTER', 'RH']), dashboardController.getRHDashboardStats);
router.get('/dashboard/master', requireRole(['MASTER']), dashboardController.getMasterDashboardStats);

// Report Routes
router.get('/reports', requireRole(['MASTER', 'RH']), reportController.listReports);
router.post('/reports', requireRole(['MASTER', 'RH']), reportController.generateReport);

export default router;
