import { Request, Response } from 'express';
import prisma from '../prisma';

export const indicatorsController = {
    // Obter Censo de Diversidade
    async getDiversityCensus(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const user = (req as any).user;

            if (user.role !== 'MASTER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const collaborators = await prisma.collaboratorProfile.findMany({
                where: { area: { sector: { companyId } } },
                // @ts-ignore
                select: {
                    gender: true,
                    ethnicity: true,
                    birthDate: true,
                    disabilityType: true
                }
            });

            // Agregação de Gênero
            const genderDistribution = {
                MASCULINO: 0,
                FEMININO: 0,
                OUTRO: 0,
                NAO_DECLARADO: 0
            };

            // Agregação de Etnia
            const ethnicityDistribution = {
                BRANCA: 0,
                PRETA: 0,
                PARDA: 0,
                AMARELA: 0,
                INDIGENA: 0,
                NAO_DECLARADO: 0
            };

            // Agregação de Faixa Etária
            const ageDistribution = {
                '18-24': 0,
                '25-34': 0,
                '35-44': 0,
                '45-54': 0,
                '55+': 0
            };

            collaborators.forEach(c => {
                // Gênero
                const gender = (c as any).gender || 'NAO_DECLARADO';
                if (gender in genderDistribution) {
                    genderDistribution[gender as keyof typeof genderDistribution]++;
                } else {
                    genderDistribution['NAO_DECLARADO']++;
                }

                // Etnia
                const ethnicity = (c as any).ethnicity || 'NAO_DECLARADO';
                if (ethnicity in ethnicityDistribution) {
                    ethnicityDistribution[ethnicity as keyof typeof ethnicityDistribution]++;
                } else {
                    ethnicityDistribution['NAO_DECLARADO']++;
                }

                // Faixa Etária
                if ((c as any).birthDate) {
                    const age = new Date().getFullYear() - new Date((c as any).birthDate).getFullYear();
                    if (age >= 18 && age <= 24) ageDistribution['18-24']++;
                    else if (age >= 25 && age <= 34) ageDistribution['25-34']++;
                    else if (age >= 35 && age <= 44) ageDistribution['35-44']++;
                    else if (age >= 45 && age <= 54) ageDistribution['45-54']++;
                    else if (age >= 55) ageDistribution['55+']++;
                }
            });

            res.json({
                totalCollaborators: collaborators.length,
                gender: Object.entries(genderDistribution).map(([name, value]) => ({ name, value })),
                ethnicity: Object.entries(ethnicityDistribution).map(([name, value]) => ({ name, value })),
                age: Object.entries(ageDistribution).map(([name, value]) => ({ name, value })),
            });
        } catch (error) {
            console.error('Error getting diversity census:', error);
            res.status(500).json({ error: 'Erro ao obter censo de diversidade' });
        }
    },

    // Obter Taxa de Retenção de PCDs
    async getPcdRetention(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const user = (req as any).user;

            if (user.role !== 'MASTER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            // Buscar todos os colaboradores PCDs (Ativos e Inativos)
            const pcds = await prisma.collaboratorProfile.findMany({
                where: {
                    area: { sector: { companyId } },
                    disabilityType: { not: 'NENHUMA' } // Assumindo que 'NENHUMA' indica sem deficiência
                },
                // @ts-ignore
                select: {
                    id: true,
                    isActive: true,
                    admissionDate: true,
                    terminationDate: true
                }
            });

            const totalPcds = pcds.length;
            const activePcds = pcds.filter(p => p.isActive).length;
            const terminatedPcds = totalPcds - activePcds;

            // Taxa de Retenção Simplificada: (Ativos / Total já contratados) * 100
            // Ou (Ativos / (Ativos + Desligados)) * 100
            const retentionRate = totalPcds > 0 ? (activePcds / totalPcds) * 100 : 0;

            res.json({
                totalPcds,
                activePcds,
                terminatedPcds,
                retentionRate: Number(retentionRate.toFixed(1))
            });

        } catch (error) {
            console.error('Error getting PCD retention:', error);
            res.status(500).json({ error: 'Erro ao obter taxa de retenção' });
        }
    },

    // Obter Comparativo Setorial
    async getSectorComparison(req: Request, res: Response) {
        try {
            const { companyId } = req.params;
            const user = (req as any).user;

            if (user.role !== 'MASTER' && user.role !== 'RH') {
                return res.status(403).json({ error: 'Sem permissão' });
            }

            const collaborators = await prisma.collaboratorProfile.findMany({
                where: { area: { sector: { companyId } } },
                include: { area: true },
            });

            // Agrupar por Área
            const areaMap = new Map<string, any>();

            collaborators.forEach(c => {
                const areaName = c.area.name;
                if (!areaMap.has(areaName)) {
                    areaMap.set(areaName, {
                        name: areaName,
                        MASCULINO: 0,
                        FEMININO: 0,
                        OUTRO: 0,
                        BRANCA: 0,
                        PRETA: 0,
                        PARDA: 0,
                        AMARELA: 0,
                        INDIGENA: 0,
                        total: 0
                    });
                }

                const entry = areaMap.get(areaName);
                entry.total++;

                // Gênero
                const gender = (c as any).gender || 'NAO_DECLARADO';
                if (entry[gender] !== undefined) entry[gender]++;

                // Etnia
                const ethnicity = (c as any).ethnicity || 'NAO_DECLARADO';
                if (entry[ethnicity] !== undefined) entry[ethnicity]++;
            });

            const result = Array.from(areaMap.values());

            res.json(result);
        } catch (error) {
            console.error('Error getting sector comparison:', error);
            res.status(500).json({ error: 'Erro ao obter comparativo entre setores' });
        }
    }
};
