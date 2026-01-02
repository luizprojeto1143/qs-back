import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Clock, CheckCircle, FileText, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DecisionTimelineProps {
    entityType: 'COMPLAINT' | 'MEDIATION' | 'ALERT';
    entityId: string;
}

interface Decision {
    id: string;
    action: string;
    reason: string;
    decidedAt: string;
    decidedBy: {
        name: string;
        role: string;
        avatar?: string;
    };
}

const DecisionTimeline = ({ entityType, entityId }: DecisionTimelineProps) => {
    const [history, setHistory] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const res = await api.get(`/decisions/${entityType}/${entityId}`);
                setHistory(res.data);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        if (entityId) {
            loadHistory();
        }
    }, [entityType, entityId]);

    if (loading) return <div className="text-sm text-gray-400 py-4">Carregando histórico...</div>;
    if (error) return <div className="text-sm text-red-400 py-4">Erro ao carregar histórico.</div>;
    if (history.length === 0) return <div className="text-sm text-gray-400 py-4">Nenhum histórico registrado.</div>;

    const getIcon = (action: string) => {
        switch (action) {
            case 'RESOLVIDO':
            case 'ACORDO':
            case 'VALIDADO':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'SEM_ACORDO':
            case 'DESCARTADO':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'ENCAMINHADO_RH':
                return <FileText className="w-5 h-5 text-blue-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="relative pl-4 border-l-2 border-gray-100 space-y-6 my-4">
            {history.map((decision, _) => (
                <div key={decision.id} className="relative">
                    {/* Dot */}
                    <div className="absolute -left-[25px] top-1 bg-white p-1 rounded-full border border-gray-200">
                        {getIcon(decision.action)}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-bold text-gray-800 capitalize">
                                {decision.action.replace(/_/g, ' ').toLowerCase()}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(decision.decidedAt), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                            </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{decision.reason}</p>

                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200/50">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                {decision.decidedBy.avatar ? (
                                    <img src={decision.decidedBy.avatar} className="w-full h-full rounded-full" />
                                ) : (
                                    decision.decidedBy.name?.[0] || 'U'
                                )}
                            </div>
                            <span className="text-xs text-gray-500">
                                {decision.decidedBy.name} ({decision.decidedBy.role})
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DecisionTimeline;
