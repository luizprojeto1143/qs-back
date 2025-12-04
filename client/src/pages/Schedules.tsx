import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, X, User, Check } from 'lucide-react';

const Schedules = () => {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [newSchedule, setNewSchedule] = useState({
        date: '',
        time: '',
        reason: '',
        collaboratorId: ''
    });

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [resSchedules, resCollabs] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/schedules`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collaborators`, { headers })
            ]);

            setSchedules(await resSchedules.json());
            setCollaborators(await resCollabs.json());
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStatusUpdate = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/schedules/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error('Error updating status', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/schedules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newSchedule)
            });

            if (response.ok) {
                setIsModalOpen(false);
                setNewSchedule({ date: '', time: '', reason: '', collaboratorId: '' });
                fetchData();
                alert('Agendamento criado com sucesso!');
            } else {
                alert('Erro ao criar agendamento.');
            }
        } catch (error) {
            console.error('Error creating schedule', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Novo Agendamento</span>
                </button>
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
                                        {schedule.collaborator && (
                                            <span className="flex items-center text-primary">
                                                <User className="h-3 w-3 mr-1" />
                                                {schedule.collaborator}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                {schedule.status === 'PENDENTE' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusUpdate(schedule.id, 'APROVADO')}
                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                            title="Aprovar"
                                        >
                                            <Check className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleStatusUpdate(schedule.id, 'RECUSADO')}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            title="Recusar"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </>
                                )}
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${schedule.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                                    schedule.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {schedule.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Novo Agendamento</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={newSchedule.reason}
                                    onChange={e => setNewSchedule({ ...newSchedule, reason: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field"
                                        value={newSchedule.date}
                                        onChange={e => setNewSchedule({ ...newSchedule, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                                    <input
                                        type="time"
                                        required
                                        className="input-field"
                                        value={newSchedule.time}
                                        onChange={e => setNewSchedule({ ...newSchedule, time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador (Opcional)</label>
                                <select
                                    className="input-field"
                                    value={newSchedule.collaboratorId}
                                    onChange={e => setNewSchedule({ ...newSchedule, collaboratorId: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {collaborators.map(c => <option key={c.id} value={c.collaboratorProfile?.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Salvar Agendamento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedules;
