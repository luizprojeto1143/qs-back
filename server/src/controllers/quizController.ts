import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

// --- Quiz Management ---

export const createQuiz = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || (user.role !== 'MASTER' && user.role !== 'RH')) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { title, description, courseId, moduleId, minScore } = req.body;

        const quiz = await prisma.quiz.create({
            data: {
                title,
                description,
                courseId,
                moduleId,
                minScore: minScore || 60
            }
        });

        res.status(201).json(quiz);
    } catch (error) {
        sendError500(res, ERROR_CODES.QUIZ_CREATE, error);
    }
};

export const deleteQuiz = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || (user.role !== 'MASTER' && user.role !== 'RH')) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.quiz.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        sendError500(res, ERROR_CODES.QUIZ_DELETE, error);
    }
};

export const deleteQuestion = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || (user.role !== 'MASTER' && user.role !== 'RH')) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await prisma.question.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        sendError500(res, ERROR_CODES.QUIZ_DEL_QUESTION, error);
    }
};

export const getQuizEditor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user || (user.role !== 'MASTER' && user.role !== 'RH')) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                questions: {
                    include: {
                        options: true // Include isCorrect for editor
                    }
                }
            }
        });

        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

        res.json(quiz);
    } catch (error) {
        sendError500(res, ERROR_CODES.QUIZ_GET_EDITOR, error);
    }
};

export const addQuestion = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || (user.role !== 'MASTER' && user.role !== 'RH')) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const { quizId, text, type, options } = req.body;

        const question = await prisma.question.create({
            data: {
                quizId,
                text,
                type,
                options: {
                    create: options.map((opt: any) => ({
                        text: opt.text,
                        isCorrect: opt.isCorrect
                    }))
                }
            },
            include: { options: true }
        });

        res.status(201).json(question);
    } catch (error) {
        sendError500(res, ERROR_CODES.QUIZ_ADD_QUESTION, error);
    }
};

// --- Quiz Taking ---

export const getQuiz = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                questions: {
                    include: {
                        options: {
                            select: { id: true, text: true } // Don't reveal isCorrect
                        }
                    }
                }
            }
        });

        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

        res.json(quiz);
    } catch (error) {
        sendError500(res, ERROR_CODES.QUIZ_GET, error);
    }
};

export const submitQuiz = async (req: Request, res: Response) => {
    try {
        const { id } = req.params; // Quiz ID
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        interface QuizAnswer {
            questionId: string;
            optionId: string;
        }

        const { answers } = req.body; // Array of { questionId, optionId }

        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                questions: {
                    include: { options: true }
                }
            }
        });

        if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

        let correctCount = 0;
        const totalQuestions = quiz.questions.length;

        // Calculate Score
        const userAnswersData = (answers as QuizAnswer[]).map((ans) => {
            const question = quiz.questions.find(q => q.id === ans.questionId);
            const selectedOption = question?.options.find(o => o.id === ans.optionId);

            if (selectedOption?.isCorrect) {
                correctCount++;
            }

            return {
                questionId: ans.questionId,
                optionId: ans.optionId
            };
        });

        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = score >= quiz.minScore;

        // Save Attempt
        const attempt = await prisma.userQuizAttempt.create({
            data: {
                userId: user.userId,
                quizId: id,
                score,
                passed,
                answers: {
                    create: userAnswersData
                }
            }
        });

        res.json({
            attemptId: attempt.id,
            score,
            passed,
            minScore: quiz.minScore
        });

    } catch (error) {
        sendError500(res, ERROR_CODES.QUIZ_SUBMIT, error);
    }
};
