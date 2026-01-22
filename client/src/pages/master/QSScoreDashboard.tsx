import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
    BarChart3, TrendingUp, TrendingDown, AlertTriangle,
    CheckCircle, Target, ArrowRight, RefreshCw, Zap,
    Building2, Users, Activity, Brain
} from 'lucide-react';

interface QSScoreFactors {
    visitasMensais?: number;
    pendenciasAbertas?: number;
    tempoMedioResolucao?: number;
    colaboradoresPCD?: number;
    taxaCobertura?: number;
}

interface QSScoreData {
    score: number;
    classification: string;
    factors: QSScoreFactors;
    breakdown?: Record<string, number>;
    trend?: string;
}

interface RiskMapFactors {
    pendenciasAbertas?: number;
    visitasRecentes?: number;
    colaboradores?: number;
}

interface RiskMapArea {
    areaId: string;
    areaName: string;
    sectorName: string;
    score: number;
    classification: string;
    color: string;
    factors: RiskMapFactors;
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
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [scoreData, setScoreData] = useState<QSScoreData | null>(null);
    const [riskMap, setRiskMap] = useState<RiskMapData | null>(null);
    const [recalculating, setRecalculating] = useState(false);

    const loadData = useCallback(async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const [scoreRes, riskRes] = await Promise.all([
                api.get(`/qs-score/company/${selectedCompanyId}`),
                api.get(`/qs-score/risk-map/${selectedCompanyId}`),
            ]);
            setScoreData(scoreRes.data);
            setRiskMap(riskRes.data);
        } catch (error) {
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 403) {
                toast.error('QS Score não está habilitado para esta empresa');
            } else {
                toast.error('Erro ao carregar dados do QS Score');
            }
        } finally {
            setLoading(false);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        if (selectedCompanyId) {
            loadData();
        }
    }, [selectedCompanyId, loadData]);



    const handleRecalculate = async () => {
        if (!selectedCompanyId) return;
        setRecalculating(true);
        try {
            await api.post(`/qs-score/recalculate/${selectedCompanyId}`, {});
            toast.success('Scores recalculados com sucesso!');
            loadData();
        } catch {
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
                <button
                    onClick={handleRecalculate}
                    disabled={recalculating}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} />
                    Recalcular Scores
                </button>
            </div>

            {/* Score Principal */}
            {scoreData && (
                <div className={`p-8 rounded-3xl border-2 ${getScoreBgColor(scoreData.score)} transition-all`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Score Geral da Empresa</p>
                            <div className="flex items-baseline gap-4 mt-2">
                                <span className={`text-6xl font-bold ${getScoreColor(scoreData.score)}`}>
                                    {scoreData.score}
                                </span>
                                <span className="text-2xl text-gray-400">/1000</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                <p className={`text-lg font-medium ${getScoreColor(scoreData.score)}`}>
                                    {scoreData.classification}
                                </p>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/60 rounded-full border border-gray-200 text-sm font-medium text-gray-600 shadow-sm backdrop-blur-sm">
                                    <Target className="w-4 h-4 text-blue-600" />
                                    <span>Meta Mensal: 800</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            {scoreData.trend === 'MELHORANDO' && (
                                <div className="flex items-center gap-2 text-green-600">
                                    <TrendingUp className="w-8 h-8" />
                                    <span className="text-lg font-medium">Melhorando</span>
                                </div>
                            )}
                            {scoreData.trend === 'PIORANDO' && (
                                <div className="flex items-center gap-2 text-red-600">
                                    <TrendingDown className="w-8 h-8" />
                                    <span className="text-lg font-medium">Piorando</span>
                                </div>
                            )}
                            {scoreData.trend === 'ESTAVEL' && (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Activity className="w-8 h-8" />
                                    <span className="text-lg font-medium">Estável</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Barra de progresso */}
                    <div className="mt-6">
                        <div className="h-4 bg-white/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-1000"
                                style={{ width: `${scoreData.score / 10}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-500">
                            <span>Crítico</span>
                            <span>Risco</span>
                            <span>Atenção</span>
                            <span>Bom</span>
                            <span>Excelente</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Estatísticas do Mapa de Risco */}
            {riskMap && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="card flex items-center gap-4">
                        <div className="p-3 bg-gray-100 rounded-xl">
                            <Building2 className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{riskMap.summary.total}</p>
                            <p className="text-sm text-gray-500">Áreas Analisadas</p>
                        </div>
                    </div>

                    <div className="card flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{riskMap.summary.green}</p>
                            <p className="text-sm text-gray-500">Áreas Estáveis</p>
                        </div>
                    </div>

                    <div className="card flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                            <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-yellow-600">{riskMap.summary.yellow}</p>
                            <p className="text-sm text-gray-500">Áreas em Atenção</p>
                        </div>
                    </div>

                    <div className="card flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-xl">
                            <Zap className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{riskMap.summary.red}</p>
                            <p className="text-sm text-gray-500">Áreas em Risco</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Mapa de Risco por Área */}
            {riskMap && riskMap.areas.length > 0 && (
                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            Mapa de Risco por Área
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {riskMap.areas
                            .sort((a, b) => a.score - b.score) // Piores primeiro
                            .map((area) => (
                                <div
                                    key={area.areaId}
                                    onClick={() => area.areaId && navigate(`/dashboard/pendencies?areaId=${area.areaId}`)}
                                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${area.areaId ? 'cursor-pointer' : ''} ${area.color === 'red' ? 'border-red-200 bg-red-50/50' :
                                        area.color === 'yellow' ? 'border-yellow-200 bg-yellow-50/50' :
                                            'border-green-200 bg-green-50/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${area.color === 'red' ? 'bg-red-500' :
                                                area.color === 'yellow' ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                                }`} />
                                            <div>
                                                <p className="font-medium text-gray-900">{area.areaName}</p>
                                                <p className="text-sm text-gray-500">{area.sectorName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {getRiskBadge(area.color)}
                                            <div className="text-right">
                                                <p className={`text-2xl font-bold ${getScoreColor(area.score)}`}>
                                                    {area.score}
                                                </p>
                                                <p className="text-xs text-gray-500">pontos</p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>

                                    {/* Fatores */}
                                    {area.factors && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-4 text-xs text-gray-600">
                                            <span>Pendências: {area.factors.pendenciasAbertas || 0}</span>
                                            <span>Visitas: {area.factors.visitasRecentes || 0}</span>
                                            <span>Colaboradores: {area.factors.colaboradores || 0}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Call to Action para IA */}
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
                    <Link
                        to="/dashboard/ai-insights"
                        className="px-6 py-3 bg-white text-blue-600 rounded-xl font-medium hover:bg-blue-50 transition-colors"
                    >
                        Ver Insights de IA
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default QSScoreDashboard;
