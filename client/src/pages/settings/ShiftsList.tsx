import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { toast } from 'sonner';
import { api } from '../../lib/api';

const ShiftsList = () => {
    const { selectedCompanyId } = useCompany();
    const [shifts, setShifts] = useState<any[]>([]);
    const [newShift, setNewShift] = useState('');
    const [loading, setLoading] = useState(true);

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

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newShift.trim()) return;

        try {
            await api.post('/settings/shifts', { name: newShift });
            setNewShift('');
            fetchShifts();
            toast.success('Turno adicionado com sucesso!');
        } catch (error) {
            console.error('Error adding shift', error);
            toast.error('Erro ao adicionar turno');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este turno?')) return;

        try {
            await api.delete(`/settings/shifts/${id}`);
            fetchShifts();
            toast.success('Turno removido com sucesso!');
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
                    <p className="text-gray-500 dark:text-gray-400">Gerencie os turnos de trabalho disponíveis</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Novo Turno</h3>
                    <form onSubmit={handleAdd} className="flex space-x-2">
                        <input
                            type="text"
                            className="input-field flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Ex: MADRUGADA (00:00 - 06:00)"
                            value={newShift}
                            onChange={(e) => setNewShift(e.target.value)}
                        />
                        <button type="submit" className="btn-primary flex items-center justify-center px-4">
                            <Plus className="h-5 w-5" />
                        </button>
                    </form>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Turnos Ativos</h3>
                    {loading ? (
                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">Carregando...</div>
                    ) : (
                        <div className="space-y-2">
                            {shifts.map((shift) => (
                                <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{shift.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(shift.id)}
                                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {shifts.length === 0 && (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-4">Nenhum turno cadastrado.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShiftsList;
