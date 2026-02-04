import { Router } from 'express';
import { interpreterController } from '../controllers/interpreterController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Public routes (or protected by company ID token logic if we implemented that, given plan says "Public Link")
// We will allow open access to config and create if we treat it as a "Public Form"
router.get('/public-config/:companyId', interpreterController.getPublicRequestConfig);
router.post('/public-request', interpreterController.createRequest);

// Protected Routes
router.use(authenticateToken);

router.post('/', interpreterController.createRequest); // Internal creation
router.get('/', interpreterController.listRequests);
router.get('/requests', interpreterController.listRequests); // Alias for Dashboard
router.put('/:id/status', interpreterController.updateRequestStatus);
router.put('/:id', interpreterController.updateRequest); // General update (date, theme, etc.)

export default router;
