import { useState, useEffect } from 'react';
import { X, Plus, Loader2, AlertTriangle } from 'lucide-react';
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
    const [dataLoading, setDataLoading] = useState(true);
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
    const [collabSectorId, setCollabSectorId] = useState(''); // Setor selecionado para filtrar áreas

    useEffect(() => {
        const fetchData = async () => {
            setDataLoading(true);
            try {
                if (type === 'area') {
                    const res = await api.get('/sectors');
                    setSectors(res.data.filter((s: any) => s.companyId === companyId));
                } else {
                    const [resAreas, resShifts, resSectors] = await Promise.all([
                        api.get('/areas'),
                        api.get('/settings/shifts'),
                        api.get('/sectors')
                    ]);
                    setAreas(resAreas.data.filter((a: any) => a.sector?.companyId === companyId));
                    setShifts(resShifts.data);
                    setSectors(resSectors.data.filter((s: any) => s.companyId === companyId));
                }
            } catch (error) {
                console.error('Error fetching data for quick add', error);
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, [type, companyId]);

    // Áreas filtradas pelo setor selecionado (para colaborador)
    const filteredAreas = collabSectorId
        ? areas.filter(a => a.sectorId === collabSectorId)
        : areas;

    // Validação - verificar se pode criar
    const canCreate = type === 'area'
        ? sectors.length > 0
        : areas.length > 0 && sectors.length > 0;

    const handleSubmit = async () => {
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

                {!companyId ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Empresa não selecionada</p>
                            <p className="text-xs text-red-700 mt-1">
                                Selecione uma empresa no campo acima antes de adicionar {type === 'area' ? 'uma área' : 'um colaborador'}.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {type === 'area' ? (
                            <>
                                {!dataLoading && sectors.length === 0 && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-yellow-800">Nenhum setor cadastrado</p>
                                            <p className="text-xs text-yellow-700 mt-1">
                                                Para criar uma área, primeiro cadastre um setor em <strong>Configurações → Estrutura</strong>.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Área</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!canCreate}
                                        className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        value={areaName}
                                        onChange={e => setAreaName(e.target.value)}
                                        placeholder="Ex: Produção, Administrativo..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                                    <select
                                        required
                                        disabled={!canCreate}
                                        className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                                {!dataLoading && (areas.length === 0 || sectors.length === 0) && (
                                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-yellow-800">
                                                {sectors.length === 0 ? 'Nenhum setor cadastrado' : 'Nenhuma área cadastrada'}
                                            </p>
                                            <p className="text-xs text-yellow-700 mt-1">
                                                {sectors.length === 0
                                                    ? 'Para criar um colaborador, primeiro cadastre um setor em Configurações → Estrutura.'
                                                    : 'Para criar um colaborador, primeiro cadastre uma área clicando no "+" ao lado de Área.'
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!canCreate}
                                        className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                                            disabled={!canCreate}
                                            className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            value={collabData.matricula}
                                            onChange={e => setCollabData({ ...collabData, matricula: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                                        <select
                                            required
                                            disabled={!canCreate}
                                            className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
                                    <select
                                        disabled={!canCreate}
                                        className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        value={collabSectorId}
                                        onChange={e => {
                                            setCollabSectorId(e.target.value);
                                            // Limpar a área selecionada ao mudar o setor
                                            setCollabData({ ...collabData, areaId: '' });
                                        }}
                                    >
                                        <option value="">Todos os setores...</option>
                                        {sectors.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                                    <select
                                        required
                                        disabled={!canCreate}
                                        className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        value={collabData.areaId}
                                        onChange={e => setCollabData({ ...collabData, areaId: e.target.value })}
                                    >
                                        <option value="">Selecione a área...</option>
                                        {filteredAreas.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        disabled={!canCreate}
                                        className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                                        value={collabData.email}
                                        onChange={e => setCollabData({ ...collabData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                                    <input
                                        type="password"
                                        required
                                        disabled={!canCreate}
                                        className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading || !canCreate}
                                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                <span>Criar</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
