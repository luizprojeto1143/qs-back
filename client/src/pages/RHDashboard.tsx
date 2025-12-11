import { useState, useEffect } from 'react';
import { Users, ClipboardList, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
            <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{label}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
    </div>
);

const RHDashboard = () => {
    const [stats, setStats] = useState({
        totalCollaborators: 0,
        visitsThisMonth: 0,
        openPendencies: 0,
        resolutionRate: '0%',
        completedCourses: 0,
        pcdPercentage: '0%'
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [sectorEngagement, setSectorEngagement] = useState<any[]>([]);
    const [mostWatchedCourses, setMostWatchedCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/dashboard/rh');
                const data = response.data;
                if (data.stats) setStats(data.stats);
                if (data.recentActivity) setRecentActivity(data.recentActivity);
                if (data.sectorEngagement) setSectorEngagement(data.sectorEngagement);
                if (data.mostWatchedCourses) setMostWatchedCourses(data.mostWatchedCourses);
            } catch (error) {
                console.error('Error fetching dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center">Carregando dados...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Visão Geral - RH</h1>
                    <p className="text-gray-500">Acompanhamento de inclusão e diversidade</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={Users}
                    label="Total de Colaboradores"
                    value={stats.totalCollaborators}
                    color="bg-blue-600"
                />
                <StatCard
                    icon={ClipboardList}
                    label="Visitas este Mês"
                    value={stats.visitsThisMonth}
                    color="bg-purple-600"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Pendências em Aberto"
                    value={stats.openPendencies}
                    color="bg-orange-500"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Taxa de Resolução"
                    value={stats.resolutionRate}
                    color="bg-green-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={CheckCircle}
                    label="Cursos Concluídos"
                    value={stats.completedCourses}
                    color="bg-green-600"
                />
                <StatCard
                    icon={Users}
                    label="% PCDs"
                    value={stats.pcdPercentage}
                    color="bg-indigo-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Últimas Atualizações</h3>
                    <div className="space-y-4">
                        {recentActivity.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhuma atividade recente.</p>
                        ) : (
                            recentActivity.map((item) => (
                                <div key={item.id} className="flex items-start space-x-3 pb-4 border-b border-gray-50 last:border-0">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                                    <div>
                                        <p className="text-sm text-gray-900 font-medium">{item.description}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(item.time).toLocaleDateString()} • Por {item.author}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Sector Engagement */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Engajamento por Setor</h3>
                    <div className="space-y-4">
                        {sectorEngagement.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhum dado disponível.</p>
                        ) : (
                            sectorEngagement.map((sector: any, index: number) => (
                                <div key={index} className="flex items-center justify-between pb-2 border-b border-gray-50 last:border-0">
                                    <span className="text-sm font-medium text-gray-700">{sector.name}</span>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-blue-600">{sector.enrollments}</p>
                                        <p className="text-xs text-gray-400">matrículas</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Most Watched Courses */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Cursos Mais Assistidos</h3>
                    <div className="space-y-4">
                        {mostWatchedCourses.length === 0 ? (
                            <p className="text-gray-500 text-sm">Nenhum curso assistido ainda.</p>
                        ) : (
                            mostWatchedCourses.map((course: any) => (
                                <div key={course.id} className="flex items-center justify-between pb-2 border-b border-gray-50 last:border-0">
                                    <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]" title={course.title}>{course.title}</span>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-purple-600">{course.views}</p>
                                        <p className="text-xs text-gray-400">alunos</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RHDashboard;
