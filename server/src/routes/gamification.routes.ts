import { Router } from 'express';
import * as gamificationController from '../controllers/gamificationController';

const router = Router();

router.get('/profile', gamificationController.getMyProfile);
router.get('/profile/:userId', gamificationController.getUserProfile);
router.get('/leaderboard', gamificationController.getLeaderboard);
router.get('/achievements', gamificationController.getAchievements);
router.get('/xp-values', gamificationController.getXPValues);

export default router;
