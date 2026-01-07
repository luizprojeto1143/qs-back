import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';

export const listReports = async (req: Request, res: Response) => {
    // Since we don't have a Report history table yet, we return the available types
    // In a future version, this could return saved reports
    const reportTypes = [
        { id: 'VISIT_INDIVIDUAL', name: 'Visita Individual', description: 'Detalhes de uma visita específica' },
        { id: 'COMPANY_MONTHLY', name: 'Mensal da Empresa', description: 'Resumo mensal de atividades' },
        { id: 'COLLABORATOR_HISTORY', name: 'Histórico do Colaborador', description: 'Atividades de um colaborador' },
        { id: 'AREA_REPORT', name: 'Relatório de Área', description: 'Análise por área' },
        { id: 'PENDENCIES_REPORT', name: 'Relatório de Pendências', description: 'Status de pendências' },
        { id: 'SECTOR_REPORT', name: 'Relatório de Setor', description: 'Análise por setor' },
        { id: 'LEADERSHIP_REPORT', name: 'Relatório de Liderança', description: 'Desempenho da liderança' },
        { id: 'EXECUTIVE_SUMMARY', name: 'Resumo Executivo', description: 'Visão geral estratégica' }
    ];
    res.json(reportTypes);
};

export const generateReport = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        const { type, filters } = req.body;

        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        let data: any = {};
        const companyId = user.companyId;

        switch (type) {
            case 'VISIT_INDIVIDUAL':
                if (!filters?.visitId) return res.status(400).json({ error: 'Visit ID required' });
                data = await prisma.visit.findFirst({
                    where: { id: filters.visitId },
                    include: {
                        company: true,
                        area: true,
                        master: { select: { name: true } },
                        collaborators: { include: { user: true } },
                        generatedPendencies: true,
                        attachments: true,
                        notes: {
                            include: {
                                collaborator: {
                                    include: { user: { select: { name: true } } }
                                }
                            }
                        }
                    }
                });
                break;

            case 'COMPANY_MONTHLY':
                const now = new Date();
                const month = filters?.month !== undefined ? filters.month : now.getMonth();
                const year = filters?.year || now.getFullYear();
                const startDate = new Date(year, month, 1);
                const endDate = new Date(year, month + 1, 0);

                const [monthlyVisits, monthlyPendencies, activeCollaborators, monthlyComplaints] = await Promise.all([
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
                    prisma.user.count({ where: { companyId, role: 'COLABORADOR' } }),
                    prisma.complaint.findMany({
                        where: {
                            companyId,
                            createdAt: { gte: startDate, lte: endDate }
                        },
                        orderBy: { createdAt: 'desc' }
                    })
                ]);

                data = {
                    period: { month, year },
                    stats: {
                        totalVisits: monthlyVisits.length,
                        totalPendencies: monthlyPendencies.length,
                        activeCollaborators,
                        totalComplaints: monthlyComplaints.length,
                        resolvedComplaints: monthlyComplaints.filter(c => c.status === 'RESOLVIDO').length
                    },
                    visits: monthlyVisits,
                    pendencies: monthlyPendencies,
                    complaints: monthlyComplaints
                };
                break;

            case 'COLLABORATOR_HISTORY':
                if (!filters?.collaboratorId) return res.status(400).json({ error: 'Collaborator ID required' });

                // Try to find profile by ID first, then by User ID
                let collaborator = await prisma.collaboratorProfile.findUnique({
                    where: { id: filters.collaboratorId },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                active: true,
                                companyId: true,
                                avatar: true
                            }
                        },
                        area: true
                    }
                });

                if (!collaborator) {
                    collaborator = await prisma.collaboratorProfile.findFirst({
                        where: { userId: filters.collaboratorId },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    role: true,
                                    active: true,
                                    companyId: true,
                                    avatar: true
                                }
                            },
                            area: true
                        }
                    });
                }

                if (!collaborator) {
                    return res.status(404).json({ error: 'Collaborator profile not found' });
                }

                const historyVisits = await prisma.visit.findMany({
                    where: {
                        companyId,
                        OR: [
                            { collaborators: { some: { id: collaborator.id } } },
                            { notes: { some: { collaboratorId: collaborator.id } } },
                            { generatedPendencies: { some: { collaboratorId: collaborator.id } } }
                        ]
                    },
                    orderBy: { date: 'desc' },
                    include: {
                        master: { select: { name: true } },
                        collaborators: { select: { id: true } },
                        notes: {
                            where: { collaboratorId: collaborator.id }
                        }
                    }
                });

                const historyPendencies = await prisma.pendingItem.findMany({
                    where: { collaboratorId: collaborator.id },
                    orderBy: { createdAt: 'desc' }
                });

                data = { collaborator, visits: historyVisits, pendencies: historyPendencies };
                break;

            case 'AREA_REPORT':
                if (filters?.areaId) {
                    const area = await prisma.area.findFirst({ where: { id: filters.areaId }, include: { sector: true } });
                    const areaVisits = await prisma.visit.findMany({
                        where: { areaId: filters.areaId },
                        include: {
                            master: { select: { name: true } },
                            generatedPendencies: true,
                            notes: { include: { collaborator: { include: { user: { select: { name: true } } } } } }
                        },
                        orderBy: { date: 'desc' }
                    });
                    const areaPendencies = await prisma.pendingItem.findMany({ where: { areaId: filters.areaId } });
                    data = { area, visits: areaVisits, pendencies: areaPendencies };
                } else {
                    // General Area Report (All Areas)
                    const allAreas = await prisma.area.findMany({ include: { sector: true } });
                    const allVisits = await prisma.visit.findMany({ where: { companyId }, include: { area: true }, orderBy: { date: 'desc' } });
                    data = { areas: allAreas, visits: allVisits };
                }
                break;

            case 'INCLUSION_DIAGNOSIS':
                const company = await prisma.company.findFirst({
                    where: { id: companyId },
                    select: { inclusionDiagnosis: true }
                });
                try {
                    data = company?.inclusionDiagnosis ? JSON.parse(company.inclusionDiagnosis) : { categories: {} };
                } catch (e) {
                    console.error('Error parsing inclusionDiagnosis', e);
                    data = { categories: {}, error: 'Invalid data format' };
                }
                break;

            case 'SECTOR_REPORT':
                if (!filters?.sectorId) return res.status(400).json({ error: 'Sector ID required' });
                const sector = await prisma.sector.findFirst({ where: { id: filters.sectorId }, include: { areas: true } });
                const sectorAreas = sector?.areas.map(a => a.id) || [];

                const sectorVisits = await prisma.visit.findMany({
                    where: { areaId: { in: sectorAreas } },
                    include: {
                        area: true,
                        master: { select: { name: true } },
                        generatedPendencies: true,
                        notes: { include: { collaborator: { include: { user: { select: { name: true } } } } } }
                    },
                    orderBy: { date: 'desc' }
                });
                data = { sector, visits: sectorVisits };
                break;

            case 'LEADERSHIP_REPORT':
                // Real implementation for Leadership Report
                const leadershipVisits = await prisma.visit.findMany({
                    where: { companyId },
                    select: {
                        avaliacaoLideranca: true,
                        date: true,
                        area: { include: { sector: true } }
                    }
                });

                const groupedData: any = {};

                leadershipVisits.forEach(v => {
                    const sectorName = v.area?.sector?.name || 'Sem Setor';
                    const areaName = v.area?.name || 'Sem Área';

                    if (!groupedData[sectorName]) groupedData[sectorName] = {};
                    if (!groupedData[sectorName][areaName]) groupedData[sectorName][areaName] = [];

                    try {
                        const ratings = v.avaliacaoLideranca ? JSON.parse(v.avaliacaoLideranca) : {};
                        const values = Object.values(ratings).map((val: any) => Number(val)).filter(val => !isNaN(val));
                        const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                        if (avg > 0) groupedData[sectorName][areaName].push({ id: v.date, score: avg });
                    } catch (e) { }
                });

                data = {
                    type,
                    generatedAt: new Date(),
                    groupedData
                };
                break;

            case 'PENDENCIES_REPORT':
                const pendencyStatus = filters?.status;
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

            case 'EXECUTIVE_SUMMARY':
                // Real implementation for Executive Summary
                const [totalExecVisits, totalExecPendencies, resolvedExecPendencies] = await Promise.all([
                    prisma.visit.count({ where: { companyId } }),
                    prisma.pendingItem.count({ where: { companyId } }),
                    prisma.pendingItem.count({ where: { companyId, status: 'RESOLVIDA' } })
                ]);

                const execResolutionRate = totalExecPendencies > 0
                    ? Math.round((resolvedExecPendencies / totalExecPendencies) * 100)
                    : 0;

                data = {
                    type,
                    generatedAt: new Date(),
                    summary: "Resumo Executivo Geral da Empresa.",
                    metrics: {
                        totalVisits: totalExecVisits,
                        resolutionRate: execResolutionRate,
                        satisfaction: "N/A" // Placeholder for now as we don't have satisfaction metric yet
                    },
                    details: "Visão geral estratégica dos indicadores de desempenho."
                };
                break;

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
