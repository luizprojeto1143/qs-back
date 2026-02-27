import prisma from '../prisma';

export const reviewService = {
    async getAggregatedResults(userId: string, companyId?: string, userRole?: string) {
        // Get Active Cycle first
        let activeCycle = await prisma.performanceCycle.findFirst({
            where: {
                companyId: companyId || undefined,
                status: 'ACTIVE'
            }
        });

        // Fallback for MASTER users
        if (!activeCycle && userRole === 'MASTER') {
            const dbUser = await prisma.user.findUnique({
                where: { id: userId },
                select: { companyId: true }
            });

            if (dbUser && dbUser.companyId && dbUser.companyId !== companyId) {
                activeCycle = await prisma.performanceCycle.findFirst({
                    where: {
                        companyId: dbUser.companyId,
                        status: 'ACTIVE'
                    }
                });
            }
        }

        if (!activeCycle) return { available: false, message: 'Nenhum ciclo ativo encontrado' };

        // Get ALL reviews where I am the REVIEWEE in this cycle
        const reviewsReceived = await prisma.performanceReview.findMany({
            where: {
                cycleId: activeCycle.id,
                revieweeId: userId,
                status: 'SUBMITTED'
            },
            include: {
                answers: true
            }
        });

        if (reviewsReceived.length === 0) return { available: false, message: 'Nenhuma avaliação recebida ainda' };

        // Aggregate Data
        const aggregation: Record<string, { self?: number, manager?: number, peers: number[] }> = {};

        reviewsReceived.forEach((review: any) => {
            review.answers.forEach((answer: any) => {
                if (!aggregation[answer.competency]) {
                    aggregation[answer.competency] = { peers: [] };
                }

                if (review.type === 'SELF') {
                    aggregation[answer.competency].self = answer.rating || 0;
                } else if (review.type === 'MANAGER') {
                    aggregation[answer.competency].manager = answer.rating || 0;
                } else if (review.type === 'RH') {
                    if (answer.rating) aggregation[answer.competency].peers.push(answer.rating);
                }
            });
        });

        // Format for Chart
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

        // Collect comments
        const comments = reviewsReceived.flatMap((r: any) => r.answers
            .filter((a: any) => a.comment && a.comment.trim() !== '')
            .map((a: any) => ({
                type: r.type,
                competency: a.competency,
                text: a.comment
            }))
        );

        return {
            available: true,
            cycle: activeCycle.name,
            chartData,
            comments
        };
    }
};
