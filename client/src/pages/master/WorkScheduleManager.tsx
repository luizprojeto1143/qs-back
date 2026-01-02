import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
    Calendar, Clock, User, Plus, Trash2,
    CalendarDays, Briefcase, Save, ChevronDown
} from 'lucide-react';

interface WorkSchedule {
    id: string;
    type: string;
    workDays: string;
    startTime?: string;
    endTime?: string;
    breakStart?: string;
    breakEnd?: string;
    restDays: string;
    collaborator: {
        user: { name: string };
        area: { name: string };
    };
}

interface DayOff {
    id: string;
    date: string;
    endDate?: string;
    type: string;
    reason?: string;
    approvedBy?: { name: string };
}

const SCHEDULE_TYPES = [
    { value: '5X2', label: '5x2 (Seg-Sex)' },
    { value: '6X1', label: '6x1 (Dom folga)' },
    { value: '12X36', label: '12x36' },
    { value: '4X3', label: '4x3' },
    { value: 'PERSONALIZADO', label: 'Personalizado' },
];

const DAYOFF_TYPES = [
    { value: 'FOLGA', label: 'Folga' },
    { value: 'FERIAS', label: 'Férias' },
    { value: 'LICENCA', label: 'Licença' },
    { value: 'ATESTADO', label: 'Atestado' },
    { value: 'FERIADO', label: 'Feriado' },
    { value: 'COMPENSACAO', label: 'Compensação' },
];

const WorkScheduleManager: React.FC = () => {
    const { selectedCompanyId } = useCompany();
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
    const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
    const [daysOff, setDaysOff] = useState<DayOff[]>([]);
    const [activeTab, setActiveTab] = useState<'schedules' | 'daysoff'>('schedules');

    // Form states
    const [showDayOffForm, setShowDayOffForm] = useState(false);
    const [newDayOff, setNewDayOff] = useState({
        collaboratorId: '',
        date: '',
        endDate: '',
        type: 'FOLGA',
        reason: '',
    });

    useEffect(() => {
        if (selectedCompanyId) {
            loadSchedules();
        }
    }, [selectedCompanyId]);

    const loadSchedules = async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const res = await api.get(`/work-schedules/company/${selectedCompanyId}`);
            setSchedules(res.data);
        } catch (error: any) {
            console.error('Error loading schedules:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadDaysOff = async (collaboratorId: string) => {
        try {
            const res = await api.get(`/days-off/collaborator/${collaboratorId}`);
            setDaysOff(res.data);
        } catch (error) {
            console.error('Error loading days off:', error);
        }
    };

    const handleSelectSchedule = (schedule: WorkSchedule) => {
        setSelectedSchedule(schedule);
        // Extract collaborator ID from the schedule object - we'll need to get it from the relation
        // For now, just show the schedule details
        setActiveTab('schedules');
    };

    const handleCreateDayOff = async () => {
        if (!newDayOff.collaboratorId || !newDayOff.date) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }
        try {
            await api.post('/days-off', newDayOff);
            toast.success('Folga registrada com sucesso!');
            setShowDayOffForm(false);
            setNewDayOff({ collaboratorId: '', date: '', endDate: '', type: 'FOLGA', reason: '' });
            if (selectedSchedule) {
                // Reload days off for current collaborator
            }
        } catch (error) {
            toast.error('Erro ao registrar folga');
        }
    };

    const handleDeleteDayOff = async (id: string) => {
        try {
            await api.delete(`/days-off/${id}`);
            toast.success('Folga removida!');
            setDaysOff(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            toast.error('Erro ao remover folga');
        }
    };

    const parseWorkDays = (json: string) => {
        try {
            const days = JSON.parse(json);
            const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            return days.map((d: number) => dayNames[d]).join(', ');
        } catch {
            return json;
        }
    };

    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-64 bg-gray-200 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl text-white">
                        <CalendarDays className="w-6 h-6" />
                    </div>
                    Escalas de Trabalho
                </h1>
                <p className="text-gray-500 mt-1">Gerencie escalas e folgas dos colaboradores</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                        <User className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
                        <p className="text-sm text-gray-500">Escalas Cadastradas</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-blue-600">
                            {schedules.filter(s => s.type === '5X2').length}
                        </p>
                        <p className="text-sm text-gray-500">Escala 5x2</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <Clock className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-purple-600">
                            {schedules.filter(s => s.type === '12X36').length}
                        </p>
                        <p className="text-sm text-gray-500">Escala 12x36</p>
                    </div>
                </div>
            </div>

            {/* Lista de Escalas */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Colaboradores e Escalas
                    </h2>
                </div>

                {schedules.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarDays className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma escala cadastrada</h3>
                        <p className="text-gray-500 mt-1">As escalas são cadastradas no perfil do colaborador</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Colaborador</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Área</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tipo de Escala</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Horário</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Dias de Trabalho</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.map((schedule) => (
                                    <tr
                                        key={schedule.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleSelectSchedule(schedule)}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-green-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">
                                                    {schedule.collaborator?.user?.name || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600">
                                            {schedule.collaborator?.area?.name || 'N/A'}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                {schedule.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600">
                                            {schedule.startTime && schedule.endTime
                                                ? `${schedule.startTime} - ${schedule.endTime}`
                                                : 'Não definido'
                                            }
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 text-sm">
                                            {parseWorkDays(schedule.workDays)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Formulário de Nova Folga */}
            {showDayOffForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Registrar Folga</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                <input
                                    type="date"
                                    value={newDayOff.date}
                                    onChange={(e) => setNewDayOff(prev => ({ ...prev, date: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data Final (opcional)</label>
                                <input
                                    type="date"
                                    value={newDayOff.endDate}
                                    onChange={(e) => setNewDayOff(prev => ({ ...prev, endDate: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                    value={newDayOff.type}
                                    onChange={(e) => setNewDayOff(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                >
                                    {DAYOFF_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                                <textarea
                                    value={newDayOff.reason}
                                    onChange={(e) => setNewDayOff(prev => ({ ...prev, reason: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none h-20"
                                    placeholder="Descreva o motivo..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowDayOffForm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateDayOff}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <Save className="w-4 h-4" />
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkScheduleManager;
