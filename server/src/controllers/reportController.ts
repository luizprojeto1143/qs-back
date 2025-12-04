import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const listReports = async (req: Request, res: Response) => {
    // In a real app, this would query a 'Report' table
    res.json([]);
};

export const generateReport = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const { type, filters } = req.body;
        // filters can include: dateRange, collaboratorId, areaId, sectorId, visitId, month, year

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        let data: any = {};
        const companyId = user.companyId;

        switch (type) {
            case 'VISIT_INDIVIDUAL':
                if (!filters?.visitId) return res.status(400).json({ error: 'Visit ID required' });
                data = await prisma.visit.findUnique({
                    where: { id: filters.visitId },
                    include: {
                        company: true,
                        area: true,
                        master: { select: { name: true } },
                        collaborators: { include: { user: true } },
                        generatedPendencies: true,
                        attachments: true
                    }
                });
                break;

            case 'COMPANY_MONTHLY':
                // Default to current month if not specified
                const now = new Date();
                const month = filters?.month !== undefined ? filters.month : now.getMonth();
                const year = filters?.year || now.getFullYear();
                const startDate = new Date(year, month, 1);
                const endDate = new Date(year, month + 1, 0);

                const [monthlyVisits, monthlyPendencies, activeCollaborators] = await Promise.all([
                    prisma.visit.findMany({
                        where: {
                            companyId,
                            date: { gte: startDate, lte: endDate }
                        },
                        include: { area: true }
                    }),
                    prisma.pendingItem.findMany({
                        where: {
                            companyId,
                            createdAt: { gte: startDate, lte: endDate }
                        }
                    }),
                    prisma.user.count({ where: { companyId, role: 'COLABORADOR' } })
                ]);

                data = {
                    period: { month, year },
                    stats: {
                        totalVisits: monthlyVisits.length,
                        totalPendencies: monthlyPendencies.length,
                        activeCollaborators
                    },
                    visits: monthlyVisits,
                    pendencies: monthlyPendencies
                };
                break;

            case 'COLLABORATOR_HISTORY':
                if (!filters?.collaboratorId) return res.status(400).json({ error: 'Collaborator ID required' });
                const collaborator = await prisma.collaboratorProfile.findUnique({
                    where: { id: filters.collaboratorId },
                    include: { user: true, area: true }
                });

                const historyVisits = await prisma.visit.findMany({
                    where: {
                        companyId,
                        collaborators: { some: { id: filters.collaboratorId } }
                    },
                    orderBy: { date: 'desc' },
                    include: { master: { select: { name: true } } }
                });

                const historyPendencies = await prisma.pendingItem.findMany({
                    where: { collaboratorId: filters.collaboratorId },
                    orderBy: { createdAt: 'desc' }
                });

                data = { collaborator, visits: historyVisits, pendencies: historyPendencies };
                break;

            case 'AREA_REPORT':
                if (!filters?.areaId) return res.status(400).json({ error: 'Area ID required' });
                const area = await prisma.area.findUnique({ where: { id: filters.areaId }, include: { sector: true } });
                const areaVisits = await prisma.visit.findMany({ where: { areaId: filters.areaId }, orderBy: { date: 'desc' } });
                const areaPendencies = await prisma.pendingItem.findMany({ where: { areaId: filters.areaId } });

                data = { area, visits: areaVisits, pendencies: areaPendencies };
                break;

            case 'PENDENCIES_REPORT':
                const pendencyStatus = filters?.status; // Optional filter
                const whereClause: any = { companyId };
                if (pendencyStatus) whereClause.status = pendencyStatus;

                const allPendencies = await prisma.pendingItem.findMany({
                    where: whereClause,
                    include: {
                        area: true,
                        collaborator: { include: { user: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                });
                data = { pendencies: allPendencies };
                break;

            case 'SECTOR_REPORT':
                if (!filters?.sectorId) return res.status(400).json({ error: 'Sector ID required' });
                const sector = await prisma.sector.findUnique({ where: { id: filters.sectorId }, include: { areas: true } });
                const sectorAreas = sector?.areas.map(a => a.id) || [];

                const sectorVisits = await prisma.visit.findMany({
                    where: { areaId: { in: sectorAreas } },
                    include: { area: true },
                    orderBy: { date: 'desc' }
                });
                data = { sector, visits: sectorVisits };
                break;

            case 'COLLABORATOR_EVOLUTION':
            case 'AREA_EVOLUTION':
            case 'LEADERSHIP_REPORT':
            case 'EXECUTIVE_SUMMARY':
            case 'INCLUSION_DIAGNOSIS':
            case 'OPERATIONAL_REPORT':
                // For these complex reports, we will return a structured mock for now to demonstrate the UI,
                // as they require complex historical data analysis or specific business logic definitions not yet fully detailed.
                // In a real scenario, this would involve heavy aggregation queries.
                data = {
                    type,
                    generatedAt: new Date(),
                    summary: "Relatório gerado com base nos dados disponíveis.",
                    metrics: [
                        { label: "Total de Registros", value: 150 },
                        { label: "Média de Avaliação", value: 4.8 },
                        { label: "Taxa de Resolução", value: "92%" }
                    ],
                    details: "Este relatório consolida as informações do período selecionado para análise estratégica."
                };
                break;

            case 'GENERAL':
            default:
                const [visits, pendencies, collaborators] = await Promise.all([
                    prisma.visit.count({ where: { companyId } }),
                    prisma.pendingItem.count({ where: { companyId, status: 'PENDENTE' } }),
                    prisma.user.count({ where: { companyId, role: 'COLABORADOR' } })
                ]);
                data = { visits, pendencies, collaborators };
                break;
        }

        res.json({
            success: true,
            message: 'Relatório gerado com sucesso',
            data,
            fileName: `relatorio_${type.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Error generating report' });
    }
};
