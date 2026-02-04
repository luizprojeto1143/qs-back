import { useQuery } from '@tanstack/react-query';
import { Calendar, ClipboardList, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../../lib/api';

interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | string;
    color: string;
    onClick?: () => void;
}

const StatCard = ({ icon: Icon, label, value, color, onClick }: StatCardProps) => (
    <div
        onClick={onClick}
        className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer`}
    >
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

export const InterpreterDashboard = ({ navigate }: { navigate: (path: string) => void }) => {
    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['interpreterRequests', 'dashboard'],
        queryFn: async () => {
            const response = await api.get('/interpreter/requests');
            return response.data;
        },
        initialData: []
    });

    const pendingCount = requests.filter((r: any) => r.status === 'PENDING').length;
    const approvedCount = requests.filter((r: any) => r.status === 'APPROVED').length;

    // Find next approved event
    const nextEvent = requests
        .filter((r: any) => r.status === 'APPROVED' && new Date(r.date) >= new Date())
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    return (
        <div className="space-y-6">
            {/* Quick Action & Next Event */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                    className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white flex flex-col justify-between cursor-pointer hover:scale-[1.01] transition-transform"
                    onClick={() => navigate('/rh/interpreter')}
                >
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Solicitar Intérprete</h2>
                        <p className="text-blue-100 text-lg">Precisa de suporte agora?</p>
                    </div>
                    <div className="mt-8 flex items-center space-x-3 bg-white/10 w-fit px-4 py-2 rounded-lg backdrop-blur-sm">
                        <Calendar className="h-6 w-6" />
                        <span className="font-medium">Agendar Novo Pedido</span>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    <h3 className="text-gray-500 font-medium mb-4 uppercase text-sm tracking-wider">Próximo Agendamento</h3>
                    {nextEvent ? (
                        <div>
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {format(new Date(nextEvent.date), "dd/MM", { locale: ptBR })}
                                    </p>
                                    <p className="text-gray-500">
                                        às {nextEvent.startTime}
                                    </p>
                                </div>
                            </div>
                            <p className="text-lg font-medium text-gray-900 mt-4">{nextEvent.theme}</p>
                            <p className="text-gray-500 mt-1">{nextEvent.location || 'Link de Reunião'}</p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-4">
                            <Calendar className="h-12 w-12 mb-2 opacity-20" />
                            <p>Nenhum agendamento futuro confirmado.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Clock}
                    label="Solicitações Pendentes"
                    value={pendingCount}
                    color="bg-orange-500"
                    onClick={() => navigate('/rh/interpreter')}
                />
                <StatCard
                    icon={ClipboardList}
                    label="Agendamentos Confirmados"
                    value={approvedCount}
                    color="bg-green-500"
                    onClick={() => navigate('/rh/interpreter')}
                />
            </div>

            {/* Recent List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Solicitações Recentes</h3>
                    <button
                        onClick={() => navigate('/rh/interpreter')}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Ver tudo
                    </button>
                </div>
                <div className="divide-y divide-gray-100">
                    {requests.slice(0, 5).map((req: any) => (
                        <div key={req.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                                <div className={`w-2 h-2 rounded-full ${req.status === 'APPROVED' ? 'bg-green-500' :
                                    req.status === 'REJECTED' ? 'bg-red-500' : 'bg-orange-500'
                                    }`} />
                                <div>
                                    <p className="font-medium text-sm text-gray-900">{req.theme}</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(req.date), "dd/MM/yyyy", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {requests.length === 0 && (
                        <p className="p-4 text-center text-gray-500 text-sm">Nenhuma solicitação encontrada.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
