import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
    Calendar, Clock, User, Plus, Trash2,
    CalendarDays, Briefcase, Save, ChevronDown, Check
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
        id: string; // Profile ID
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

interface Collaborator {
    id: string; // User ID
    name: string;
    collaboratorProfile: {
        id: string;
        area: { name: string };
    }
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
    const [showScheduleForm, setShowScheduleForm] = useState(false);

    // New Day Off
    const [newDayOff, setNewDayOff] = useState({
        collaboratorId: '', // Should be Profile ID
        date: '',
        endDate: '',
        type: 'FOLGA',
        reason: '',
    });

    // New/Edit Schedule
    const [availableCollaborators, setAvailableCollaborators] = useState<Collaborator[]>([]);
    const [scheduleForm, setScheduleForm] = useState({
        collaboratorId: '', // Profile ID
        type: '5X2',
        workDays: [1, 2, 3, 4, 5],
        startTime: '08:00',
        endTime: '17:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        restDays: [0, 6],
        notes: ''
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

    const loadCollaborators = async () => {
        try {
            const res = await api.get('/collaborators');
            setAvailableCollaborators(res.data.data);
        } catch (error) {
            console.error('Error loading collaborators:', error);
            toast.error('Erro ao carregar colaboradores');
        }
    };

    const handleOpenScheduleForm = () => {
        loadCollaborators();
        setShowScheduleForm(true);
    };

    const handleCreateSchedule = async () => {
        if (!scheduleForm.collaboratorId) {
            toast.error('Selecione um colaborador');
            return;
        }

        try {
            await api.put(`/work-schedule/${scheduleForm.collaboratorId}`, scheduleForm);
            toast.success('Escala salva com sucesso!');
            setShowScheduleForm(false);
            loadSchedules();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao salvar escala');
        }
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
        } catch (error) {
            toast.error('Erro ao registrar folga');
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

    const handleSelectCollaborator = (profileId: string) => {
        setScheduleForm(prev => ({ ...prev, collaboratorId: profileId }));
    };

    return (
        <div className="p-8 space-y-8 animate-fade-in text-gray-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl text-white">
                            <CalendarDays className="w-6 h-6" />
                        </div>
                        Escalas de Trabalho
                    </h1>
                    <p className="text-gray-500 mt-1">Gerencie escalas e folgas dos colaboradores</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowDayOffForm(true)}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Calendar className="w-4 h-4" />
                        Registrar Ausência
                    </button>
                    <button
                        onClick={handleOpenScheduleForm}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nova Escala
                    </button>
                </div>
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
                        <p className="text-gray-500 mt-1">Utilize o botão "Nova Escala" para começar</p>
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

            {/* Modal Nova Escala */}
            {showScheduleForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Nova Escala de Trabalho</h2>
                            <button onClick={() => setShowScheduleForm(false)} className="text-gray-400 hover:text-gray-600">
                                <Trash2 className="w-5 h-5 opacity-0" /> {/* Spacer */}
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Seleção de Colaborador */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Colaborador</label>
                                <select
                                    className="input-field w-full"
                                    value={scheduleForm.collaboratorId}
                                    onChange={(e) => handleSelectCollaborator(e.target.value)}
                                >
                                    <option value="">Selecione um colaborador...</option>
                                    {availableCollaborators.map(c => (
                                        <option key={c.id} value={c.collaboratorProfile?.id}>
                                            {c.name} - {c.collaboratorProfile?.area?.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Escala</label>
                                    <select
                                        className="input-field w-full"
                                        value={scheduleForm.type}
                                        onChange={(e) => setScheduleForm(prev => ({ ...prev, type: e.target.value }))}
                                    >
                                        {SCHEDULE_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Entrada</label>
                                        <input
                                            type="time"
                                            className="input-field w-full"
                                            value={scheduleForm.startTime}
                                            onChange={(e) => setScheduleForm(prev => ({ ...prev, startTime: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Saída</label>
                                        <input
                                            type="time"
                                            className="input-field w-full"
                                            value={scheduleForm.endTime}
                                            onChange={(e) => setScheduleForm(prev => ({ ...prev, endTime: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dias de Trabalho - Checkboxes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dias de Trabalho</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, idx) => {
                                        const isSelected = scheduleForm.workDays.includes(idx);
                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setScheduleForm(prev => {
                                                        const newDays = isSelected
                                                            ? prev.workDays.filter(d => d !== idx)
                                                            : [...prev.workDays, idx];
                                                        return { ...prev, workDays: newDays.sort() };
                                                    });
                                                }}
                                                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${isSelected
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setShowScheduleForm(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateSchedule}
                                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <Save className="w-4 h-4" />
                                    Salvar Escala
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulário de Nova Folga */}
            {showDayOffForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Registrar Ausência/Folga</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
                                <select
                                    className="input-field w-full"
                                    value={newDayOff.collaboratorId}
                                    onChange={(e) => setNewDayOff(prev => ({ ...prev, collaboratorId: e.target.value }))}
                                    onClick={() => availableCollaborators.length === 0 && loadCollaborators()}
                                >
                                    <option value="">Selecione...</option>
                                    {availableCollaborators.map(c => (
                                        <option key={c.id} value={c.collaboratorProfile?.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

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
