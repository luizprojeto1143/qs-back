import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';

// Mock data since we don't have a specific backend table yet
const MOCK_SHIFTS = ['MANHÃ (08:00 - 12:00)', 'TARDE (13:00 - 17:00)', 'NOITE (18:00 - 22:00)', 'ESCALA 12x36'];

const ShiftsList = () => {
    const [shifts, setShifts] = useState<string[]>([]);
    const [newShift, setNewShift] = useState('');

    useEffect(() => {
        // Simulate fetching
        const saved = localStorage.getItem('shifts');
        setShifts(saved ? JSON.parse(saved) : MOCK_SHIFTS);
    }, []);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newShift.trim()) return;
        const updated = [...shifts, newShift.toUpperCase()];
        setShifts(updated);
        localStorage.setItem('shifts', JSON.stringify(updated));
        setNewShift('');
    };

    const handleDelete = (shift: string) => {
        if (!confirm(`Remover turno "${shift}"?`)) return;
        const updated = shifts.filter(s => s !== shift);
        setShifts(updated);
        localStorage.setItem('shifts', JSON.stringify(updated));
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
                    <div className="space-y-2">
                        {shifts.map((shift) => (
                            <div key={shift} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium text-gray-700">{shift}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(shift)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftsList;
