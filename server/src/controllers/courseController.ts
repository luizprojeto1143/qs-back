import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

// --- Courses ---

export const listCourses = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const where: any = { active: true };

        // If user is not MASTER, verify if their company has university enabled
        if (user.role !== 'MASTER') {
            if (!user.companyId) return res.status(403).json({ error: 'No company associated' });

            const company = await prisma.company.findUnique({ where: { id: user.companyId } });
            if (!company || !company.universityEnabled) {
                return res.status(403).json({ error: 'University not enabled for your company' });
            }
        }

        const courses = await prisma.course.findMany({
            where,
            include: {
                modules: {
                    include: { lessons: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(courses);
    } catch (error) {
        console.error('Error listing courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const createCourse = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, description, coverUrl, duration, category } = req.body;

        const course = await prisma.course.create({
            data: {
                title,
                description,
                coverUrl,
                duration: Number(duration),
                category
            }
        });

        res.status(201).json(course);
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, description, coverUrl, duration, category, active } = req.body;

        const course = await prisma.course.update({
            where: { id },
            data: {
                title,
                description,
                coverUrl,
                duration: Number(duration),
                category,
                active
            }
        });

        res.json(course);
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.course.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- Modules ---

export const createModule = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, order, courseId } = req.body;

        const module = await prisma.module.create({
            data: {
                title,
                order: Number(order),
                courseId
            }
        });

        res.status(201).json(module);
    } catch (error) {
        console.error('Error creating module:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- Lessons ---

export const createLesson = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, description, videoUrl, duration, order, moduleId } = req.body;

        const lesson = await prisma.lesson.create({
            data: {
                title,
                description,
                videoUrl,
                duration: Number(duration),
                order: Number(order),
                moduleId
            }
        });

        res.status(201).json(lesson);
    } catch (error) {
        console.error('Error creating lesson:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// --- Progress & Details ---

export const getCourseDetails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                modules: {
                    include: {
                        lessons: {
                            include: {
                                progress: {
                                    where: { userId: user.userId }
                                }
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!course) return res.status(404).json({ error: 'Course not found' });

        res.json(course);
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateLessonProgress = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { lessonId, completed } = req.body;

        const progress = await prisma.lessonProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: user.userId,
                    lessonId
                }
            },
            update: { completed },
            create: {
                userId: user.userId,
                lessonId,
                completed
            }
        });

        // Calculate Course Progress
        // 1. Get course ID from lesson
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { module: true }
        });

        if (lesson) {
            const courseId = lesson.module.courseId;

            // 2. Count total lessons
            const totalLessons = await prisma.lesson.count({
                where: { module: { courseId } }
            });

            // 3. Count completed lessons
            const completedLessons = await prisma.lessonProgress.count({
                where: {
                    userId: user.userId,
                    completed: true,
                    lesson: { module: { courseId } }
                }
            });

            const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            // 4. Update Enrollment
            await prisma.enrollment.upsert({
                where: {
                    userId_courseId: {
                        userId: user.userId,
                        courseId
                    }
                },
                update: {
                    progress: percentage,
                    completed: percentage === 100,
                    completedAt: percentage === 100 ? new Date() : null,
                    updatedAt: new Date()
                },
                create: {
                    userId: user.userId,
                    courseId,
                    progress: percentage,
                    completed: percentage === 100,
                    completedAt: percentage === 100 ? new Date() : null
                }
            });
        }

        res.json(progress);
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getCompanyProgress = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        // Verify if user is RH or MASTER
        if (user.role !== 'RH' && user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const enrollments = await prisma.enrollment.findMany({
            where: {
                user: {
                    companyId: user.companyId,
                    active: true
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        area: { select: { name: true } }
                    }
                },
                course: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(enrollments);
    } catch (error) {
        console.error('Error fetching company progress:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
