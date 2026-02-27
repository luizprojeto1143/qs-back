import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

export const listSpecialties = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const specialties = await prisma.specialty.findMany({
            where: { companyId: user.companyId },
            orderBy: { name: 'asc' }
        });

        res.json(specialties);
    } catch (error) {
        sendError500(res, ERROR_CODES.SPECIALTY_LIST, error);
    }
};

export const createSpecialty = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const specialty = await prisma.specialty.create({
            data: {
                name,
                companyId: user.companyId
            }
        });

        res.status(201).json(specialty);
    } catch (error) {
        sendError500(res, ERROR_CODES.SPECIALTY_CREATE, error);
    }
};

export const deleteSpecialty = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const specialty = await prisma.specialty.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!specialty) {
            return res.status(404).json({ error: 'Specialty not found' });
        }

        await prisma.specialty.delete({
            where: { id }
        });

        res.json({ message: 'Specialty deleted successfully' });
    } catch (error) {
        sendError500(res, ERROR_CODES.SPECIALTY_DELETE, error);
    }
};
