import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

export const getMyReviews = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const reviews = await prisma.performanceReview.findMany({
            where: {
                reviewerId: user.userId,
                status: 'PENDING',
                cycle: { status: 'ACTIVE' } // Only show reviews for active cycles
            },
            include: {
                cycle: { select: { name: true, endDate: true } },
                reviewee: { select: { name: true, avatar: true, role: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(reviews);
    } catch (error) {
        sendError500(res, 'REVIEW_LIST_ERROR', error);
    }
};

export const getReviewDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const review = await prisma.performanceReview.findUnique({
            where: { id },
            include: {
                cycle: true,
                reviewee: { select: { name: true, avatar: true, role: true } },
                answers: true
            }
        });

        if (!review) return res.status(404).json({ error: 'Review not found' });

        // Security check: Only the reviewer (or Master/RH?) can see the pending review form
        if (review.reviewerId !== user.userId && !['MASTER', 'RH'].includes(user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(review);
    } catch (error) {
        sendError500(res, 'REVIEW_DETAILS_ERROR', error);
    }
};

export const submitReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { answers } = req.body; // Array of { competency, rating, comment }
        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const review = await prisma.performanceReview.findUnique({ where: { id } });
        if (!review) return res.status(404).json({ error: 'Review not found' });

        if (review.reviewerId !== user.userId) return res.status(403).json({ error: 'You are not the assigned reviewer' });
        if (review.status === 'SUBMITTED') return res.status(400).json({ error: 'Review already submitted' });

        // Save answers in transaction
        await prisma.$transaction(async (tx) => {
            // 1. Delete previous draft answers if any (or just create new ones)
            // For now, allow partial saves? Or full submit? Let's assume full submit for now.
            // If partial, needed upsert. Let's assume full overwrite.
            await tx.reviewAnswer.deleteMany({ where: { reviewId: id } });

            await tx.reviewAnswer.createMany({
                data: answers.map((a: any) => ({
                    reviewId: id,
                    competency: a.competency,
                    rating: a.rating,
                    comment: a.comment
                }))
            });

            // 2. Mark review as SUBMITTED
            await tx.performanceReview.update({
                where: { id },
                data: { status: 'SUBMITTED' }
            });
        });

        res.json({ success: true });
    } catch (error) {
        sendError500(res, 'REVIEW_SUBMIT_ERROR', error);
    }
};
