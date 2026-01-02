import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
    BarChart3, TrendingUp, TrendingDown, AlertTriangle,
    CheckCircle, Target, ArrowRight, RefreshCw, Zap,
    Building2, Users, Activity, Brain
} from 'lucide-react';

interface QSScoreData {
    score: number;
    classification: string;
    factors: any;
    breakdown?: any;
    trend?: string;
}

interface RiskMapArea {
    areaId: string;
    areaName: string;
    sectorName: string;
    score: number;
    classification: string;
    color: string;
    factors: any;
}

interface RiskMapData {
    areas: RiskMapArea[];
    summary: {
        total: number;
        green: number;
        yellow: number;
        red: number;
        avgScore: number;
    };
}

const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 600) return 'text-blue-600';
    if (score >= 400) return 'text-yellow-600';
    if (score >= 200) return 'text-orange-600';
    return 'text-red-600';
};

const getScoreBgColor = (score: number) => {
    if (score >= 800) return 'bg-green-50 border-green-200';
    if (score >= 600) return 'bg-blue-50 border-blue-200';
    if (score >= 400) return 'bg-yellow-50 border-yellow-200';
    if (score >= 200) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
};

const getRiskBadge = (color: string) => {
    switch (color) {
        case 'green': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Estável</span>;
        case 'yellow': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Atenção</span>;
        case 'red': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Risco</span>;
        default: return null;
    }
};

const QSScoreDashboard: React.FC = () => {
    const { selectedCompanyId } = useCompany();
    const [loading, setLoading] = useState(true);
    const [scoreData, setScoreData] = useState<QSScoreData | null>(null);
    const [riskMap, setRiskMap] = useState<RiskMapData | null>(null);
    const [recalculating, setRecalculating] = useState(false);

    useEffect(() => {
        if (selectedCompanyId) {
            loadData();
        }
    }, [selectedCompanyId]);

    const loadData = async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const [scoreRes, riskRes] = await Promise.all([
                api.get(`/qs-score/company/${selectedCompanyId}`),
                api.get(`/qs-score/risk-map/${selectedCompanyId}`),
            ]);
            setScoreData(scoreRes.data);
            setRiskMap(riskRes.data);
        } catch (error: any) {
            console.error('Error loading QS Score data:', error);
            if (error.response?.status === 403) {
                toast.error('QS Score não está habilitado para esta empresa');
            } else {
                toast.error('Erro ao carregar dados do QS Score');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculate = async () => {
        if (!selectedCompanyId) return;
        setRecalculating(true);
        try {
            await api.post(`/qs-score/recalculate/${selectedCompanyId}`, {});
            toast.success('Scores recalculados com sucesso!');
            loadData();
        } catch (error) {
            toast.error('Erro ao recalcular scores');
        } finally {
            setRecalculating(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        QS Score de Inclusão
                    </h1>
                    <p className="text-gray-500 mt-1">Monitore o nível de inclusão da empresa</p>
                </div>
                                ))}
            </div>
        </div>
    )
}

{/* Call to Action para IA */ }
<div className="card bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
                <Brain className="w-8 h-8" />
            </div>
            <div>
                <h3 className="text-lg font-semibold">Análise Inteligente</h3>
                <p className="text-blue-100">Use a IA para identificar padrões e prioridades</p>
            </div>
        </div>
        <a
            href="/dashboard/ai-insights"
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors"
        >
            Ver Insights de IA
        </a>
    </div>
</div>
                </div >
            );
};

export default QSScoreDashboard;
