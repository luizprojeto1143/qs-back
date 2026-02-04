import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, ClipboardList, AlertTriangle, Calendar, ChevronDown, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import { SkeletonCard } from '../components/Skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../lib/api';
import { VisitDetailsModal } from '../components/modals/VisitDetailsModal';

interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | string;
    color: string;
    onClick?: () => void;
}

interface Activity {
    id: string;
    description: string;
    time: string;
    author: string;
}

// Stats Card Component
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

// General Dashboard Component (Regular/Master View)
const GeneralDashboard = ({ stats, recentActivity, navigate, loading }: any) => (
    <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
                <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </>
            ) : (
                <>
                    <StatCard
                        icon={Users}
                        label="Colaboradores"
                        value={stats.collaborators}
                        color="bg-blue-500"
                        onClick={() => navigate('/dashboard/collaborators')}
                    />
                    <StatCard
                        icon={ClipboardList}
                        label="Acompanhamentos"
                        value={stats.visits}
                        color="bg-green-500"
                        onClick={() => navigate('/dashboard/visits')}
                    />
                    <StatCard
                        icon={AlertTriangle}
                        label="Pendências"
                        value={stats.pendencies}
                        color="bg-orange-500"
                        onClick={() => navigate('/dashboard/pendencies')}
                    />
                    <StatCard
                        icon={Calendar}
                        label="Agendamentos"
                        value={stats.schedules}
                        color="bg-purple-500"
                        onClick={() => navigate('/dashboard/schedules')}
                    />
                </>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Atividade Recente</h3>
                <div className="space-y-4">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((activity: Activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0 hover:bg-gray-50 p-2 -mx-2 rounded-lg cursor-pointer transition-colors"
                            >
                                <div className="mt-1 bg-blue-50 p-2 rounded-full">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                                    <p className="text-xs text-gray-500">
                                        {format(new Date(activity.time), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })} • por {activity.author}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm">Nenhuma atividade recente encontrada.</p>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Atalhos Rápidos</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/visits')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-blue-50 transition-all text-left group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <ClipboardList className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" />
                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="font-medium text-gray-900 block">Novo Acompanhamento</span>
                        <span className="text-sm text-gray-500">Registrar visita</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/pendencies')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-blue-50 transition-all text-left group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <AlertTriangle className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" />
                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="font-medium text-gray-900 block">Nova Pendência</span>
                        <span className="text-sm text-gray-500">Criar tarefa</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/schedules')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-blue-50 transition-all text-left group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <Calendar className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" />
                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="font-medium text-gray-900 block">Novo Agendamento</span>
                        <span className="text-sm text-gray-500">Agendar visita</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/reports')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-blue-50 transition-all text-left group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <Users className="h-6 w-6 text-gray-400 group-hover:text-primary transition-colors" />
                            <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
                        </div>
                        <span className="font-medium text-gray-900 block">Relatórios</span>
                        <span className="text-sm text-gray-500">Visualizar métricas</span>
                    </button>
                </div>
            </div>
        </div>
    </>
);

// Interpreter Dashboard Component (Exclusive View)
const InterpreterDashboard = ({ navigate }: { navigate: any }) => {
    const { data: requests, isLoading } = useQuery({
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
                            <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 text-gray-600">
                                {req.status === 'APPROVED' ? 'Confirmado' :
                                    req.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                            </span>
                        </div>
                    ))}
                    {requests.length === 0 && (
                        <div className="p-8 text-center text-gray-500">Nenhuma solicitação encontrada.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main Dashboard Component
const DashboardHome = () => {
    const navigate = useNavigate();
    const { companies, selectedCompanyId, selectCompany } = useCompany();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Get current company details to check for Exclusive Mode
    const currentCompany = companies.find(c => c.id === selectedCompanyId);
    const isInterpreterOnly = currentCompany?.interpreterOnly;

    const { data, isLoading: loading } = useQuery({
        queryKey: ['dashboardStats', selectedCompanyId],
        queryFn: async () => {
            // If interpreter only, we don't need general dashboard stats, but we let useQuery run mostly empty or skip
            if (isInterpreterOnly) return { stats: {}, recentActivity: [] };

            const result = await api.get('/dashboard/master');
            return result.data;
        },
        enabled: !isInterpreterOnly, // Don't fetch general stats if exclusive mode
        initialData: { stats: { collaborators: 0, visits: 0, pendencies: 0, schedules: 0 }, recentActivity: [] }
    });

    const stats = data.stats || { collaborators: 0, visits: 0, pendencies: 0, schedules: 0 };
    const recentActivity = data.recentActivity || [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between relative z-50">
                <h1 className="text-2xl font-bold text-gray-900">
                    {isInterpreterOnly ? 'Central de Libras' : 'Painel Consultoria'}
                </h1>
                <div className="relative z-[100]">
                    <div className="relative z-[100]">
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full md:w-64 bg-white pl-4 pr-10 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-between"
                        >
                            <span className="truncate">
                                {selectedCompanyId
                                    ? companies.find(c => c.id === selectedCompanyId)?.name
                                    : 'Todas as Empresas'}
                            </span>
                            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-[90]"
                                    onClick={() => setIsDropdownOpen(false)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-full md:w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[100] max-h-96 overflow-y-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            selectCompany('');
                                            setIsDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${!selectedCompanyId ? 'text-primary font-medium bg-blue-50' : 'text-gray-700'
                                            }`}
                                    >
                                        Todas as Empresas
                                    </button>
                                    {companies.map(company => (
                                        <button
                                            type="button"
                                            key={company.id}
                                            onClick={() => {
                                                selectCompany(company.id);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedCompanyId === company.id ? 'text-primary font-medium bg-blue-50' : 'text-gray-700'
                                                }`}
                                        >
                                            {company.name}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Switcher */}
            {isInterpreterOnly ? (
                <InterpreterDashboard navigate={navigate} />
            ) : (
                <GeneralDashboard
                    stats={stats}
                    recentActivity={recentActivity}
                    navigate={navigate}
                    loading={loading}
                />
            )}

            {/* Visit Details Modal */}
            <VisitDetailsModal
                visitId={selectedVisitId}
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
            />
        </div>
    );
};

export default DashboardHome;
