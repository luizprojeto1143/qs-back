import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const listCollaborators = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'Company context required' });
        }

        const collaborators = await prisma.user.findMany({
            where: {
                role: 'COLABORADOR',
                companyId: companyId
            },
            include: {
                collaboratorProfile: {
                    include: {
                        area: {
                            include: {
                                sector: true
                            }
                        }
                    }
                }
            }
        });
        res.json(collaborators);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching collaborators' });
    }
};

export const createCollaborator = async (req: Request, res: Response) => {
    try {
        const {
            name, email, password, companyId, // User data
            matricula, areaId, shift, disabilityType, needsDescription // Profile data
        } = req.body;

        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Security check: ensure user can only create for their company (unless MASTER)
        if (user.role !== 'MASTER' && user.companyId !== companyId) {
            return res.status(403).json({ error: 'Unauthorized to create collaborator for this company' });
        }

        const hashedPassword = await bcrypt.hash(password || '123456', 10);

        // Transaction to create User and Profile together
        const result = await prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: 'COLABORADOR',
                    companyId,
                }
            });

            const profile = await prisma.collaboratorProfile.create({
                data: {
                    userId: user.id,
                    matricula,
                    areaId,
                    shift,
                    disabilityType,
                    needsDescription
                }
            });

            return { user, profile };
        });

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error creating collaborator' });
    }
};

export const getCollaborator = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;

        const collaborator = await prisma.user.findUnique({
            where: { id },
            include: {
                collaboratorProfile: {
                    include: {
                        area: true,
                        visits: {
                            include: {
                                master: { select: { name: true } }
                            },
                            orderBy: { date: 'desc' }
                        },
                        pendingItems: true,
                        visitNotes: {
                            include: {
                                visit: {
                                    include: {
                                        master: { select: { name: true } }
                                    }
                                }
                            },
                            orderBy: { createdAt: 'desc' }
                        }
                    }
                }
            }
        });

        if (!collaborator) return res.status(404).json({ error: 'Collaborator not found' });

        // Security check
        if (collaborator.companyId !== companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(collaborator);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching collaborator' });
    }
};

export const updateCollaborator = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name, email, password, companyId, // User data
            matricula, areaId, shift, disabilityType, needsDescription // Profile data
        } = req.body;

        const requestingUser = (req as AuthRequest).user;
        if (!requestingUser) return res.status(401).json({ error: 'Unauthorized' });

        // Verify existence and ownership
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) return res.status(404).json({ error: 'Collaborator not found' });

        if (requestingUser.role !== 'MASTER' && existingUser.companyId !== requestingUser.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await prisma.$transaction(async (prisma) => {
            const updateData: any = { name, email };
            // Only update companyId if MASTER
            if (requestingUser.role === 'MASTER' && companyId) {
                updateData.companyId = companyId;
            }

            if (password) {
                updateData.password = await bcrypt.hash(password, 10);
            }

            const user = await prisma.user.update({
                where: { id },
                data: updateData
            });

            const profile = await prisma.collaboratorProfile.update({
                where: { userId: id },
                data: {
                    matricula,
                    areaId,
                    shift,
                    disabilityType,
                    needsDescription
                }
            });

            return { user, profile };
        });

        res.json(result);
    } catch (error) {
        console.error('Error updating collaborator:', error);
        res.status(500).json({ error: 'Error updating collaborator' });
    }
};
