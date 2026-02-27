import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import {
    Calendar, User, Trash2,
    CalendarDays, Save
} from 'lucide-react';

interface DayOff {
    id: string;
    date: string;
    endDate?: string;
    type: string;
    reason?: string;
    approvedBy?: { name: string };
    collaborator?: {
        user: { name: string };
        area: { name: string };
    };
}

interface Collaborator {
    id: string;
    name: string;
    collaboratorProfile: {
        id: string;
        area: { name: string };
    }
}

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
    const [daysOff, setDaysOff] = useState<DayOff[]>([]);

    // Form states
    const [showDayOffForm, setShowDayOffForm] = useState(false);
    const [availableCollaborators, setAvailableCollaborators] = useState<Collaborator[]>([]);

    // New Day Off
    const [newDayOff, setNewDayOff] = useState({
        collaboratorId: '',
        date: '',
        endDate: '',
        type: 'FOLGA',
        reason: '',
    });

    useEffect(() => {
        if (selectedCompanyId) {
            loadDaysOff();
        }
    }, [selectedCompanyId]);

    const loadDaysOff = async () => {
        if (!selectedCompanyId) return;
        setLoading(true);
        try {
            const res = await api.get(`/days-off`);
            setDaysOff(res.data);
        } catch (error) {
            console.error('Error loading days off:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCollaborators = async () => {
        try {
            const res = await api.get('/collaborators');
            setAvailableCollaborators(res.data.data || res.data);
        } catch (error) {
            console.error('Error loading collaborators:', error);
            toast.error('Erro ao carregar colaboradores');
        }
    };

    const handleCreateDayOff = async () => {
        if (!newDayOff.collaboratorId || !newDayOff.date) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }
        try {
            await api.post('/days-off', newDayOff);
            toast.success('Ausência registrada com sucesso!');
            setShowDayOffForm(false);
            setNewDayOff({ collaboratorId: '', date: '', endDate: '', type: 'FOLGA', reason: '' });
            loadDaysOff();
        } catch (error) {
            toast.error('Erro ao registrar ausência');
        }
    };

    const handleDeleteDayOff = async (id: string) => {
        if (!confirm('Remover esta ausência?')) return;
        try {
            await api.delete(`/days-off/${id}`);
            toast.success('Ausência removida!');
            loadDaysOff();
        } catch (error) {
            toast.error('Erro ao remover ausência');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
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
                        Registro de Ausências
                    </h1>
                    <p className="text-gray-500 mt-1">Gerencie folgas, férias e ausências dos colaboradores</p>
                </div>
                <button
                    onClick={() => { setShowDayOffForm(true); loadCollaborators(); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Calendar className="w-4 h-4" />
                    Registrar Ausência
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                        <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{daysOff.length}</p>
                        <p className="text-sm text-gray-500">Ausências Registradas</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 rounded-xl">
                        <User className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-yellow-600">
                            {daysOff.filter(d => d.type === 'FERIAS').length}
                        </p>
                        <p className="text-sm text-gray-500">Férias</p>
                    </div>
                </div>
                <div className="card flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-xl">
                        <Calendar className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-red-600">
                            {daysOff.filter(d => d.type === 'ATESTADO').length}
                        </p>
                        <p className="text-sm text-gray-500">Atestados</p>
                    </div>
                </div>
            </div>

            {/* Lista de Ausências */}
            <div className="card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-600" />
                        Ausências Registradas
                    </h2>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : daysOff.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CalendarDays className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma ausência registrada</h3>
                        <p className="text-gray-500 mt-1">Utilize o botão "Registrar Ausência" para começar</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Colaborador</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Data</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tipo</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Motivo</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {daysOff.map((dayOff) => (
                                    <tr
                                        key={dayOff.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                    <User className="w-5 h-5 text-green-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">
                                                    {dayOff.collaborator?.user?.name || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600">
                                            {formatDate(dayOff.date)}
                                            {dayOff.endDate && ` - ${formatDate(dayOff.endDate)}`}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${dayOff.type === 'FERIAS' ? 'bg-yellow-100 text-yellow-700' :
                                                dayOff.type === 'ATESTADO' ? 'bg-red-100 text-red-700' :
                                                    dayOff.type === 'FOLGA' ? 'bg-green-100 text-green-700' :
                                                        'bg-blue-100 text-blue-700'
                                                }`}>
                                                {DAYOFF_TYPES.find(t => t.value === dayOff.type)?.label || dayOff.type}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 text-sm">
                                            {dayOff.reason || '-'}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <button
                                                onClick={() => handleDeleteDayOff(dayOff.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Formulário de Nova Ausência */}
            {showDayOffForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Registrar Ausência</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Colaborador</label>
                                <select
                                    className="input-field w-full"
                                    value={newDayOff.collaboratorId}
                                    onChange={(e) => setNewDayOff(prev => ({ ...prev, collaboratorId: e.target.value }))}
                                >
                                    <option value="">Selecione...</option>
                                    {availableCollaborators.map(c => (
                                        <option key={c.id} value={c.collaboratorProfile?.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                                    <input
                                        type="date"
                                        value={newDayOff.date}
                                        onChange={(e) => setNewDayOff(prev => ({ ...prev, date: e.target.value }))}
                                        className="input-field w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim (opcional)</label>
                                    <input
                                        type="date"
                                        value={newDayOff.endDate}
                                        onChange={(e) => setNewDayOff(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="input-field w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                    value={newDayOff.type}
                                    onChange={(e) => setNewDayOff(prev => ({ ...prev, type: e.target.value }))}
                                    className="input-field w-full"
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
                                    className="input-field w-full resize-none h-20"
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
