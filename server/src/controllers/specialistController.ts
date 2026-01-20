import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';
import { createSpecialistSchema, updateSpecialistSchema } from '../schemas/dataSchemas';

export const listSpecialists = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const specialists = await prisma.specialist.findMany({
            where: { companyId: user.companyId },
            orderBy: { name: 'asc' }
        });

        res.json(specialists);
    } catch (error) {
        sendError500(res, ERROR_CODES.SPEC_LIST, error);
    }
};

export const createSpecialist = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const validation = createSpecialistSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }

        const { name, email, type } = validation.data;

        const specialist = await prisma.specialist.create({
            data: {
                name,
                email,
                type,
                companyId: user.companyId
            }
        });

        res.status(201).json(specialist);
    } catch (error) {
        sendError500(res, ERROR_CODES.SPEC_CREATE, error);
    }
};

export const updateSpecialist = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const validation = updateSpecialistSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }

        // IDOR CHECK
        const existing = await prisma.specialist.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Specialist not found or access denied' });
        }

        const specialist = await prisma.specialist.update({
            where: { id },
            data: validation.data
        });

        res.json(specialist);
    } catch (error) {
        sendError500(res, ERROR_CODES.SPEC_UPDATE, error);
    }
};

export const deleteSpecialist = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // IDOR CHECK
        const existing = await prisma.specialist.findFirst({
            where: { id, companyId: user.companyId }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Specialist not found or access denied' });
        }

        await prisma.specialist.delete({
            where: { id }
        });

        res.json({ message: 'Specialist deleted successfully' });
    } catch (error) {
        sendError500(res, ERROR_CODES.SPEC_DELETE, error);
    }
};
