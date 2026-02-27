import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

export const getStructure = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        // Para MASTER: pode usar x-company-id para navegar entre empresas
        // Para outros: SEMPRE usar companyId do token
        const companyId = user?.role === 'MASTER'
            ? (req.headers['x-company-id'] as string || user?.companyId)
            : user?.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'Company context required' });
        }

        const companies = await prisma.company.findMany({
            where: { id: companyId },
            include: {
                sectors: {
                    include: {
                        areas: true
                    }
                }
            }
        });

        res.json(companies);
    } catch (error) {
        sendError500(res, ERROR_CODES.COMP_STRUCTURE, error);
    }
};

export const createCompany = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized. Only MASTER can create companies.' });
        }

        // Import and validate with schema
        const { createCompanySchema } = await import('../schemas/dataSchemas');
        const validation = createCompanySchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({ error: 'Validation error', details: validation.error.format() });
        }

        const { name, cnpj, email } = validation.data;
        const { password, universityEnabled, talentManagementEnabled, interpreterEnabled, interpreterOnly } = req.body;

        // Check for existing CNPJ
        const existingCompany = await prisma.company.findFirst({ where: { cnpj } });
        if (existingCompany) {
            return res.status(400).json({ error: 'Já existe uma empresa com este CNPJ.' });
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const company = await tx.company.create({
                data: {
                    name,
                    cnpj,
                    universityEnabled: universityEnabled || false,
                    talentManagementEnabled: talentManagementEnabled || false,
                    interpreterEnabled: interpreterEnabled || false,
                    interpreterOnly: interpreterOnly || false
                }
            });

            if (email && password) {
                const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(password, 10));
                await prisma.user.create({
                    data: {
                        name: `Admin ${name}`,
                        email,
                        password: hashedPassword,
                        role: 'RH',
                        companyId: company.id
                    }
                });
            }

            return company;
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error('Error creating company:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Já existe uma empresa com este CNPJ ou email.' });
        }
        sendError500(res, ERROR_CODES.COMP_CREATE, error);
    }
};

export const createSector = async (req: Request, res: Response) => {
    try {
        const { name, companyId } = req.body;
        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Security check
        if (user.role !== 'MASTER' && user.companyId !== companyId) {
            return res.status(403).json({ error: 'Unauthorized to create sector for this company' });
        }

        const sector = await prisma.sector.create({
            data: { name, companyId }
        });
        res.status(201).json(sector);
    } catch (error) {
        sendError500(res, ERROR_CODES.SECTOR_CREATE, error);
    }
};

export const createArea = async (req: Request, res: Response) => {
    try {
        const { name, sectorId } = req.body;
        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        // Verify sector ownership
        const sector = await prisma.sector.findFirst({ where: { id: sectorId } });
        if (!sector) return res.status(404).json({ error: 'Sector not found' });

        if (user.role !== 'MASTER' && sector.companyId !== user.companyId) {
            return res.status(403).json({ error: 'Unauthorized to create area in this sector' });
        }

        const area = await prisma.area.create({
            data: { name, sectorId }
        });
        res.status(201).json(area);
    } catch (error) {
        sendError500(res, ERROR_CODES.AREA_CREATE, error);
    }
};

// Corrigindo casting para unknown antes de Prisma
import { Prisma as PrismaType } from '@prisma/client';

export const listCompanies = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { includeInactive } = req.query;

        const where: PrismaType.CompanyWhereInput = {};

        // If not explicitly asking for inactive, filter by active=true
        if (includeInactive !== 'true') {
            where.active = true;
        }

        if (user.role !== 'MASTER') {
            where.id = user.companyId!;
        }

        const companies = await prisma.company.findMany({
            where,
            include: { systemSettings: true },
            orderBy: { name: 'asc' }
        });

        res.json(companies);
    } catch (error) {
        sendError500(res, ERROR_CODES.COMP_LIST, error);
    }
};

export const deleteCompany = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Soft delete
        await prisma.company.update({
            where: { id },
            data: {
                active: false,
                deletedAt: new Date()
            }
        });

        res.status(204).send();
    } catch (error) {
        sendError500(res, ERROR_CODES.COMP_DELETE, error);
    }
};

export const listSectors = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        // Para MASTER: pode usar x-company-id para navegar entre empresas
        // Para outros: SEMPRE usar companyId do token
        const companyId = user?.role === 'MASTER'
            ? (req.headers['x-company-id'] as string || user?.companyId)
            : user?.companyId;

        const where: PrismaType.SectorWhereInput = {};
        if (companyId) {
            where.companyId = companyId;
        } else if (user?.role !== 'MASTER') {
            return res.status(400).json({ error: 'Company context required' });
        }

        const sectors = await prisma.sector.findMany({
            where,
            include: { company: true },
            orderBy: { name: 'asc' }
        });
        res.json(sectors);
    } catch (error) {
        sendError500(res, ERROR_CODES.SECTOR_LIST, error);
    }
};

export const listAreas = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        // Para MASTER: pode usar query param, header ou token
        // Para outros: SEMPRE usar companyId do token
        const companyId = user?.role === 'MASTER'
            ? ((req.query.companyId as string) || (req.params.companyId as string) || (req.headers['x-company-id'] as string) || user?.companyId)
            : user?.companyId;

        const where: PrismaType.AreaWhereInput = {};
        if (companyId) {
            where.sector = { companyId };
        } else if (user?.role !== 'MASTER') {
            return res.status(400).json({ error: 'Company context required' });
        }

        const areas = await prisma.area.findMany({
            where,
            include: {
                sector: {
                    include: { company: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(areas);
    } catch (error) {
        sendError500(res, ERROR_CODES.AREA_LIST, error);
    }
};

export const deleteSector = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || !['MASTER', 'RH'].includes(user.role)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const sector = await prisma.sector.findUnique({ where: { id } });
        if (!sector) return res.status(404).json({ error: 'Sector not found' });

        if (user.role !== 'MASTER' && sector.companyId !== user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if there are areas in this sector
        const areasCount = await prisma.area.count({ where: { sectorId: id } });
        if (areasCount > 0) {
            return res.status(400).json({ error: 'Não é possível excluir um setor que possua áreas vinculadas.' });
        }

        await prisma.sector.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        sendError500(res, ERROR_CODES.SECTOR_DELETE, error);
    }
};

export const deleteArea = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = (req as AuthRequest).user;

        if (!user || !['MASTER', 'RH'].includes(user.role)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const area = await prisma.area.findUnique({ where: { id }, include: { sector: true } });
        if (!area) return res.status(404).json({ error: 'Area not found' });

        if (user.role !== 'MASTER' && area.sector.companyId !== user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check for dependencies (collaborators, visits, etc.)
        const collaboratorsCount = await prisma.collaboratorProfile.count({ where: { areaId: id } });
        if (collaboratorsCount > 0) {
            return res.status(400).json({ error: 'Não é possível excluir uma área que possua colaboradores vinculados.' });
        }

        await prisma.area.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        sendError500(res, ERROR_CODES.AREA_DELETE, error);
    }
};

export const updateCompany = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, cnpj, email, password, universityEnabled, talentManagementEnabled, interpreterEnabled, interpreterOnly } = req.body;
        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        if (user.role !== 'MASTER' && user.companyId !== id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // RH can only update active status of modules if needed, or nothing
        const dataToUpdate: PrismaType.CompanyUpdateInput = {
            inclusionDiagnosis: req.body.inclusionDiagnosis || undefined
        };

        if (user.role === 'MASTER') {
            dataToUpdate.name = name;
            dataToUpdate.cnpj = cnpj;
            // Explicit casting to ensure Boolean format
            if (universityEnabled !== undefined) dataToUpdate.universityEnabled = Boolean(universityEnabled);
            if (talentManagementEnabled !== undefined) dataToUpdate.talentManagementEnabled = Boolean(talentManagementEnabled);
            if (interpreterEnabled !== undefined) dataToUpdate.interpreterEnabled = Boolean(interpreterEnabled);
            if (interpreterOnly !== undefined) dataToUpdate.interpreterOnly = Boolean(interpreterOnly);
        } else {
            // RH can only update active status of modules if needed, or nothing
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const company = await tx.company.update({
                where: { id },
                data: dataToUpdate
            });

            if (email || password) {
                // Find the admin user (RH) for this company
                const adminUser = await prisma.user.findFirst({
                    where: {
                        companyId: id,
                        role: 'RH'
                    }
                });

                if (adminUser) {
                    const updateData: PrismaType.UserUpdateInput = {};
                    if (email) updateData.email = email;
                    if (password) {
                        const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(password, 10));
                        updateData.password = hashedPassword;
                    }

                    await prisma.user.update({
                        where: { id: adminUser.id },
                        data: updateData
                    });
                }
            }

            return company;
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error updating company:', error);
        // Expose error details safely for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorDetails = error?.meta || error?.code || null;
        res.status(500).json({
            error: 'Failed to update company',
            details: errorMessage,
            code: errorDetails
        });
    }
};

export const updateSector = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, companyId } = req.body;
        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const existingSector = await prisma.sector.findFirst({ where: { id } });
        if (!existingSector) return res.status(404).json({ error: 'Sector not found' });

        if (user.role !== 'MASTER' && existingSector.companyId !== user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const sector = await prisma.sector.update({
            where: { id },
            data: { name, companyId: user.role === 'MASTER' ? companyId : undefined }
        });
        res.json(sector);
    } catch (error) {
        sendError500(res, ERROR_CODES.SECTOR_UPDATE, error);
    }
};

export const updateArea = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, sectorId } = req.body;
        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const existingArea = await prisma.area.findFirst({ where: { id }, include: { sector: true } });
        if (!existingArea) return res.status(404).json({ error: 'Area not found' });

        if (user.role !== 'MASTER' && existingArea.sector.companyId !== user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const area = await prisma.area.update({
            where: { id },
            data: { name, sectorId }
        });
        res.json(area);
    } catch (error) {
        sendError500(res, ERROR_CODES.AREA_UPDATE, error);
    }
};

export const listPublicAreas = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.params;

        if (!companyId) return res.status(400).json({ error: 'Company ID required' });

        const areas = await prisma.area.findMany({
            where: {
                sector: {
                    companyId: companyId
                }
            },
            select: {
                id: true,
                name: true,
                sector: {
                    select: { name: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json(areas);
    } catch (error) {
        sendError500(res, ERROR_CODES.AREA_LIST, error);
    }
};
// Public Shifts for Registration
export const listPublicShifts = async (req: Request, res: Response) => {
    try {
        const { companyId } = req.params;

        if (!companyId) {
            return res.status(400).json({ error: 'Company ID is required' });
        }

        const shifts = await prisma.shift.findMany({
            where: {
                companyId,
                active: true
            },
            orderBy: {
                name: 'asc'
            },
            select: {
                id: true,
                name: true,
                type: true,
                startTime: true,
                endTime: true,
                workDays: true
            }
        });

        res.json(shifts);
    } catch (error) {
        sendError500(res, ERROR_CODES.COMP_LIST, error);
    }
};
