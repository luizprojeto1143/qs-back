import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

// --- HELPER FUNCTIONS ---

const getVisitIndividualReport = async (filters: any) => {
    if (!filters?.visitId) throw { status: 400, message: 'Visit ID required' };

    return await prisma.visit.findFirst({
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
};

const getCompanyMonthlyReport = async (filters: any, companyId: string) => {
    const now = new Date();
    // Month logic: 0-indexed vs 1-indexed handling
    let rawMonth = filters?.month !== undefined ? filters.month : now.getMonth();
    const month = rawMonth > 11 ? rawMonth - 1 : rawMonth;
    const year = filters?.year || now.getFullYear();
    const startDate = new Date(year, Math.max(0, Math.min(11, month)), 1);
    const endDate = new Date(year, Math.max(0, Math.min(11, month)) + 1, 0);

    const [monthlyVisits, monthlyPendencies, activeCollaborators, monthlyComplaints] = await Promise.all([
        prisma.visit.findMany({
            where: {
                companyId,
                date: { gte: startDate, lte: endDate }
            },
            orderBy: { date: 'desc' },
            include: {
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

    return {
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
};

const getCollaboratorHistoryReport = async (filters: any, companyId: string) => {
    if (!filters?.collaboratorId) throw { status: 400, message: 'Collaborator ID required' };

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

    if (!collaborator) throw { status: 404, message: 'Collaborator profile not found' };

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

    return { collaborator, visits: historyVisits, pendencies: historyPendencies };
};

const getAreaReport = async (filters: any, companyId: string) => {
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
        return { area, visits: areaVisits, pendencies: areaPendencies };
    } else {
        const allAreas = await prisma.area.findMany({ include: { sector: true } });
        const allVisits = await prisma.visit.findMany({ where: { companyId }, include: { area: true }, orderBy: { date: 'desc' } });
        return { areas: allAreas, visits: allVisits };
    }
};

const getInclusionDiagnosisReport = async (companyId: string) => {
    const company = await prisma.company.findFirst({
        where: { id: companyId },
        select: { inclusionDiagnosis: true }
    });
    try {
        return company?.inclusionDiagnosis ? JSON.parse(company.inclusionDiagnosis) : { categories: {} };
    } catch (e) {
        console.error('Error parsing inclusionDiagnosis', e);
        return { categories: {}, error: 'Invalid data format' };
    }
};

const getSectorReport = async (filters: any) => {
    if (!filters?.sectorId) throw { status: 400, message: 'Sector ID required' };

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
    return { sector, visits: sectorVisits };
};

const getLeadershipReport = async (companyId: string) => {
    const leadershipVisits = await prisma.visit.findMany({
        where: { companyId },
        select: {
            evaluations: true,
            date: true,
            area: { include: { sector: true } }
        }
    });

    const groupedData: any = {};

    leadershipVisits.forEach((v: any) => {
        const sectorName = v.area?.sector?.name || 'Sem Setor';
        const areaName = v.area?.name || 'Sem Área';

        if (!groupedData[sectorName]) groupedData[sectorName] = {};
        if (!groupedData[sectorName][areaName]) groupedData[sectorName][areaName] = [];

        try {
            const leadEvals = v.evaluations?.filter((e: any) => e.type === 'LIDERANCA' || e.type === 'LIDERANÇA');
            if (leadEvals && leadEvals.length > 0) {
                const total = leadEvals.reduce((sum: number, e: any) => sum + e.rating, 0);
                const avg = total / leadEvals.length;
                if (avg > 0) groupedData[sectorName][areaName].push({ id: v.date, score: avg });
            }
        } catch (e) {
            console.warn('[Report] Error processing visit evaluation:', e instanceof Error ? e.message : e);
        }
    });

    return {
        type: 'LEADERSHIP_REPORT',
        generatedAt: new Date(),
        groupedData
    };
};

const getPendenciesReport = async (filters: any, companyId: string) => {
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
    return { pendencies: allPendencies };
};

const getExecutiveSummaryReport = async (companyId: string) => {
    const [totalExecVisits, totalExecPendencies, resolvedExecPendencies] = await Promise.all([
        prisma.visit.count({ where: { companyId } }),
        prisma.pendingItem.count({ where: { companyId } }),
        prisma.pendingItem.count({ where: { companyId, status: 'RESOLVIDA' } })
    ]);

    const execResolutionRate = totalExecPendencies > 0
        ? Math.round((resolvedExecPendencies / totalExecPendencies) * 100)
        : 0;

    return {
        type: 'EXECUTIVE_SUMMARY',
        generatedAt: new Date(),
        summary: "Resumo Executivo Geral da Empresa.",
        metrics: {
            totalVisits: totalExecVisits,
            resolutionRate: execResolutionRate,
            satisfaction: "N/A"
        },
        details: "Visão geral estratégica dos indicadores de desempenho."
    };
};

const getDefaultReport = async (companyId: string) => {
    const [visits, pendencies, collaborators] = await Promise.all([
        prisma.visit.count({ where: { companyId } }),
        prisma.pendingItem.count({ where: { companyId, status: 'PENDENTE' } }),
        prisma.user.count({ where: { companyId, role: 'COLABORADOR' } })
    ]);
    return { visits, pendencies, collaborators };
};

// --- MAIN CONTROLLER FUNCTIONS ---

export const listReports = async (req: Request, res: Response) => {
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

        const companyId = user.companyId;
        let data: any = {};

        switch (type) {
            case 'VISIT_INDIVIDUAL':
                data = await getVisitIndividualReport(filters);
                break;
            case 'COMPANY_MONTHLY':
                data = await getCompanyMonthlyReport(filters, companyId);
                break;
            case 'COLLABORATOR_HISTORY':
                data = await getCollaboratorHistoryReport(filters, companyId);
                break;
            case 'AREA_REPORT':
                data = await getAreaReport(filters, companyId);
                break;
            case 'INCLUSION_DIAGNOSIS':
                data = await getInclusionDiagnosisReport(companyId);
                break;
            case 'SECTOR_REPORT':
                data = await getSectorReport(filters);
                break;
            case 'LEADERSHIP_REPORT':
                data = await getLeadershipReport(companyId);
                break;
            case 'PENDENCIES_REPORT':
                data = await getPendenciesReport(filters, companyId);
                break;
            case 'EXECUTIVE_SUMMARY':
                data = await getExecutiveSummaryReport(companyId);
                break;
            default:
                data = await getDefaultReport(companyId);
                break;
        }

        res.json({
            success: true,
            message: 'Relatório gerado com sucesso',
            data,
            fileName: `relatorio_${type.toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`
        });

    } catch (error: any) {
        if (error.status && error.message) {
            return res.status(error.status).json({ error: error.message });
        }
        sendError500(res, ERROR_CODES.REP_GENERATE, error);
    }
};
