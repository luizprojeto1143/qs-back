import { useState, useEffect } from 'react';
import { Users, ClipboardList, AlertTriangle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
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
    const [stats, setStats] = useState({
        collaborators: 0,
        visits: 0,
        pendencies: 0,
        schedules: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/dashboard/master`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.stats) setStats(data.stats);
            } catch (error) {
                console.error('Error fetching master dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Painel Master</h1>
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700">
                Selecionar Empresa
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={Users} label="Colaboradores" value={loading ? '...' : stats.collaborators} color="bg-blue-500" />
            <StatCard icon={ClipboardList} label="Acompanhamentos" value={loading ? '...' : stats.visits} color="bg-green-500" />
            <StatCard icon={AlertTriangle} label="Pendências" value={loading ? '...' : stats.pendencies} color="bg-orange-500" />
            <StatCard icon={Calendar} label="Agendamentos" value={loading ? '...' : stats.schedules} color="bg-purple-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity or Charts could go here */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Atalhos Rápidos</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/dashboard/visits')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-blue-50 transition-all text-left"
                    >
                        <span className="font-medium text-gray-900 block">Novo Acompanhamento</span>
                        <span className="text-sm text-gray-500">Registrar visita</span>
                    </button>
                    <button
                        onClick={() => navigate('/dashboard/pendencies')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-blue-50 transition-all text-left"
                    >
                        <span className="font-medium text-gray-900 block">Nova Pendência</span>
                        <span className="text-sm text-gray-500">Criar tarefa</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
    );
};

export default DashboardHome;
