import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getRHDashboardStats = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const companyId = user.companyId;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Execute independent queries in parallel
        // Execute queries independently to prevent one failure from crashing the whole dashboard
        const totalCollaborators = await prisma.user.count({
            where: { companyId, role: 'COLABORADOR', active: true }
        }).catch(() => 0);

        const visitsThisMonth = await prisma.visit.count({
            where: { companyId, date: { gte: firstDayOfMonth } }
        }).catch(() => 0);

        const openPendencies = await prisma.pendingItem.count({
            where: { companyId, status: 'PENDENTE' }
        }).catch(() => 0);

        const totalPendencies = await prisma.pendingItem.count({ where: { companyId } }).catch(() => 0);
        const resolvedPendencies = await prisma.pendingItem.count({ where: { companyId, status: 'RESOLVIDA' } }).catch(() => 0);

        const completedCourses = await prisma.enrollment.count({
            where: { user: { companyId }, completed: true }
        }).catch(() => 0);

        const pcdCount = await prisma.collaboratorProfile.count({
            where: {
                user: { companyId, active: true },
                disabilityType: { not: 'Nenhuma' }
            }
        }).catch(() => 0);

        // Complex query: Sectors
        let sectors: any[] = [];
        try {
            sectors = await prisma.sector.findMany({
                where: { companyId },
                select: {
                    name: true,
                    areas: {
                        select: {
                            _count: {
                                select: {
                                    users: { where: { active: true } }
                                }
                            },
                            users: {
                                where: {
                                    active: true,
                                    enrollments: { some: {} }
                                },
                                select: { id: true }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching sectors for dashboard:', error);
            sectors = [];
        }

        const mostWatchedCourses = await prisma.course.findMany({
            where: { companyId },
            include: { _count: { select: { enrollments: true } } },
            orderBy: { enrollments: { _count: 'desc' } },
            take: 5
        }).catch(() => []);

        const recentActivity = await prisma.visit.findMany({
            where: { companyId },
            take: 5,
            orderBy: { date: 'desc' },
            select: {
                id: true,
                date: true,
                area: { select: { name: true } },
                master: { select: { name: true } }
            }
        }).catch(() => []);

        // Calculate derived metrics
        const resolutionRate = totalPendencies > 0
            ? Math.round((resolvedPendencies / totalPendencies) * 100)
            : 0;

        const pcdPercentage = totalCollaborators > 0
            ? Math.round((pcdCount / totalCollaborators) * 100)
            : 0;

        const sectorEngagement = sectors.map(sector => {
            const totalUsers = sector.areas.reduce((acc: number, area: any) => acc + area._count.users, 0);
            const activeUsers = sector.areas.reduce((acc: number, area: any) => acc + area.users.length, 0);

            return {
                name: sector.name,
                engagement: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
            };
        });

        const formattedMostWatched = mostWatchedCourses.map(course => ({
            id: course.id,
            title: course.title,
            views: course._count?.enrollments || 0
        }));

        res.json({
            stats: {
                totalCollaborators,
                visitsThisMonth,
                openPendencies,
                resolutionRate: `${resolutionRate}%`,
                completedCourses,
                pcdPercentage: `${pcdPercentage}%`
            },
            sectorEngagement,
            mostWatchedCourses: formattedMostWatched,
            recentActivity: recentActivity.map(visit => ({
                id: visit.id,
                description: `Nova visita registrada: ${visit.area?.name || 'Geral'}`,
                time: visit.date,
                author: visit.master?.name || 'Desconhecido'
            }))
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error fetching stats' });
    }
};

export const getMasterDashboardStats = async (req: Request, res: Response) => {
    try {
        const companyId = req.headers['x-company-id'] as string;
        const whereClause = companyId ? { companyId } : {};

        // 1. Total Collaborators
        const totalCollaborators = await prisma.user.count({
            where: {
                role: 'COLABORADOR',
                ...whereClause
            }
        });

        // 2. Total Visits (Acompanhamentos)
        const totalVisits = await prisma.visit.count({
            where: whereClause
        });

        // 3. Open Pendencies
        const openPendencies = await prisma.pendingItem.count({
            where: {
                status: 'PENDENTE',
                ...whereClause
            }
        });

        // 4. Schedules (Agendamentos)
        const futureSchedules = await prisma.schedule.count({
            where: {
                date: {
                    gte: new Date()
                },
                ...whereClause
            }
        });

        // 5. Recent Activity (Last 5 visits)
        const recentActivity = await prisma.visit.findMany({
            where: whereClause,
            take: 5,
            orderBy: { date: 'desc' },
            include: {
                area: { select: { name: true } },
                master: { select: { name: true } }
            }
        });

        res.json({
            stats: {
                collaborators: totalCollaborators,
                visits: totalVisits,
                pendencies: openPendencies,
                schedules: futureSchedules
            },
            recentActivity: recentActivity.map(visit => ({
                id: visit.id,
                description: `Nova visita registrada: ${visit.area?.name || 'Geral'}`,
                time: visit.date,
                author: visit.master.name
            }))
        });
    } catch (error) {
        console.error('Error fetching master dashboard stats:', error);
        res.status(500).json({ error: 'Error fetching stats' });
    }
};
