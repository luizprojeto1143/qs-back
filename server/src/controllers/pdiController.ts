import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';
import { createPDISchema, updatePDISchema } from '../schemas/dataSchemas';

export const createPDI = async (req: Request, res: Response) => {
    try {
        const validation = createPDISchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { userId, objective, skills, actions } = validation.data;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // IDOR CHECK: Users can only create PDIs for themselves, unless they are MASTER/RH
        if (userId !== user.userId && !['MASTER', 'RH'].includes(user.role)) {
            return res.status(403).json({ error: 'You can only create PDIs for yourself.' });
        }

        const pdi = await prisma.pDI.create({
            data: {
                userId,
                companyId: user.companyId,
                objective,
                skills,
                actions,
                status: 'ACTIVE'
            }
        });

        res.status(201).json(pdi);
    } catch (error) {
        sendError500(res, ERROR_CODES.PDI_CREATE, error);
    }
};

export const listPDIs = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;

        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Para MASTER: pode usar x-company-id para navegar entre empresas
        // Para outros: SEMPRE usar companyId do token
        const companyId = user.role === 'MASTER'
            ? (req.headers['x-company-id'] as string || user.companyId)
            : user.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'Company context required' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        // Role-based filtering
        const where: any = { companyId };

        if (user.role === 'COLABORADOR') {
            where.userId = user.userId;
        } else if (user.role === 'LIDER' && user.areaId) {
            // Leaders see their own PDIs and PDIs of collaborators in their area
            // Logic: PDI owner has same areaId? PDI model doesn't store areaId directly, only user link.
            // We need to filter by users in the area.
            // Prisma 'some' filter on relation
            where.user = {
                collaboratorProfile: {
                    areaId: user.areaId
                }
            };
        }

        const [pdis, total] = await Promise.all([
            prisma.pDI.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            collaboratorProfile: {
                                include: {
                                    area: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: skip
            }),
            prisma.pDI.count({ where: { companyId } })
        ]);

        res.json({
            data: pdis,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        sendError500(res, ERROR_CODES.PDI_LIST, error);
    }
};

export const updatePDI = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validation = updatePDISchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }
        const { objective, skills, actions, status } = validation.data;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        // IDOR CHECK: Ensure PDI belongs to user's company and permissions
        const where: any = { id, companyId: user.companyId };

        if (!['MASTER', 'RH'].includes(user.role)) {
            // LIDER and COLABORADOR can only update their own PDIs (or Leader can update their team?? Assuming only own for now like create)
            // If the rule is "Leader manages PDI of team", we need to check area.
            // For safety, let's allow users to edit only their OWN PDI for now unless specified otherwise.
            where.userId = user.userId;
        }

        const existingPDI = await prisma.pDI.findFirst({ where });

        if (!existingPDI) {
            return res.status(404).json({ error: 'PDI not found or access denied' });
        }

        const pdi = await prisma.pDI.update({
            where: { id },
            data: {
                objective,
                skills,
                actions,
                status
            }
        });

        res.json(pdi);
    } catch (error) {
        sendError500(res, ERROR_CODES.PDI_UPDATE, error);
    }
};

export const deletePDI = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || !user.companyId) return res.status(401).json({ error: 'Unauthorized' });

        // IDOR CHECK
        const where: any = { id, companyId: user.companyId };

        if (!['MASTER', 'RH'].includes(user.role)) {
            where.userId = user.userId;
        }

        const existingPDI = await prisma.pDI.findFirst({ where });

        if (!existingPDI) {
            return res.status(404).json({ error: 'PDI not found or access denied' });
        }

        await prisma.pDI.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        sendError500(res, ERROR_CODES.PDI_DELETE, error);
    }
};
