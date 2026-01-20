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

export const getMyResults = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });


        // Get Active Cycle first
        let activeCycle = await prisma.performanceCycle.findFirst({
            where: {
                companyId: user.companyId || undefined,
                status: 'ACTIVE'
            }
        });

        // Fallback for MASTER users: if no cycle found in current context (e.g. viewing another company),
        // try to find one in their home company.
        if (!activeCycle && user.role === 'MASTER') {
            const dbUser = await prisma.user.findUnique({
                where: { id: user.userId },
                select: { companyId: true }
            });

            if (dbUser && dbUser.companyId && dbUser.companyId !== user.companyId) {
                activeCycle = await prisma.performanceCycle.findFirst({
                    where: {
                        companyId: dbUser.companyId,
                        status: 'ACTIVE'
                    }
                });
            }
        }

        if (!activeCycle) return res.json({ available: false, message: 'No active cycle' });

        // Get ALL reviews where I am the REVIEWEE in this cycle
        const reviewsReceived = await prisma.performanceReview.findMany({
            where: {
                cycleId: activeCycle.id,
                revieweeId: user.userId,
                status: 'SUBMITTED' // Only count submitted reviews
            },
            include: {
                answers: true
            }
        });

        if (reviewsReceived.length === 0) return res.json({ available: false, message: 'No reviews received yet' });

        // Aggregate Data
        // Map: Competency -> { self: number, manager: number, peers: number[], peersAvg: number }
        const aggregation: Record<string, { self?: number, manager?: number, peers: number[] }> = {};

        // Helper to init competency key
        const initComp = (comp: string) => {
            if (!aggregation[comp]) aggregation[comp] = { peers: [] };
        };

        reviewsReceived.forEach(review => {
            review.answers.forEach(answer => {
                initComp(answer.competency);

                if (review.type === 'SELF') {
                    aggregation[answer.competency].self = answer.rating || 0;

                } else if (review.type === 'MANAGER') {
                    aggregation[answer.competency].manager = answer.rating || 0;
                } else if (review.type === 'RH') {
                    if (answer.rating) aggregation[answer.competency].peers.push(answer.rating);
                }
            });
        });

        // Format for Recharts: [{ subject: 'Comp A', A: 120, B: 110, fullMark: 150 }]
        // Our case: [{ subject: 'Competency', self: 4, manager: 5, peer: 3.5 }]
        const chartData = Object.entries(aggregation).map(([competency, scores]) => {
            const peerAvg = scores.peers.length > 0
                ? scores.peers.reduce((a, b) => a + b, 0) / scores.peers.length
                : undefined;

            return {
                subject: competency,
                self: scores.self || 0,
                manager: scores.manager || 0,
                peer: peerAvg || 0,
                fullMark: 5
            };
        });

        // Also collect comments
        const comments = reviewsReceived.flatMap(r => r.answers
            .filter(a => a.comment && a.comment.trim() !== '')
            .map(a => ({
                type: r.type,
                competency: a.competency,
                text: a.comment
            }))
        );

        res.json({
            available: true,
            cycle: activeCycle.name,
            chartData,
            comments
        });

    } catch (error) {
        sendError500(res, 'REVIEW_RESULTS_ERROR', error);
    }
};
