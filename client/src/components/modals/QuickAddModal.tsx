import { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface QuickAddModalProps {
    type: 'area' | 'collaborator';
    companyId: string;
    areaId?: string; // Pre-selected area for collaborator
    onSuccess: (newItem: any) => void;
    onClose: () => void;
}

export const QuickAddModal = ({ type, companyId, areaId, onSuccess, onClose }: QuickAddModalProps) => {
    const [loading, setLoading] = useState(false);
    const [areas, setAreas] = useState<any[]>([]);
    const [sectors, setSectors] = useState<any[]>([]);
    const [shifts, setShifts] = useState<any[]>([]);

    // Area Form
    const [areaName, setAreaName] = useState('');
    const [sectorId, setSectorId] = useState('');

    // Collaborator Form
    const [collabData, setCollabData] = useState({
        name: '',
        email: '',
        password: '',
        matricula: '',
        areaId: areaId || '',
        shift: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (type === 'area') {
                    const res = await api.get('/sectors');
                    setSectors(res.data.filter((s: any) => s.companyId === companyId));
                } else {
                    const [resAreas, resShifts] = await Promise.all([
                        api.get('/areas'),
                        api.get('/settings/shifts')
                    ]);
                    setAreas(resAreas.data.filter((a: any) => a.sector?.companyId === companyId));
                    setShifts(resShifts.data);
                }
            } catch (error) {
                console.error('Error fetching data for quick add', error);
            }
        };
        fetchData();
    }, [type, companyId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (type === 'area') {
                const res = await api.post('/areas', { name: areaName, sectorId });
                toast.success('Área criada com sucesso!');
                onSuccess(res.data);
            } else {
                const res = await api.post('/collaborators', {
                    ...collabData,
                    companyId
                });
                toast.success('Colaborador criado com sucesso!');
                onSuccess(res.data);
            }
            onClose();
        } catch (error: any) {
            console.error('Error creating', error);
            toast.error(error.response?.data?.error || 'Erro ao criar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[300] p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900">
                        {type === 'area' ? 'Nova Área' : 'Novo Colaborador'}
                    </h2>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {type === 'area' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Área</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={areaName}
                                    onChange={e => setAreaName(e.target.value)}
                                    placeholder="Ex: Produção, Administrativo..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                                <select
                                    required
                                    className="input-field"
                                    value={sectorId}
                                    onChange={e => setSectorId(e.target.value)}
                                >
                                    <option value="">Selecione o setor...</option>
                                    {sectors.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={collabData.name}
                                    onChange={e => setCollabData({ ...collabData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={collabData.matricula}
                                        onChange={e => setCollabData({ ...collabData, matricula: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={collabData.shift}
                                        onChange={e => setCollabData({ ...collabData, shift: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {shifts.map(s => (
                                            <option key={s.id} value={s.name}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                                <select
                                    required
                                    className="input-field"
                                    value={collabData.areaId}
                                    onChange={e => setCollabData({ ...collabData, areaId: e.target.value })}
                                >
                                    <option value="">Selecione a área...</option>
                                    {areas.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="input-field"
                                    value={collabData.email}
                                    onChange={e => setCollabData({ ...collabData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                                <input
                                    type="password"
                                    required
                                    className="input-field"
                                    value={collabData.password}
                                    onChange={e => setCollabData({ ...collabData, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center space-x-2"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            <span>Criar</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
