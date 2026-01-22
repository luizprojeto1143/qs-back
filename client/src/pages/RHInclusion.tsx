
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Activity, AlertTriangle, Info, Map as MapIcon, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Metric {
    name: string;
    value: string;
    status: 'success' | 'warning';
}

interface QSScoreCardProps {
    score: number;
    classification: string;
    metrics: Metric[];
}

interface Alert {
    id: string;
    title: string;
    description: string;
    severity: string;
    status: string;
}

interface ScoreData {
    score: number;
    classification: string;
    metrics: Metric[];
}

// Placeholder components - these would be complex charts/heatmaps
const QSScoreCard = ({ score, classification, metrics }: QSScoreCardProps) => {
    const getScoreColor = (s: number) => {
        if (s >= 800) return 'text-green-600';
        if (s >= 500) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <h3 className="text-gray-500 font-medium mb-4">QS Score de Inclusão</h3>
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(score)}`}>{score}</div>
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide bg-gray-100 inline-block px-3 py-1 rounded-full">{classification}</div>
            <p className="mt-6 text-sm text-gray-500 max-w-md mx-auto">
                Índice global de inclusão baseado em conformidade legal e bem-estar (QS Method).
            </p>
            <div className="grid grid-cols-2 gap-2 mt-6">
                {(metrics || []).map((m) => (
                    <div key={m.name} className="bg-gray-50 p-2 rounded-lg text-xs">
                        <span className="block text-gray-400 mb-1">{m.name}</span>
                        <span className={`font-bold text-sm ${m.status === 'success' ? 'text-green-600' : 'text-orange-500'}`}>
                            {m.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RiskMap = () => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-96 flex items-center justify-center bg-gray-50">
        <div className="text-center">
            <MapIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-900 font-medium">Mapa de Calor (Simulação)</h3>
            <p className="text-sm text-gray-500">Visualização de áreas com maior incidência de riscos.</p>
        </div>
    </div>
);

const AlertsList = ({ alerts }: { alerts: Alert[] }) => (
    <div className="space-y-4">
        {alerts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed text-gray-500">
                Nenhum alerta ativo no momento.
            </div>
        ) : (
            alerts.map((alert) => (
                <div key={alert.id} className="bg-white p-4 rounded-xl border-l-4 border-l-red-500 shadow-sm flex items-start gap-4">
                    <div className="p-2 bg-red-50 rounded-lg shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                        <div className="mt-2 flex gap-2">
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">Severidade: {alert.severity}</span>
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700">{alert.status}</span>
                        </div>
                    </div>
                </div>
            ))
        )}
    </div>
);

const RHInclusion = () => {
    const [activeTab, setActiveTab] = useState('SCORE'); // SCORE, MAP, ALERTS
    const [scoreData, setScoreData] = useState<ScoreData | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Mocking data for now as these endpoints might need explicit params or not populated yet
                // Actual endpoint: api.get('/qs-score')
                // For demo/prototype purposes:
                setScoreData({
                    score: 720,
                    classification: 'BOM',
                    metrics: [
                        { name: 'Cota Legal (Art. 93)', value: '95%', status: 'success' },
                        { name: 'Acessibilidade Digital', value: '60%', status: 'warning' },
                        { name: 'Acessibilidade Física', value: '100%', status: 'success' },
                        { name: 'Retenção de PCDs', value: '88%', status: 'success' }
                    ]
                });

                // Actual endpoint: api.get('/ai/alerts')
                // Mock:
                setAlerts([
                    { id: '1', title: 'Risco de Turnover - Área de TI', description: 'IA detectou padrão de insatisfação em feedbacks recentes.', severity: 'ALTA', status: 'PENDENTE' }
                ]);

            } catch (error) {
                console.error("Error fetching inclusion data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Inclusão e Riscos</h1>
                    <p className="text-gray-500">Monitoramento inteligente do ambiente de trabalho.</p>
                </div>

                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('SCORE')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'SCORE' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        QS Score
                    </button>
                    <button
                        onClick={() => setActiveTab('MAP')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'MAP' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Mapa de Risco
                    </button>
                    <button
                        onClick={() => setActiveTab('ALERTS')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'ALERTS' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Alertas Inteligentes
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="animate-pulse h-64 bg-gray-100 rounded-xl"></div>
            ) : (
                <div className="min-h-[400px]">
                    {activeTab === 'SCORE' && scoreData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <QSScoreCard {...scoreData} />
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-500" />
                                    Evolução Recente
                                </h3>
                                <div className="h-48 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed">
                                    Gráfico de evolução do score
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'MAP' && <RiskMap />}

                    {activeTab === 'ALERTS' && <AlertsList alerts={alerts} />}
                </div>
            )}
        </div>
    );
};

export default RHInclusion;
