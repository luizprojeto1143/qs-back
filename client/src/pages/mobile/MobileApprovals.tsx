import { useState, useEffect } from 'react';
import { Check, X, Calendar, Clock, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

const MobileApprovals = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const [resDayOffs, resSchedules] = await Promise.all([
                api.get('/days-off/pending'),
                api.get('/schedules?status=PENDENTE')
            ]);

            const dayOffs = resDayOffs.data.map((d: any) => ({
                id: d.id,
                type: d.type === 'FOLGA' ? 'Folga' : d.type,
                user: d.collaborator?.user?.name || 'Colaborador',
                date: new Date(d.date).toLocaleDateString(),
                rawDate: d.date,
                category: 'dayoff'
            }));

            const schedules = resSchedules.data.map((s: any) => ({
                id: s.id,
                type: 'Agendamento',
                user: s.requester || 'Usuário',
                date: `${new Date(s.date).toLocaleDateString()} às ${s.time}`,
                rawDate: s.date,
                category: 'schedule'
            }));

            setRequests([...dayOffs, ...schedules].sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()));

        } catch (error) {
            console.error('Error fetching approvals', error);
            toast.error('Erro ao carregar solicitações');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: string, category: string, action: 'APPROVE' | 'REJECT') => {
        try {
            if (category === 'dayoff') {
                await api.post(`/days-off/${id}/review`, { action });
            } else {
                // Schedule uses PUT with status
                const status = action === 'APPROVE' ? 'APROVADO' : 'RECUSADO';
                await api.put(`/schedules/${id}`, { status });
            }

            toast.success(action === 'APPROVE' ? 'Solicitação aprovada!' : 'Solicitação recusada!');
            fetchRequests(); // Refresh list

        } catch (error) {
            console.error('Error processing request', error);
            toast.error('Erro ao processar solicitação.');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500 flex flex-col items-center"><RefreshCw className="animate-spin mb-2" />Carregando...</div>;

    return (
        <div className="space-y-6 animate-in slide-in-from-right pb-24">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Aprovações</h1>
                <p className="text-gray-500">Solicitações da equipe ({requests.length})</p>
            </div>

            {requests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="font-bold text-gray-900">Tudo em dia!</h3>
                    <p className="text-gray-500">Nenhuma pendência para aprovar.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-lg uppercase tracking-wide mb-2 ${req.category === 'dayoff' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                        {req.type}
                                    </span>
                                    <h3 className="font-bold text-gray-900">{req.user}</h3>
                                    <p className="text-sm text-gray-500 flex items-center mt-1">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        {req.date}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAction(req.id, req.category, 'REJECT')}
                                    className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 active:scale-95 transition-all"
                                >
                                    Recusar
                                </button>
                                <button
                                    onClick={() => handleAction(req.id, req.category, 'APPROVE')}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                >
                                    Aprovar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MobileApprovals;
