import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import prisma from '../prisma';

export const listCollaborators = async (req: Request, res: Response) => {
    try {
        const collaborators = await prisma.user.findMany({
            where: { role: 'COLABORADOR' },
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
        const collaborator = await prisma.user.findUnique({
            where: { id },
            include: {
                collaboratorProfile: {
                    include: {
                        area: true,
                        visits: true,
                        pendingItems: true
                    }
                }
            }
        });

        if (!collaborator) return res.status(404).json({ error: 'Collaborator not found' });

        res.json(collaborator);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching collaborator' });
    }
};
