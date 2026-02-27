import { Router } from 'express';
import { listCycles, createCycle, getCycleDetails, assignReviews, updateCycle } from '../controllers/performanceController';
import { getMyReviews, getReviewDetails, submitReview, getMyResults } from '../controllers/reviewController';

const router = Router();

// Cycles (Admin/RH)
router.get('/cycles', listCycles);
router.post('/cycles', createCycle);
router.get('/cycles/:id', getCycleDetails);
router.put('/cycles/:id', updateCycle);

// Assignments
router.post('/cycles/:cycleId/assign', assignReviews);

// Reviews (User)
router.get('/reviews/my', getMyReviews);
router.get('/reviews/results', getMyResults); // New results endpoint
router.get('/reviews/:id', getReviewDetails);
router.post('/reviews/:id/submit', submitReview);

export default router;
