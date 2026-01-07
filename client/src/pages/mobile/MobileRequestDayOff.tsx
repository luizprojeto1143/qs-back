import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface DayOffRequest {
    id: string;
    date: string;
    type: string;
    reason?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
}

const STATUS_CONFIG = {
    PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    APPROVED: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    REJECTED: { label: 'Rejeitado', color: 'bg-red-100 text-red-700', icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
    FOLGA: 'Folga',
    COMPENSACAO: 'Compensação',
    ATESTADO: 'Atestado',
    FERIAS: 'Férias',
    LICENCA: 'Licença',
    OUTRO: 'Outros',
};

const MobileRequestDayOff = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [myRequests, setMyRequests] = useState<DayOffRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [formData, setFormData] = useState({
        date: '',
        type: 'FOLGA',
        reason: ''
    });

    // Load user's previous requests
    useEffect(() => {
        const fetchMyRequests = async () => {
            try {
                const res = await api.get('/days-off/my-requests');
                setMyRequests(res.data || []);
            } catch (error) {
                console.error('Error fetching my requests', error);
            } finally {
                setLoadingRequests(false);
            }
        };
        fetchMyRequests();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!formData.date || !formData.reason) {
                toast.error('Preencha todos os campos obrigatórios');
                setLoading(false);
                return;
            }

            await api.post('/days-off', {
                date: formData.date,
                type: formData.type,
                reason: formData.reason
            });

            toast.success('Solicitação enviada com sucesso!');
            setFormData({ date: '', type: 'FOLGA', reason: '' });

            // Refresh requests list
            const res = await api.get('/days-off/my-requests');
            setMyRequests(res.data || []);
        } catch (error) {
            console.error('Error submitting day off', error);
            toast.error('Erro ao enviar solicitação');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 flex items-center space-x-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Solicitar Folga</h1>
            </div>

            <div className="p-6 space-y-6">
                {/* My Requests Section */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-700 mb-3">Minhas Solicitações</h2>

                    {loadingRequests ? (
                        <p className="text-sm text-gray-500 text-center py-4">Carregando...</p>
                    ) : myRequests.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">Nenhuma solicitação encontrada</p>
                    ) : (
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                            {myRequests.map((request) => {
                                const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.PENDING;
                                const StatusIcon = statusConfig.icon;
                                return (
                                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatDate(request.date)} - {TYPE_LABELS[request.type] || request.type}
                                            </p>
                                            {request.reason && (
                                                <p className="text-xs text-gray-500 truncate max-w-[180px]">{request.reason}</p>
                                            )}
                                        </div>
                                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* New Request Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-sm font-bold text-gray-700">Nova Solicitação</h2>

                    <div className="bg-yellow-50 p-4 rounded-2xl flex items-start space-x-3 text-yellow-800 text-sm">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p>Sua solicitação entrará em análise pela liderança. Entraremos em contato após avaliação.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Data da Folga</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Tipo</label>
                        <select
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="FOLGA">Folga Comum</option>
                            <option value="COMPENSACAO">Compensação de Banco</option>
                            <option value="ATESTADO">Atestado Médico</option>
                            <option value="OUTRO">Outros</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Motivo / Justificativa</label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <textarea
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[120px]"
                                placeholder="Explique o motivo da solicitação..."
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? 'Enviando...' : 'Enviar Solicitação'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MobileRequestDayOff;
