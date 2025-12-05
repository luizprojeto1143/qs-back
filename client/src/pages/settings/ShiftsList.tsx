import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { toast } from 'sonner';

const ShiftsList = () => {
    const { selectedCompanyId } = useCompany();
    const [shifts, setShifts] = useState<any[]>([]);
    const [newShift, setNewShift] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchShifts = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers: any = { 'Authorization': `Bearer ${token}` };
            if (selectedCompanyId) headers['x-company-id'] = selectedCompanyId;

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/settings/shifts`, {
                headers
            });
            const data = await response.json();
            setShifts(data);
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
            const token = localStorage.getItem('token');
            const headers: any = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            if (selectedCompanyId) headers['x-company-id'] = selectedCompanyId;

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/settings/shifts`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name: newShift })
            });

            if (response.ok) {
                setNewShift('');
                fetchShifts();
                toast.success('Turno adicionado com sucesso!');
            } else {
                toast.error('Erro ao adicionar turno');
            }
        } catch (error) {
            console.error('Error adding shift', error);
            toast.error('Erro ao adicionar turno');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remover este turno?')) return;

        try {
            const token = localStorage.getItem('token');
            const headers: any = { 'Authorization': `Bearer ${token}` };
            if (selectedCompanyId) headers['x-company-id'] = selectedCompanyId;

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/settings/shifts/${id}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                fetchShifts();
                toast.success('Turno removido com sucesso!');
            } else {
                toast.error('Erro ao remover turno');
            }
        } catch (error) {
            console.error('Error deleting shift', error);
            toast.error('Erro ao remover turno');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cadastro de Turnos</h1>
                    <p className="text-gray-500">Gerencie os turnos de trabalho disponíveis</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-lg font-bold mb-4">Novo Turno</h3>
                    <form onSubmit={handleAdd} className="flex space-x-2">
                        <input
                            type="text"
                            className="input-field flex-1"
                            placeholder="Ex: MADRUGADA (00:00 - 06:00)"
                            value={newShift}
                            onChange={(e) => setNewShift(e.target.value)}
                        />
                        <button type="submit" className="btn-primary flex items-center justify-center px-4">
                            <Plus className="h-5 w-5" />
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4">Turnos Ativos</h3>
                    {loading ? (
                        <div className="text-center py-4">Carregando...</div>
                    ) : (
                        <div className="space-y-2">
                            {shifts.map((shift) => (
                                <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-700">{shift.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(shift.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {shifts.length === 0 && (
                                <p className="text-center text-gray-500 py-4">Nenhum turno cadastrado.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShiftsList;
