import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

// --- Courses ---

export const listCourses = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Filter courses:
        // 1. Created by my company
        // 2. OR visibleToAll is true
        // 3. OR my company is in allowedCompanies
        const courses = await prisma.course.findMany({
            where: {
                active: true,
                OR: [
                    { companyId: user.companyId || '' },
                    { visibleToAll: true },
                    { allowedCompanies: { some: { id: user.companyId || '' } } }
                ]
            },
            include: {
                modules: {
                    include: { lessons: true }
                },
                enrollments: {
                    where: { userId: user.userId }
                },
                allowedCompanies: { select: { id: true, name: true } } // Include for Master to see
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(courses);
    } catch (error) {
        sendError500(res, ERROR_CODES.COURSE_LIST, error);
    }
};

export const createCourse = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, description, coverUrl, duration, category, difficulty, isMandatory, publishedAt, visibleToAll, allowedCompanyIds } = req.body;

        const course = await prisma.course.create({
            data: {
                title,
                description,
                coverUrl,
                duration: Number(duration),
                category,
                difficulty: difficulty || 'Iniciante',
                isMandatory: isMandatory || false,
                publishedAt: publishedAt ? new Date(publishedAt) : null,
                companyId: user.companyId,
                visibleToAll: visibleToAll || false,
                allowedCompanies: allowedCompanyIds && allowedCompanyIds.length > 0 ? {
                    connect: allowedCompanyIds.map((id: string) => ({ id }))
                } : undefined
            }
        });

        res.status(201).json(course);
    } catch (error) {
        sendError500(res, ERROR_CODES.COURSE_CREATE, error);
    }
};

export const updateCourse = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, description, coverUrl, duration, category, difficulty, active, isMandatory, publishedAt, visibleToAll, allowedCompanyIds } = req.body;

        const course = await prisma.course.update({
            where: { id },
            data: {
                title,
                description,
                coverUrl,
                duration: Number(duration),
                category,
                difficulty,
                active,
                isMandatory,
                publishedAt: publishedAt ? new Date(publishedAt) : null,
                visibleToAll: visibleToAll !== undefined ? visibleToAll : undefined,
                allowedCompanies: allowedCompanyIds ? {
                    set: allowedCompanyIds.map((id: string) => ({ id }))
                } : undefined
            }
        });

        res.json(course);
    } catch (error) {
        sendError500(res, ERROR_CODES.COURSE_UPDATE, error);
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
        sendError500(res, ERROR_CODES.COURSE_DELETE, error);
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
        sendError500(res, ERROR_CODES.MODULE_CREATE, error);
    }
};

export const updateModule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, order } = req.body;

        const module = await prisma.module.update({
            where: { id },
            data: {
                title,
                order: order !== undefined ? Number(order) : undefined
            }
        });

        res.json(module);
    } catch (error) {
        sendError500(res, ERROR_CODES.MODULE_UPDATE || 'MOD_UPD', error);
    }
};

export const deleteModule = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Delete associated lessons first
        await prisma.lesson.deleteMany({ where: { moduleId: id } });
        await prisma.module.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        sendError500(res, ERROR_CODES.MODULE_DELETE || 'MOD_DEL', error);
    }
};

// --- Lessons ---

export const createLesson = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, description, videoUrl, duration, order, moduleId, attachments, transcription } = req.body;

        const lesson = await prisma.lesson.create({
            data: {
                title,
                description,
                videoUrl,
                transcription,
                duration: Number(duration),
                order: Number(order),
                moduleId,
                attachments: {
                    create: attachments?.map((att: { name: string; url: string; type: string }) => ({
                        name: att.name,
                        url: att.url,
                        type: att.type
                    }))
                }
            },
            include: { attachments: true }
        });

        res.status(201).json(lesson);
    } catch (error) {
        sendError500(res, ERROR_CODES.LESSON_CREATE, error);
    }
};

export const updateLesson = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, description, videoUrl, duration, order, transcription } = req.body;

        const lesson = await prisma.lesson.update({
            where: { id },
            data: {
                title,
                description,
                videoUrl,
                transcription,
                duration: duration !== undefined ? Number(duration) : undefined,
                order: order !== undefined ? Number(order) : undefined
            }
        });

        res.json(lesson);
    } catch (error) {
        sendError500(res, ERROR_CODES.LESSON_UPDATE || 'LES_UPD', error);
    }
};

export const deleteLesson = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Delete attachments and progress first
        await prisma.lessonAttachment.deleteMany({ where: { lessonId: id } });
        await prisma.lessonProgress.deleteMany({ where: { lessonId: id } });
        await prisma.lesson.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        sendError500(res, ERROR_CODES.LESSON_DELETE || 'LES_DEL', error);
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
                    orderBy: { order: 'asc' },
                    include: {
                        lessons: {
                            include: {
                                progress: {
                                    where: { userId: user.userId }
                                },
                                attachments: true
                            },
                            orderBy: { order: 'asc' }
                        },
                        quizzes: true
                    }
                },
                quizzes: true
            }
        });

        if (!course) return res.status(404).json({ error: 'Course not found' });

        res.json(course);
    } catch (error) {
        sendError500(res, ERROR_CODES.COURSE_GET, error);
    }
};

export const updateLessonProgress = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { lessonId, completed } = req.body;

        // 1. Verify Lesson and Course Access Access first
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { module: { include: { course: { include: { allowedCompanies: true } } } } }
        });

        if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

        const course = lesson.module.course;

        // Access Check Logic
        const isOwnerCompany = course.companyId === user.companyId;
        const isVisibleToAll = course.visibleToAll;
        const isAllowedCompany = course.allowedCompanies.some(c => c.id === user.companyId);
        const canAccess = isOwnerCompany || isVisibleToAll || isAllowedCompany;

        if (!canAccess) {
            return res.status(403).json({ error: 'Access to this course is restricted' });
        }

        // 2. Update Progress
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

        // --- GAMIFICATION (University 2.0) ---
        // Award XP only if completing the lesson
        if (completed) {
            const XP_PER_LESSON = 10;

            // Get current user to update
            const currentUser = await prisma.user.findUnique({
                where: { id: user.userId },
                select: { xp: true, level: true }
            });

            if (currentUser) {
                const newXp = currentUser.xp + XP_PER_LESSON;
                // Simple level formula: Level = 1 + floor(XP / 100)
                const newLevel = 1 + Math.floor(newXp / 100);

                await prisma.user.update({
                    where: { id: user.userId },
                    data: {
                        xp: newXp,
                        level: newLevel
                    }
                });
            }
        }
        // -------------------------------------

        // Calculate Course Progress
        // lesson already fetched above


        if (lesson) {
            const courseId = lesson.module.courseId;

            const totalLessons = await prisma.lesson.count({
                where: { module: { courseId } }
            });

            const completedLessons = await prisma.lessonProgress.count({
                where: {
                    userId: user.userId,
                    completed: true,
                    lesson: { module: { courseId } }
                }
            });

            const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            const enrollment = await prisma.enrollment.upsert({
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

            // Generate Certificate if completed
            if (percentage === 100) {
                const existingCert = await prisma.certificate.findFirst({
                    where: { userId: user.userId, courseId }
                });

                if (!existingCert) {
                    await prisma.certificate.create({
                        data: {
                            userId: user.userId,
                            courseId,
                            code: `CERT-${user.userId.substring(0, 4)}-${courseId.substring(0, 4)}-${Date.now()}`.toUpperCase()
                        }
                    });
                }
            }
        }

        res.json(progress);
    } catch (error) {
        sendError500(res, ERROR_CODES.ENROLL, error);
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
        sendError500(res, ERROR_CODES.COURSE_LIST, error);
    }
};

export const getAnalytics = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        if (user.role !== 'RH' && user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // 1. Most Watched Courses (by enrollment count)
        const courses = await prisma.course.findMany({
            where: {
                OR: [
                    { companyId: user.companyId },
                    { companyId: null } // Global courses
                ]
            },
            include: {
                _count: {
                    select: {
                        enrollments: {
                            where: {
                                user: {
                                    companyId: user.companyId
                                }
                            }
                        }
                    }
                },
                modules: {
                    include: {
                        lessons: {
                            include: {
                                progress: {
                                    where: { user: { companyId: user.companyId } }
                                }
                            }
                        }
                    }
                }
            }
        });

        const mostWatched = courses
            .map(c => ({ title: c.title, students: c._count.enrollments }))
            .sort((a, b) => b.students - a.students)
            .slice(0, 5);

        // 2. Engagement (Active users in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeEnrollments = await prisma.enrollment.count({
            where: {
                user: { companyId: user.companyId },
                updatedAt: { gte: thirtyDaysAgo }
            }
        });

        const totalUsers = await prisma.user.count({
            where: { companyId: user.companyId, active: true }
        });

        const engagementRate = totalUsers > 0 ? Math.round((activeEnrollments / totalUsers) * 100) : 0;

        // 3. Drop-off Heatmap (Average completion per lesson)
        // We'll take the first course as an example or aggregate all
        // For simplicity, let's return data for the most popular course
        const popularCourse = courses[0];
        let heatmap: { lesson: string; completionRate: number }[] = [];

        if (popularCourse) {
            heatmap = popularCourse.modules.flatMap(m =>
                m.lessons.map(l => {
                    const totalStarted = l.progress.length;
                    const completed = l.progress.filter(p => p.completed).length;
                    return {
                        lesson: l.title,
                        completionRate: totalStarted > 0 ? Math.round((completed / totalStarted) * 100) : 0
                    };
                })
            );
        }

        res.json({
            mostWatched,
            engagementRate,
            heatmap
        });

    } catch (error) {
        sendError500(res, ERROR_CODES.COURSE_LIST, error);
    }
};

export const getUserUniversityDetails = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const loggedUser = (req as AuthRequest).user;

        if (!loggedUser || !loggedUser.companyId) return res.status(401).json({ error: 'Unauthorized' });

        // Allow if user is viewing their own profile OR is RH/MASTER
        if (loggedUser.userId !== userId && loggedUser.role !== 'RH' && loggedUser.role !== 'MASTER') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                enrollments: {
                    include: {
                        course: true
                    }
                },
                certificates: {
                    include: {
                        course: true
                    }
                },
                quizAttempts: {
                    include: {
                        quiz: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!user || user.companyId !== loggedUser.companyId) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Calculate total learning time (sum of duration of completed/in-progress lessons or just course duration * progress)
        // A simple approximation: sum of duration of enrolled courses * (progress / 100)
        const totalLearningTimeMinutes = user.enrollments.reduce((acc, curr) => {
            return acc + (curr.course.duration * (curr.progress / 100));
        }, 0);

        const hours = Math.floor(totalLearningTimeMinutes / 60);
        const minutes = Math.round(totalLearningTimeMinutes % 60);

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            },
            stats: {
                coursesCompleted: user.enrollments.filter(e => e.completed).length,
                coursesInProgress: user.enrollments.filter(e => !e.completed).length,
                totalLearningTime: `${hours}h ${minutes}min`,
                certificatesCount: user.certificates.length
            },
            enrollments: user.enrollments.map(e => ({
                id: e.id,
                courseTitle: e.course.title,
                progress: e.progress,
                completed: e.completed,
                completedAt: e.completedAt,
                lastAccess: e.updatedAt
            })),
            certificates: user.certificates.map(c => ({
                id: c.id,
                courseTitle: c.course.title,
                courseDuration: c.course.duration,
                code: c.code,
                issuedAt: c.issuedAt
            })),
            quizAttempts: user.quizAttempts.map(q => ({
                id: q.id,
                quizTitle: q.quiz.title,
                score: q.score,
                passed: q.passed,
                date: q.createdAt
            }))
        });

    } catch (error) {
        sendError500(res, ERROR_CODES.COURSE_GET, error);
    }
};
