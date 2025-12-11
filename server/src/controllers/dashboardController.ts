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

        // 1. Total Collaborators
        const totalCollaborators = await prisma.user.count({
            where: {
                companyId,
                role: 'COLABORADOR',
                active: true
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

        // --- New Metrics for University ---

        // 5. Total Completed Courses
        const completedCourses = await prisma.enrollment.count({
            where: {
                user: { companyId },
                completed: true
            }
        });

        // 6. PCD Percentage
        const pcdCount = await prisma.collaboratorProfile.count({
            where: {
                user: { companyId, active: true },
                disabilityType: { not: 'Nenhuma' } // Assuming 'Nenhuma' or null means no disability
            }
        });

        const pcdPercentage = totalCollaborators > 0
            ? Math.round((pcdCount / totalCollaborators) * 100)
            : 0;

        // 7. Top Sectors by Engagement (Enrollments count)
        const enrollmentsBySector = await prisma.enrollment.groupBy({
            by: ['userId'],
            where: { user: { companyId } },
            _count: true
        });

        // We need to join with users to get the sector. Prisma groupBy doesn't support relation join directly in this way easily for aggregation
        // So we fetch users and aggregate manually or use a raw query. 
        // Let's use a simpler approach: Fetch all enrollments with user sector and aggregate in code for now (assuming not huge data yet)
        // Or better: Fetch sectors and count enrollments for each.

        const sectors = await prisma.sector.findMany({
            where: { companyId },
            include: {
                areas: {
                    include: {
                        users: {
                            include: {
                                enrollments: true
                            }
                        }
                    }
                }
            }
        });

        const sectorEngagement = sectors.map(sector => {
            let totalEnrollments = 0;
            let totalUsers = 0;

            sector.areas.forEach(area => {
                totalUsers += area.users.length;
                area.users.forEach(u => {
                    totalEnrollments += u.enrollments.length;
                });
            });

            return {
                name: sector.name,
                enrollments: totalEnrollments,
                avgPerUser: totalUsers > 0 ? (totalEnrollments / totalUsers).toFixed(1) : 0
            };
        }).sort((a, b) => b.enrollments - a.enrollments).slice(0, 5);


        // 8. Most Watched Courses
        const mostWatchedCourses = await prisma.course.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { enrollments: true }
                }
            },
            orderBy: {
                enrollments: {
                    _count: 'desc'
                }
            },
            take: 5
        });

        const formattedMostWatched = mostWatchedCourses.map(course => ({
            id: course.id,
            title: course.title,
            views: course._count.enrollments
        }));

        // 9. Recent Activity (Last 5 visits)
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
                author: visit.master.name
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
