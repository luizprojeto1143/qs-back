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
        const { name, cnpj, email, password } = req.body;

        const result = await prisma.$transaction(async (prisma) => {
            const company = await prisma.company.create({
                data: { name, cnpj }
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
        const sector = await prisma.sector.findUnique({ where: { id: sectorId } });
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

export const listCompanies = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const where: any = {};
        if (user.role !== 'MASTER') {
            where.id = user.companyId;
        }

        const companies = await prisma.company.findMany({ where });
        res.json(companies);
    } catch (error) {
        console.error('Error in listCompanies:', error);
        res.status(500).json({ error: 'Error fetching companies', details: error });
    }
};

export const listSectors = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const companyId = req.headers['x-company-id'] as string || user?.companyId;

        const where: any = {};
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

        const where: any = {};
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
        const { name, cnpj, email, password } = req.body;
        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        if (user.role !== 'MASTER' && user.companyId !== id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const result = await prisma.$transaction(async (prisma) => {
            const company = await prisma.company.update({
                where: { id },
                data: { name, cnpj }
            });

            if (email || password) {
                // Find the admin user (RH) for this company
                // We assume the first RH user found is the main admin to be updated
                const adminUser = await prisma.user.findFirst({
                    where: {
                        companyId: id,
                        role: 'RH'
                    }
                });

                if (adminUser) {
                    const updateData: any = {};
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
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ error: 'Error updating company' });
    }
};

export const updateSector = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, companyId } = req.body;
        const user = (req as AuthRequest).user;

        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        const existingSector = await prisma.sector.findUnique({ where: { id } });
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

        const existingArea = await prisma.area.findUnique({ where: { id }, include: { sector: true } });
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
