import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Save, Edit2, X } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface Shift {
    id: string;
    name: string;
    type?: string;
    startTime?: string;
    endTime?: string;
}

const ShiftsList = () => {
    const { selectedCompanyId } = useCompany();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state - simplified
    const [form, setForm] = useState({
        name: '',
        startTime: '08:00',
        endTime: '17:00',
    });

    const fetchShifts = async () => {
        try {
            const response = await api.get('/settings/shifts');
            setShifts(response.data);
        } catch (error) {
            console.error('Error fetching shifts', error);
            toast.error('Erro ao carregar turnos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCompanyId) {
            fetchShifts();
        }
    }, [selectedCompanyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error('Preencha o nome do turno');
            return;
        }

        try {
            const payload = {
                ...form,
                type: 'TURNO', // Default type
                workDays: JSON.stringify([1, 2, 3, 4, 5]),
                restDays: JSON.stringify([0, 6]),
            };

            if (editingId) {
                await api.put(`/settings/shifts/${editingId}`, payload);
                toast.success('Turno atualizado!');
            } else {
                await api.post('/settings/shifts', payload);
                toast.success('Turno criado!');
            }

            setForm({
                name: '',
                startTime: '08:00',
                endTime: '17:00',
            });
            setShowForm(false);
            setEditingId(null);
            fetchShifts();
        } catch (error) {
            console.error('Error saving shift', error);
            toast.error('Erro ao salvar turno');
        }
    };

    const handleEdit = (shift: Shift) => {
        setForm({
            name: shift.name,
            startTime: shift.startTime || '08:00',
            endTime: shift.endTime || '17:00',
        });
        setEditingId(shift.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este turno?')) return;

        try {
            await api.delete(`/settings/shifts/${id}`);
            fetchShifts();
            toast.success('Turno removido!');
        } catch (error) {
            console.error('Error deleting shift', error);
            toast.error('Erro ao remover turno');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastro de Turnos</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie os turnos disponíveis para os colaboradores</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Novo Turno
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingId ? 'Editar Turno' : 'Novo Turno'}
                            </h2>
                            <button onClick={() => { setShowForm(false); setEditingId(null); }}>
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nome do Turno
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="input-field w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ex: Manhã, Tarde, Noturno..."
                                />
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
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Turnos Cadastrados</h3>
                {loading ? (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">Carregando...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Nome</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Horário</th>
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
                                        <td className="py-4 px-4 text-gray-600 dark:text-gray-300">
                                            {shift.startTime && shift.endTime
                                                ? `${shift.startTime} - ${shift.endTime}`
                                                : '-'
                                            }
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
                                        <td colSpan={3} className="text-center text-gray-500 dark:text-gray-400 py-8">
                                            Nenhum turno cadastrado. Clique em "Novo Turno" para começar.
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
