import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

const ROLE_COLABORADOR = 'COLABORADOR';
const DEFAULT_SHIFT = '1_TURNO';
const DEFAULT_DISABILITY = 'NENHUMA';

export const listCollaborators = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'Company context required' });
        }

        const collaborators = await prisma.user.findMany({
            where: {
                // Removed role filter to allow seeing promoted users (LIDER/RH) who are still employees
                // Or if we strictly want 'COLABORADOR', we should document that. 
                // For now, let's include anyone with a collaborator profile
                collaboratorProfile: { isNot: null },
                companyId: companyId,
                active: true
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

        // Check email existence BEFORE transaction
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password OUTSIDE transaction
        const hashedPassword = await bcrypt.hash(password || 'Mudar@123', 10); // Stronger default password

        // Transaction to create User and Profile together
        const result = await prisma.$transaction(async (prisma) => {
            const newUser = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: ROLE_COLABORADOR,
                    companyId,
                }
            });

            const profile = await prisma.collaboratorProfile.create({
                data: {
                    userId: newUser.id,
                    matricula,
                    areaId,
                    shift: shift || DEFAULT_SHIFT,
                    disabilityType: disabilityType || DEFAULT_DISABILITY,
                    needsDescription
                }
            });

            return { user: newUser, profile };
        });

        res.status(201).json(result);
    } catch (error) {
        // console.error(error); // Removed log
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

        // Check email uniqueness if changing
        if (email && email !== existingUser.email) {
            const emailCheck = await prisma.user.findUnique({ where: { email } });
            if (emailCheck) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        let hashedPassword = undefined;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        const result = await prisma.$transaction(async (prisma) => {
            const updateData: any = { name, email };
            // Only update companyId if MASTER
            if (requestingUser.role === 'MASTER' && companyId) {
                updateData.companyId = companyId;
            }

            if (hashedPassword) {
                updateData.password = hashedPassword;
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
        // console.error('Error updating collaborator:', error);
        res.status(500).json({ error: 'Error updating collaborator' });
    }
};
