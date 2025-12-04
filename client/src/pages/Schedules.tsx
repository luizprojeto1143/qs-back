import { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

const Schedules = () => {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedules = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/schedules`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    setSchedules(data);
                }
            } catch (error) {
                console.error('Error fetching schedules', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedules();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
            </div>

            {loading ? (
                <div className="text-center py-10">Carregando agendamentos...</div>
            ) : schedules.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhum agendamento</h3>
                    <p className="text-gray-500">Não há agendamentos registrados no momento.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {schedules.map((schedule) => (
                        <div key={schedule.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{schedule.reason || 'Agendamento'}</h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {new Date(schedule.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {schedule.time}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${schedule.status === 'CONFIRMADO' ? 'bg-green-100 text-green-700' :
                                schedule.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                {schedule.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Schedules;
