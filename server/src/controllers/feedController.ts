import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';
import { createFeedPostSchema } from '../schemas/dataSchemas';

export const createPost = async (req: Request, res: Response) => {
    try {
        const validation = createFeedPostSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { title, description, category, imageUrl, videoLibrasUrl } = validation.data;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Integrity Check: Validate Category
        const categoryExists = await prisma.feedCategory.findFirst({
            where: { name: category, companyId: user.companyId }
        });

        if (!categoryExists) {
            return res.status(400).json({ error: 'Invalid category. Please select an existing category.' });
        }

        // XSS Mitigation: Basic sanitization (strip script tags)
        // In a real app, use 'sanitize-html' library
        const sanitizedDescription = description ? description.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "") : "";

        const post = await prisma.feedPost.create({
            data: {
                title,
                description: sanitizedDescription,
                category,
                imageUrl,
                videoLibrasUrl,
                companyId: user.companyId
            }
        });

        res.status(201).json(post);
    } catch (error) {
        sendError500(res, ERROR_CODES.FEED_CREATE, error);
    }
};

export const listPosts = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const [posts, total] = await Promise.all([
            prisma.feedPost.findMany({
                where: {
                    companyId: user.companyId
                },
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit,
                skip: skip
            }),
            prisma.feedPost.count({ where: { companyId: user.companyId } })
        ]);

        res.json({
            data: posts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        sendError500(res, ERROR_CODES.FEED_LIST, error);
    }
};

export const updatePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validation = createFeedPostSchema.partial().safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { title, description, category, imageUrl, videoLibrasUrl } = validation.data;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Ensure post belongs to user's company
        const existingPost = await prisma.feedPost.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!existingPost) {
            return res.status(404).json({ error: 'Post not found or access denied' });
        }

        const post = await prisma.feedPost.update({
            where: { id },
            data: {
                title,
                description,
                category,
                imageUrl,
                videoLibrasUrl
            }
        });

        res.json(post);
    } catch (error) {
        sendError500(res, ERROR_CODES.FEED_UPDATE, error);
    }
};

export const deletePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Ensure post belongs to user's company
        const existingPost = await prisma.feedPost.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!existingPost) {
            return res.status(404).json({ error: 'Post not found or access denied' });
        }

        await prisma.feedPost.delete({
            where: { id }
        });

        res.status(204).send();
    } catch (error) {
        sendError500(res, ERROR_CODES.FEED_DELETE, error);
    }
};
