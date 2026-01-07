import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const getStructure = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;

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
        res.status(500).json({ error: 'Error fetching structure' });
    }
};

export const createCompany = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || user.role !== 'MASTER') {
            return res.status(403).json({ error: 'Unauthorized. Only MASTER can create companies.' });
        }

        const { name, cnpj, email, password, universityEnabled } = req.body;

        const result = await prisma.$transaction(async (prisma) => {
            const company = await prisma.company.create({
                data: { name, cnpj, universityEnabled: universityEnabled || false }
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
        res.status(500).json({ error: 'Erro interno ao criar empresa', details: error.message });
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
        res.status(500).json({ error: 'Error creating sector' });
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
        res.status(500).json({ error: 'Error creating area' });
    }
};

import { Prisma } from '@prisma/client';

export const listCompanies = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const { includeInactive } = req.query;

        const where: Prisma.CompanyWhereInput = {};

        // If not explicitly asking for inactive, filter by active=true
        if (includeInactive !== 'true') {
            where.active = true;
        }

        if (user.role !== 'MASTER') {
            where.id = user.companyId!;
        }

        console.log('listCompanies called by:', user.userId, user.role, user.companyId);
        console.log('Query where:', JSON.stringify(where, null, 2));

        const companies = await prisma.company.findMany({
            where,
            orderBy: { name: 'asc' }
        });
        console.log('Companies found:', companies.length);
        companies.forEach(c => console.log(`- ${c.name} (${c.id}) Active: ${c.active}`));

        res.json(companies);
    } catch (error) {
        console.error('Error in listCompanies:', error);
        res.status(500).json({ error: 'Error fetching companies', details: error });
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
        console.error('Error deleting company:', error);
        res.status(500).json({ error: 'Error deleting company' });
    }
};

export const listSectors = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;

        const where: Prisma.SectorWhereInput = {};
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
        res.status(500).json({ error: 'Error fetching sectors' });
    }
};

export const listAreas = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;

        const where: Prisma.AreaWhereInput = {};
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
        res.status(500).json({ error: 'Error fetching areas' });
    }
};

export const updateCompany = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, cnpj, email, password, universityEnabled } = req.body;
        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        if (user.role !== 'MASTER' && user.companyId !== id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Restrict fields for non-MASTER users
        const dataToUpdate: Prisma.CompanyUpdateInput = {
            inclusionDiagnosis: req.body.inclusionDiagnosis ? JSON.stringify(req.body.inclusionDiagnosis) : undefined
        };

        if (user.role === 'MASTER') {
            dataToUpdate.name = name;
            dataToUpdate.cnpj = cnpj;
            dataToUpdate.universityEnabled = universityEnabled;
        } else {
            // RH can only update specific settings, not core identity
            // If they try to update restricted fields, we ignore them or throw error.
            // For now, we just ignore them in the data object.
        }

        const result = await prisma.$transaction(async (prisma) => {
            const company = await prisma.company.update({
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
                    const updateData: Prisma.UserUpdateInput = {};
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
        res.status(500).json({ error: `Error updating company: ${error.message || error}` });
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
        res.status(500).json({ error: 'Error updating sector' });
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
        res.status(500).json({ error: 'Error updating area' });
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
        console.error('Error fetching public areas:', error);
        res.status(500).json({ error: 'Error fetching areas' });
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
        console.error('Error fetching public shifts:', error);
        res.status(500).json({ error: 'Error fetching shifts' });
    }
};
