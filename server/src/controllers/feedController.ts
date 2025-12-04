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
