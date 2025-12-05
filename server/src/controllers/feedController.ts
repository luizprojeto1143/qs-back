import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const prisma = new PrismaClient();

export const createPost = async (req: Request, res: Response) => {
    try {
        const { title, description, category, imageUrl, videoLibrasUrl } = req.body;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const post = await prisma.feedPost.create({
            data: {
                title,
                description,
                category,
                imageUrl,
                videoLibrasUrl,
                companyId: user.companyId
            }
        });

        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Error creating post' });
    }
};

export const listPosts = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const posts = await prisma.feedPost.findMany({
            where: {
                companyId: user.companyId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(posts);
    } catch (error) {
        console.error('Error listing posts:', error);
        res.status(500).json({ error: 'Error listing posts' });
    }
};

export const updatePost = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, category, imageUrl, videoLibrasUrl } = req.body;
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
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Error updating post' });
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
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Error deleting post' });
    }
};
