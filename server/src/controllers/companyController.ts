import { Request, Response } from 'express';
import prisma from '../prisma';

export const getStructure = async (req: Request, res: Response) => {
    try {
        // In a real app, filter by the authenticated user's company
        // const companyId = (req as any).user.companyId;

        const companies = await prisma.company.findMany({
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
        const { name, cnpj } = req.body;
        const company = await prisma.company.create({
            data: { name, cnpj }
        });
        res.status(201).json(company);
    } catch (error) {
        res.status(500).json({ error: 'Error creating company' });
    }
};

export const createSector = async (req: Request, res: Response) => {
    try {
        const { name, companyId } = req.body;
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
        const companies = await prisma.company.findMany();
        res.json(companies);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching companies' });
    }
};

export const listSectors = async (req: Request, res: Response) => {
    try {
        const sectors = await prisma.sector.findMany({
            include: { company: true }
        });
        res.json(sectors);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching sectors' });
    }
};

export const listAreas = async (req: Request, res: Response) => {
    try {
        const areas = await prisma.area.findMany({
            include: { sector: true }
        });
        res.json(areas);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching areas' });
    }
};
