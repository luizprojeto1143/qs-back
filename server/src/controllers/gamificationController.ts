import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import * as gamificationService from '../services/gamificationService';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

/**
 * @swagger
 * /gamification/profile:
 *   get:
 *     summary: Get current user's gamification profile
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User gamification profile with XP, level, stats and achievements
 */
export const getMyProfile = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const profile = await gamificationService.getGamificationProfile(user.userId);
        res.json(profile);
    } catch (error) {
        sendError500(res, ERROR_CODES.GAMIF_PROFILE, error);
    }
};

/**
 * @swagger
 * /gamification/profile/{userId}:
 *   get:
 *     summary: Get a specific user's gamification profile (admin only)
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 */
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Only MASTER, RH, or same user can view profiles
        const { userId } = req.params;
        if (!['MASTER', 'RH'].includes(user.role) && user.userId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const profile = await gamificationService.getGamificationProfile(userId);
        res.json(profile);
    } catch (error) {
        sendError500(res, ERROR_CODES.GAMIF_PROFILE, error);
    }
};

/**
 * @swagger
 * /gamification/leaderboard:
 *   get:
 *     summary: Get gamification leaderboard
 *     tags: [Gamification]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 */
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const limit = parseInt(req.query.limit as string) || 10;

        // For non-MASTER users, filter by their company
        const companyId = user.role === 'MASTER' ? undefined : (user.companyId ?? undefined);

        const leaderboard = await gamificationService.getLeaderboard(companyId, limit);
        res.json(leaderboard);
    } catch (error) {
        sendError500(res, ERROR_CODES.GAMIF_LEADERBOARD, error);
    }
};

/**
 * @swagger
 * /gamification/achievements:
 *   get:
 *     summary: Get all available achievements
 *     tags: [Gamification]
 */
export const getAchievements = async (_req: Request, res: Response) => {
    try {
        const achievements = Object.values(gamificationService.ACHIEVEMENTS);
        res.json(achievements);
    } catch (error) {
        sendError500(res, ERROR_CODES.GAMIF_ACHIEVEMENTS, error);
    }
};

/**
 * @swagger
 * /gamification/xp-values:
 *   get:
 *     summary: Get XP values for different actions
 *     tags: [Gamification]
 */
export const getXPValues = async (_req: Request, res: Response) => {
    try {
        res.json(gamificationService.XP_VALUES);
    } catch (error) {
        sendError500(res, ERROR_CODES.GAMIF_ACHIEVEMENTS, error);
    }
};
