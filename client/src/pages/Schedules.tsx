import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Clock, Plus, X, User, Check, Clipboard, List } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format } from 'date-fns';
import { parse } from 'date-fns';
import { startOfWeek } from 'date-fns';
import { getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useCompany } from '../contexts/CompanyContext';
import { api } from '../lib/api';

const locales = {
    'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const Schedules = () => {
    const navigate = useNavigate();
    const { selectedCompanyId } = useCompany();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
        queryKey: ['schedules', selectedCompanyId],
        queryFn: async () => {
            const response = await api.get('/schedules');
            return response.data;
        },
        initialData: []
    });

    const { data: collaborators = [] } = useQuery({
        queryKey: ['collaborators', selectedCompanyId],
        queryFn: async () => {
            const response = await api.get('/collaborators');
            return response.data;
        },
        initialData: []
    });

    const loading = loadingSchedules;

    const [newSchedule, setNewSchedule] = useState({
        date: '',
        time: '',
        reason: '',
        collaboratorId: ''
    });

    // Filter data based on selectedCompanyId
    const filteredCollaborators = collaborators.filter((c: any) => !selectedCompanyId || c.companyId === selectedCompanyId);

    const filteredSchedules = schedules.filter((s: any) => {
        if (!selectedCompanyId) return true;
        if (s.collaborator && typeof s.collaborator === 'object' && s.collaborator.companyId) {
            return s.collaborator.companyId === selectedCompanyId;
        }
        if (s.collaboratorId) {
            return filteredCollaborators.find((c: any) => c.id === s.collaboratorId);
        }
        return true;
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const response = await api.put(`/schedules/${id}`, { status });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            toast.success('Status atualizado com sucesso!');
        },
        onError: () => {
            toast.error('Erro ao atualizar status.');
        }
    });

    const createScheduleMutation = useMutation({
        mutationFn: async (newSchedule: any) => {
            const response = await api.post('/schedules', newSchedule);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schedules'] });
            setIsModalOpen(false);
            setNewSchedule({ date: '', time: '', reason: '', collaboratorId: '' });
            toast.success('Agendamento criado com sucesso!');
        },
        onError: () => {
            toast.error('Erro ao criar agendamento.');
        }
    });

    const handleStatusUpdate = (id: string, status: string) => {
        updateStatusMutation.mutate({ id, status });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createScheduleMutation.mutate(newSchedule);
    };

    const calendarEvents = filteredSchedules.map((s: any) => ({
        id: s.id,
        title: `${s.reason} - ${s.collaborator || 'Sem colaborador'}`,
        start: new Date(`${s.date.split('T')[0]}T${s.time}`),
        end: new Date(new Date(`${s.date.split('T')[0]}T${s.time}`).getTime() + 60 * 60 * 1000), // Assumes 1h duration
        resource: s
    }));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
                <div className="flex space-x-2">
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Novo Agendamento</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Carregando agendamentos...</div>
            ) : viewMode === 'calendar' ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[600px]">
                    <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        culture='pt-BR'
                        messages={{
                            next: "Próximo",
                            previous: "Anterior",
                            today: "Hoje",
                            month: "Mês",
                            week: "Semana",
                            day: "Dia",
                            agenda: "Agenda",
                            date: "Data",
                            time: "Hora",
                            event: "Evento",
                            noEventsInRange: "Sem eventos neste período."
                        }}
                        onSelectEvent={(event: any) => {
                            toast.info(`Agendamento: ${event.title}`);
                        }}
                    />
                </div>
            ) : filteredSchedules.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                    <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhum agendamento</h3>
                    <p className="text-gray-500">Não há agendamentos registrados no momento.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredSchedules.map((schedule: any) => (
                        <div key={schedule.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <CalendarIcon className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">{schedule.reason || 'Agendamento'}</h3>
                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                        <span className="flex items-center">
                                            <CalendarIcon className="h-3 w-3 mr-1" />
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
                                            type="button"
                                            onClick={() => navigate('/dashboard/visits', {
                                                state: {
                                                    scheduleId: schedule.id,
                                                    companyId: selectedCompanyId,
                                                    areaName: schedule.area,
                                                    collaboratorName: schedule.collaborator,
                                                    date: schedule.date
                                                }
                                            })}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Registrar Visita"
                                        >
                                            <Clipboard className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleStatusUpdate(schedule.id, 'APROVADO')}
                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                            title="Aprovar"
                                        >
                                            <Check className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
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
                                        schedule.status === 'REALIZADO' ? 'bg-blue-100 text-blue-700' :
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
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                                    {filteredCollaborators.map((c: any) => <option key={c.id} value={c.collaboratorProfile?.id}>{c.name}</option>)}
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
