import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

const ROLE_COLABORADOR = 'COLABORADOR';
const DEFAULT_SHIFT = '1_TURNO';
const DEFAULT_DISABILITY = 'NENHUMA';

import { createCollaboratorSchema } from '../schemas/dataSchemas';

export const listCollaborators = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        if (!companyId) {
            return res.status(400).json({ error: 'Company context required' });
        }

        const [collaborators, total] = await Promise.all([
            prisma.user.findMany({
                where: {
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
                },
                take: limit,
                skip: skip
            }),
            prisma.user.count({
                where: {
                    collaboratorProfile: { isNot: null },
                    companyId: companyId,
                    active: true
                }
            })
        ]);

        res.json({
            data: collaborators,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching collaborators' });
    }
};

export const createCollaborator = async (req: Request, res: Response) => {
    try {
        const validation = createCollaboratorSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }

        const {
            name, email, password, companyId, // User data
            matricula, areaId, shift, nextRestDay, disabilityType, needsDescription // Profile data
        } = validation.data;

        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Security check: ensure user can only create for their company (unless MASTER)
        if (user.role !== 'MASTER' && user.companyId !== companyId) {
            return res.status(403).json({ error: 'Unauthorized to create collaborator for this company' });
        }

        // Check email existence BEFORE transaction
        const existingUser = await prisma.user.findFirst({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Check matricula uniqueness in the same company
        const existingMatricula = await prisma.collaboratorProfile.findFirst({
            where: {
                matricula,
                user: { companyId }
            }
        });

        if (existingMatricula) {
            return res.status(400).json({ error: 'Matrícula already exists in this company' });
        }

        // Hash password OUTSIDE transaction
        // FIXED: Stronger default password
        const defaultPassword = 'Mudar@' + Math.random().toString(36).slice(-8) + '!';
        const hashedPassword = await bcrypt.hash(password || defaultPassword, 10);

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
                    nextRestDay: nextRestDay ? new Date(nextRestDay) : null,
                    disabilityType: disabilityType || DEFAULT_DISABILITY,
                    needsDescription
                }
            });

            return { user: newUser, profile, tempPassword: !password ? defaultPassword : null };
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

        const collaborator = await prisma.user.findFirst({
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

        // Use Zod for validation (Partial schema for updates)
        const validation = createCollaboratorSchema.partial().safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }

        const {
            name, email, password, companyId, // User data
            matricula, areaId, shift, nextRestDay, disabilityType, needsDescription // Profile data
        } = validation.data;

        // ... (existing code)

        const profile = await prisma.collaboratorProfile.update({
            where: { userId: id },
            data: {
                matricula,
                areaId,
                shift,
                nextRestDay: nextRestDay ? new Date(nextRestDay) : undefined,
                disabilityType,
                needsDescription
            }
        });

        const requestingUser = (req as AuthRequest).user;
        if (!requestingUser) return res.status(401).json({ error: 'Unauthorized' });

        // Verify existence and ownership
        const existingUser = await prisma.user.findFirst({ where: { id } });
        if (!existingUser) return res.status(404).json({ error: 'Collaborator not found' });

        if (requestingUser.role !== 'MASTER' && existingUser.companyId !== requestingUser.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check email uniqueness if changing
        if (email && email !== existingUser.email) {
            const emailCheck = await prisma.user.findFirst({ where: { email } });
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
                    nextRestDay: nextRestDay ? new Date(nextRestDay) : undefined,
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
