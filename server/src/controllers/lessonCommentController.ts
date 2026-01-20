import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// List comments for a lesson
export const listComments = async (req: Request, res: Response) => {
    try {
        const { lessonId } = req.params;

        const comments = await prisma.lessonComment.findMany({
            where: {
                lessonId,
                parentId: null // Only top-level comments
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                        level: true // Gamification badge
                    }
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                                role: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.json(comments);
    } catch (error) {
        console.error('Error listing comments:', error);
        return res.status(500).json({ error: 'Failed to list comments' });
    }
};

// Create a new comment
export const createComment = async (req: Request, res: Response) => {
    try {
        const { lessonId } = req.params;
        const { content, parentId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        const comment = await prisma.lessonComment.create({
            data: {
                content,
                lessonId,
                userId,
                parentId: parentId || null
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        role: true,
                        level: true
                    }
                }
            }
        });

        // Optional: Award tiny XP for engagement (e.g., 1 XP)
        // Not implemented to avoid spam for now.

        return res.status(201).json(comment);
    } catch (error) {
        console.error('Error creating comment:', error);
        return res.status(500).json({ error: 'Failed to create comment' });
    }
};

// Delete a comment (Author or Moderator)
export const deleteComment = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        const userId = req.user?.userId;
        const userRole = req.user?.role;

        const comment = await prisma.lessonComment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        // Allow deletion if user is author OR has elevated role
        const isAuthor = comment.userId === userId;
        const isModerator = userRole === 'MASTER' || userRole === 'RH';

        if (!isAuthor && !isModerator) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        await prisma.lessonComment.delete({
            where: { id: commentId }
        });

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting comment:', error);
        return res.status(500).json({ error: 'Failed to delete comment' });
    }
};
