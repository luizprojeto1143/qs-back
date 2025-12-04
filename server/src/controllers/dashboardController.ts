import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const getRHDashboardStats = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const companyId = user.companyId;

        // 1. Total Collaborators
        const totalCollaborators = await prisma.user.count({
            where: {
                companyId,
                role: 'COLABORADOR'
            }
        });

        // 2. Visits this Month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const visitsThisMonth = await prisma.visit.count({
            where: {
                companyId,
                date: {
                    gte: firstDayOfMonth
                }
            }
        });

        // 3. Open Pendencies
        const openPendencies = await prisma.pendingItem.count({
            where: {
                companyId,
                status: 'PENDENTE'
            }
        });

        // 4. Resolution Rate (Resolved / Total)
        const totalPendencies = await prisma.pendingItem.count({ where: { companyId } });
        const resolvedPendencies = await prisma.pendingItem.count({ where: { companyId, status: 'RESOLVIDA' } });
        const resolutionRate = totalPendencies > 0
            ? Math.round((resolvedPendencies / totalPendencies) * 100)
            : 0;

        // 5. Recent Activity (Last 5 visits)
        const recentActivity = await prisma.visit.findMany({
            where: { companyId },
            take: 5,
            orderBy: { date: 'desc' },
            include: {
                area: { select: { name: true } },
                master: { select: { name: true } }
            }
        });

        res.json({
            stats: {
                totalCollaborators,
                visitsThisMonth,
                openPendencies,
                resolutionRate: `${resolutionRate}%`
            },
            recentActivity: recentActivity.map(visit => ({
                id: visit.id,
                description: `Nova visita registrada: ${visit.area?.name || 'Geral'}`,
                time: visit.date,
                author: visit.master.name
            }))
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error fetching stats' });
    }
};
