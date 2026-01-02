import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, ClipboardList, AlertTriangle, Calendar, ChevronDown, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../contexts/CompanyContext';
import { SkeletonCard } from '../components/Skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../lib/api';

const StatCard = ({ icon: Icon, label, value, color, onClick }: any) => (
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

const DashboardHome = () => {
    const navigate = useNavigate();
    const { companies, selectedCompanyId, selectCompany } = useCompany();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const { data, isLoading: loading } = useQuery({
        queryKey: ['dashboardStats', selectedCompanyId],
        queryFn: async () => {
            const result = await api.get('/dashboard/master');
            return result.data;
        },
        initialData: { stats: { collaborators: 0, visits: 0, pendencies: 0, schedules: 0 }, recentActivity: [] }
    });

    const stats = data.stats || { collaborators: 0, visits: 0, pendencies: 0, schedules: 0 };
    const recentActivity = data.recentActivity || [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between relative z-50">
                <h1 className="text-2xl font-bold text-gray-900">Painel Master</h1>
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
                            recentActivity.map((activity: any) => (
                                <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
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
        </div>
    );
};

export default DashboardHome;
