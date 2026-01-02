import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Save, Edit2, X } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface Shift {
    id: string;
    name: string;
    type: string;
    startTime?: string;
    endTime?: string;
    breakStart?: string;
    breakEnd?: string;
    workDays?: string;
    restDays?: string;
}

const SHIFT_TYPES = [
    { value: '5X2', label: '5x2 (Seg-Sex)', workDays: [1, 2, 3, 4, 5], restDays: [0, 6] },
    { value: '6X1', label: '6x1 (Domingo folga)', workDays: [1, 2, 3, 4, 5, 6], restDays: [0] },
    { value: '12X36', label: '12x36', workDays: [], restDays: [] },
    { value: '4X3', label: '4x3', workDays: [1, 2, 3, 4], restDays: [0, 5, 6] },
    { value: 'PERSONALIZADO', label: 'Personalizado', workDays: [], restDays: [] },
];

const DAYS_OF_WEEK = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
];

const ShiftsList = () => {
    const { selectedCompanyId } = useCompany();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '',
        type: '5X2',
        startTime: '08:00',
        endTime: '17:00',
        breakStart: '12:00',
        breakEnd: '13:00',
        workDays: [1, 2, 3, 4, 5],
        restDays: [0, 6],
    });

    const fetchShifts = async () => {
        try {
            const response = await api.get('/settings/shifts');
            setShifts(response.data);
        } catch (error) {
            console.error('Error fetching shifts', error);
            toast.error('Erro ao carregar escalas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCompanyId) {
            fetchShifts();
        }
    }, [selectedCompanyId]);

    const handleTypeChange = (type: string) => {
        const preset = SHIFT_TYPES.find(t => t.value === type);
        if (preset && preset.workDays.length > 0) {
            setForm(prev => ({
                ...prev,
                type,
                workDays: preset.workDays,
                restDays: preset.restDays,
            }));
        } else {
            setForm(prev => ({ ...prev, type }));
        }
    };

    const toggleWorkDay = (day: number) => {
        setForm(prev => {
            const workDays = prev.workDays.includes(day)
                ? prev.workDays.filter(d => d !== day)
                : [...prev.workDays, day];
            const restDays = DAYS_OF_WEEK
                .map(d => d.value)
                .filter(d => !workDays.includes(d));
            return { ...prev, workDays, restDays };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Preencha o nome da escala');
            return;
        }

        try {
            const payload = {
                ...form,
                workDays: JSON.stringify(form.workDays),
                restDays: JSON.stringify(form.restDays),
            };

            if (editingId) {
                await api.put(`/settings/shifts/${editingId}`, payload);
                toast.success('Escala atualizada!');
            } else {
                await api.post('/settings/shifts', payload);
                toast.success('Escala criada!');
            }

            setForm({
                name: '',
                type: '5X2',
                startTime: '08:00',
                endTime: '17:00',
                breakStart: '12:00',
                breakEnd: '13:00',
                workDays: [1, 2, 3, 4, 5],
                restDays: [0, 6],
            });
            setShowForm(false);
            setEditingId(null);
            fetchShifts();
        } catch (error) {
            console.error('Error saving shift', error);
            toast.error('Erro ao salvar escala');
        }
    };

    const handleEdit = (shift: Shift) => {
        setForm({
            name: shift.name,
            type: shift.type || '5X2',
            startTime: shift.startTime || '08:00',
            endTime: shift.endTime || '17:00',
            breakStart: shift.breakStart || '12:00',
            breakEnd: shift.breakEnd || '13:00',
            workDays: shift.workDays ? JSON.parse(shift.workDays) : [1, 2, 3, 4, 5],
            restDays: shift.restDays ? JSON.parse(shift.restDays) : [0, 6],
        });
        setEditingId(shift.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remover esta escala?')) return;

        try {
            await api.delete(`/settings/shifts/${id}`);
            fetchShifts();
            toast.success('Escala removida!');
        } catch (error) {
            console.error('Error deleting shift', error);
            toast.error('Erro ao remover escala');
        }
    };

    const parseWorkDays = (json?: string) => {
        try {
            if (!json) return '-';
            const days = JSON.parse(json);
            return days.map((d: number) => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ');
        } catch {
            return '-';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastro de Escalas</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie os tipos de escala disponíveis para os colaboradores</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Nova Escala
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Editar Escala' : 'Nova Escala'}
                            </h2>
                            <button onClick={() => { setShowForm(false); setEditingId(null); }}>
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nome da Escala
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="input-field w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ex: Comercial Manhã"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Tipo de Escala
                                </label>
                                <select
                                    value={form.type}
                                    onChange={(e) => handleTypeChange(e.target.value)}
                                    className="input-field w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    {SHIFT_TYPES.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Entrada
                                    </label>
                                    <input
                                        type="time"
                                        value={form.startTime}
                                        onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                                        className="input-field w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Saída
                                    </label>
                                    <input
                                        type="time"
                                        value={form.endTime}
                                        onChange={(e) => setForm(prev => ({ ...prev, endTime: e.target.value }))}
                                        className="input-field w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Início Intervalo
                                    </label>
                                    <input
                                        type="time"
                                        value={form.breakStart}
                                        onChange={(e) => setForm(prev => ({ ...prev, breakStart: e.target.value }))}
                                        className="input-field w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Fim Intervalo
                                    </label>
                                    <input
                                        type="time"
                                        value={form.breakEnd}
                                        onChange={(e) => setForm(prev => ({ ...prev, breakEnd: e.target.value }))}
                                        className="input-field w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Dias de Trabalho
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map(day => (
                                        <button
                                            key={day.value}
                                            type="button"
                                            onClick={() => toggleWorkDay(day.value)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${form.workDays.includes(day.value)
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingId(null); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <Save className="w-4 h-4" />
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Lista */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Escalas Cadastradas</h3>
                {loading ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">Carregando...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Tipo</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Horário</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Dias</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shifts.map((shift) => (
                                    <tr key={shift.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <Clock className="h-5 w-5 text-blue-500" />
                                                <span className="font-medium text-gray-900 dark:text-white">{shift.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-sm font-medium">
                                                {shift.type || '5X2'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 dark:text-gray-300">
                                            {shift.startTime && shift.endTime
                                                ? `${shift.startTime} - ${shift.endTime}`
                                                : '-'
                                            }
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 dark:text-gray-300 text-sm">
                                            {parseWorkDays(shift.workDays)}
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(shift)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(shift.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {shifts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center text-gray-500 dark:text-gray-400 py-8">
                                            Nenhuma escala cadastrada. Clique em "Nova Escala" para começar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShiftsList;
