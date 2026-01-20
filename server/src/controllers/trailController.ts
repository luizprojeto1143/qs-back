import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// List all trails (with progress for the current user)
export const listTrails = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const userId = user?.userId;
        const companyId = user?.companyId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const trails = await prisma.learningTrail.findMany({
            where: {
                active: true,
                companyId: companyId
            },
            include: {
                courses: {
                    select: {
                        id: true,
                        duration: true,
                        enrollments: {
                            where: { userId, completed: true }
                        }
                    }
                }
            }
        });

        // Compute progress stats for UI
        const trailsWithStats = trails.map((trail: any) => {
            const totalCourses = trail.courses.length;
            const completedCourses = trail.courses.filter((c: any) => c.enrollments.length > 0).length;
            const progress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
            const totalDuration = trail.courses.reduce((acc: number, curr: any) => acc + curr.duration, 0);

            return {
                id: trail.id,
                title: trail.title,
                description: trail.description,
                progress,
                totalCourses,
                completedCourses,
                totalDuration,
                updatedAt: trail.updatedAt
            };
        });

        return res.json(trailsWithStats);
    } catch (error) {
        console.error('Error listing trails:', error);
        return res.status(500).json({ error: 'Failed to list trails' });
    }
};

// Get details of a specific trail (Nodes/Map data)
export const getTrailDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        const userId = user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const trail = await prisma.learningTrail.findUnique({
            where: { id },
            include: {
                courses: {
                    include: {
                        enrollments: {
                            where: { userId },
                            select: { progress: true, completed: true }
                        }
                    },
                    orderBy: { title: 'asc' } // Ideally should have an 'order' field in relation or Course model
                }
            }
        });

        if (!trail) {
            return res.status(404).json({ error: 'Trail not found' });
        }

        // Transform for Map Visualization
        // Assuming courses are linear for now based on some logic, or just list them
        // In a real V2, we might add a `TrailNode` model for positions
        const nodes = trail.courses.map((course: any, index: number) => ({
            id: course.id,
            title: course.title,
            type: 'COURSE',
            status: course.enrollments[0]?.completed
                ? 'COMPLETED'
                : course.enrollments[0]?.progress > 0
                    ? 'IN_PROGRESS'
                    : (index === 0 || (trail.courses as any)[index - 1].enrollments[0]?.completed) ? 'UNLOCKED' : 'LOCKED',
            data: {
                description: course.description,
                coverUrl: course.coverUrl,
                duration: course.duration,
                progress: course.enrollments[0]?.progress || 0
            }
        }));

        return res.json({
            ...trail,
            nodes
        });

    } catch (error) {
        console.error('Error getting trail details:', error);
        return res.status(500).json({ error: 'Failed to get trail details' });
    }
};

// Create a new trail (RH/Master)
export const createTrail = async (req: Request, res: Response) => {
    try {
        const { title, description } = req.body;
        const user = (req as AuthRequest).user;
        const companyId = user?.companyId;

        if (!companyId) return res.status(400).json({ error: 'Company ID required' });

        const trail = await prisma.learningTrail.create({
            data: {
                title,
                description,
                companyId
            }
        });

        return res.status(201).json(trail);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create trail' });
    }
};
