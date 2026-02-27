import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
    Brain, Sparkles, AlertTriangle, Bell,
    CheckCircle, XCircle, Send, Clock, Target,
    Lightbulb, FileText
} from 'lucide-react';

interface SmartAlert {
    id: string;
    type: string;
    title: string;
    description: string;
    severity: string;
    status: string;
    area?: { name: string };
    validatedAt?: string;
    sentToRHAt?: string;
    createdAt: string;
    recommendation?: string;
}

interface Priority {
    areaName: string;
    reason: string;
    urgency: string;
}

interface ExecutiveSummary {
    summary: string;
    data: {
        score: number;
        areasCount: number;
        collaboratorsCount: number;
        pendingItems: number;
        openComplaints: number;
        lastVisitDate: string;
    };
}

const getSeverityColor = (severity: string) => {
    switch (severity) {
        case 'CRITICAL': return 'bg-red-100 text-red-700 border-red-200';
        case 'WARNING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
};

const getSeverityIcon = (severity: string) => {
    switch (severity) {
        case 'CRITICAL': return <AlertTriangle className="w-5 h-5 text-red-600" />;
        case 'WARNING': return <Bell className="w-5 h-5 text-yellow-600" />;
        default: return <Lightbulb className="w-5 h-5 text-blue-600" />;
    }
};

const AIInsights: React.FC = () => {
    const { selectedCompanyId } = useCompany();
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<SmartAlert[]>([]);
    const [priorities, setPriorities] = useState<Priority[]>([]);
    const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
    const [activeTab, setActiveTab] = useState<'alerts' | 'priorities' | 'summary'>('alerts');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (selectedCompanyId) {
            loadData();
        }
    }, [selectedCompanyId]);

    const loadData = async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const [alertsRes, prioritiesRes, summaryRes] = await Promise.all([
                api.get(`/ai/alerts/${selectedCompanyId}`),
                api.get(`/ai/priorities/${selectedCompanyId}`).catch(() => ({ data: { priorities: [] } })),
                api.get(`/ai/summary/${selectedCompanyId}`).catch(() => ({ data: null })),
            ]);
            setAlerts(alertsRes.data);
            setPriorities(prioritiesRes.data.priorities || []);
            setSummary(summaryRes.data);
        } catch (error) {
            console.error('Error loading AI data:', error);
            const err = error as { response?: { status?: number } };
            if (err.response?.status === 403) {
                toast.error('IA não está habilitada para esta empresa');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleValidateAlert = async (id: string, action: 'validate' | 'discard') => {
        setProcessingId(id);
        try {
            await api.patch(`/ai/alert/${id}/validate`, { action });
            toast.success(action === 'validate' ? 'Alerta validado!' : 'Alerta descartado');
            loadData();
        } catch (error) {
            toast.error('Erro ao processar alerta');
        } finally {
            setProcessingId(null);
        }
    };

    const handleSendToRH = async (id: string) => {
        setProcessingId(id);
        try {
            await api.patch(`/ai/alert/${id}/send-rh`, { rhNotes: 'Alerta validado pela QS' });
            toast.success('Alerta enviado ao RH!');
            loadData();
        } catch (error) {
            toast.error('Erro ao enviar alerta');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    const pendingAlerts = alerts.filter(a => a.status === 'PENDENTE');
    const validatedAlerts = alerts.filter(a => a.status === 'VALIDADO');

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white">
                        <Brain className="w-6 h-6" />
                    </div>
                    Inteligência Artificial
                </h1>
                <p className="text-gray-500 mt-1">Análises automáticas e recomendações inteligentes</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('alerts')}
                    className={`px-4 py-3 font-medium transition-colors relative ${activeTab === 'alerts'
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Alertas
                        {pendingAlerts.length > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {pendingAlerts.length}
                            </span>
                        )}
                    </div>
                    {activeTab === 'alerts' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('priorities')}
                    className={`px-4 py-3 font-medium transition-colors relative ${activeTab === 'priorities'
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Prioridades
                    </div>
                    {activeTab === 'priorities' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('summary')}
                    className={`px-4 py-3 font-medium transition-colors relative ${activeTab === 'summary'
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Resumo Executivo
                    </div>
                    {activeTab === 'summary' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                </button>
            </div>

            {/* Alertas */}
            {activeTab === 'alerts' && (
                <div className="space-y-6">
                    {pendingAlerts.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-yellow-600" />
                                Aguardando Validação ({pendingAlerts.length})
                            </h2>
                            <div className="space-y-4">
                                {pendingAlerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={`p-5 rounded-xl border-2 ${getSeverityColor(alert.severity)}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                {getSeverityIcon(alert.severity)}
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                                                    {alert.area && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            Área: {alert.area.name}
                                                        </p>
                                                    )}
                                                    {alert.recommendation && (
                                                        <div className="mt-3 p-3 bg-white/50 rounded-lg">
                                                            <p className="text-xs font-medium text-gray-700">Recomendação da IA:</p>
                                                            <p className="text-sm text-gray-600">{alert.recommendation}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleValidateAlert(alert.id, 'validate')}
                                                    disabled={processingId === alert.id}
                                                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                                                    title="Validar"
                                                >
                                                    <CheckCircle className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleValidateAlert(alert.id, 'discard')}
                                                    disabled={processingId === alert.id}
                                                    className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                                                    title="Descartar"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {validatedAlerts.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                Validados - Aguardando Envio ao RH ({validatedAlerts.length})
                            </h2>
                            <div className="space-y-4">
                                {validatedAlerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="p-5 rounded-xl border-2 border-green-200 bg-green-50"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                                            </div>
                                            <button
                                                onClick={() => handleSendToRH(alert.id)}
                                                disabled={processingId === alert.id}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                            >
                                                <Send className="w-4 h-4" />
                                                Enviar ao RH
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {alerts.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Nenhum alerta no momento</h3>
                            <p className="text-gray-500 mt-1">A IA não identificou padrões preocupantes</p>
                        </div>
                    )}
                </div>
            )}

            {/* Prioridades */}
            {activeTab === 'priorities' && (
                <div className="space-y-6">
                    <div className="card bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                        <div className="flex items-center gap-3 mb-4">
                            <Target className="w-6 h-6 text-purple-600" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                "Se você só puder atuar em 2-3 áreas este mês..."
                            </h2>
                        </div>
                        <p className="text-gray-600">
                            A IA analisou todas as áreas e recomenda focar nestas prioridades:
                        </p>
                    </div>

                    {priorities.length > 0 ? (
                        <div className="space-y-4">
                            {priorities.map((priority, index) => (
                                <div
                                    key={index}
                                    className={`p-5 rounded-xl border-2 ${priority.urgency === 'ALTA' ? 'border-red-200 bg-red-50' :
                                        priority.urgency === 'MEDIA' ? 'border-yellow-200 bg-yellow-50' :
                                            'border-green-200 bg-green-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${priority.urgency === 'ALTA' ? 'bg-red-500 text-white' :
                                                priority.urgency === 'MEDIA' ? 'bg-yellow-500 text-white' :
                                                    'bg-green-500 text-white'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{priority.areaName}</h3>
                                                <p className="text-sm text-gray-600">{priority.reason}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${priority.urgency === 'ALTA' ? 'bg-red-100 text-red-700' :
                                            priority.urgency === 'MEDIA' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-green-100 text-green-700'
                                            }`}>
                                            {priority.urgency}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Target className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Sem prioridades definidas</h3>
                            <p className="text-gray-500 mt-1">Execute a análise de IA para gerar prioridades</p>
                        </div>
                    )}
                </div>
            )}

            {/* Resumo Executivo */}
            {activeTab === 'summary' && summary && (
                <div className="space-y-6">
                    {/* Métricas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="card">
                            <p className="text-sm text-gray-500">Score Geral</p>
                            <p className="text-2xl font-bold text-blue-600">{summary.data.score}</p>
                        </div>
                        <div className="card">
                            <p className="text-sm text-gray-500">Áreas</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.data.areasCount}</p>
                        </div>
                        <div className="card">
                            <p className="text-sm text-gray-500">Colaboradores PCD</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.data.collaboratorsCount}</p>
                        </div>
                        <div className="card">
                            <p className="text-sm text-gray-500">Pendências</p>
                            <p className="text-2xl font-bold text-orange-600">{summary.data.pendingItems}</p>
                        </div>
                    </div>

                    {/* Resumo */}
                    <div className="card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Resumo Executivo (IA)</h2>
                        </div>
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                            {summary.summary}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIInsights;
