import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { requireRole } from '../middleware/authMiddleware';

const router = Router();

// Terms of Use
router.get('/terms', settingsController.getTerms);
router.get('/terms/status', settingsController.checkTermsStatus);
router.post('/terms', requireRole(['MASTER', 'RH']), settingsController.updateTerms);
router.post('/terms/accept', settingsController.acceptTerms);
router.get('/terms/report', requireRole(['MASTER', 'RH']), settingsController.getTermsAcceptanceReport);

// Feed Categories
router.get('/feed-categories', settingsController.getFeedCategories);
router.post('/feed-categories', requireRole(['MASTER', 'RH']), settingsController.createFeedCategory);
router.delete('/feed-categories/:id', requireRole(['MASTER', 'RH']), settingsController.deleteFeedCategory);

// Shifts
router.get('/shifts', settingsController.getShifts);
router.post('/shifts', requireRole(['MASTER', 'RH']), settingsController.createShift);
router.put('/shifts/:id', requireRole(['MASTER', 'RH']), settingsController.updateShift);
router.delete('/shifts/:id', requireRole(['MASTER', 'RH']), settingsController.deleteShift);

// Availability
router.get('/availability', settingsController.getAvailability);
router.post('/availability', requireRole(['MASTER', 'RH']), settingsController.updateAvailability);

export default router;
