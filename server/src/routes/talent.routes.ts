import { Router } from 'express';
import { listCycles, createCycle, getCycleDetails, assignReviews } from '../controllers/performanceController';
import { getMyReviews, getReviewDetails, submitReview } from '../controllers/reviewController';

const router = Router();

// Cycles (Admin/RH)
router.get('/cycles', listCycles);
router.post('/cycles', createCycle);
router.get('/cycles/:id', getCycleDetails);

// Assignments
router.post('/cycles/:cycleId/assign', assignReviews);

// Reviews (User)
router.get('/reviews/my', getMyReviews);
router.get('/reviews/:id', getReviewDetails);
router.post('/reviews/:id/submit', submitReview);

export default router;
