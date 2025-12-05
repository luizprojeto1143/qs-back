import { useState, useEffect } from 'react';
import { Search, Plus, ChevronRight, User, X } from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';

const CollaboratorsList = () => {
    const { selectedCompanyId, companies: contextCompanies } = useCompany();
    const [collaborators, setCollaborators] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>(contextCompanies);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // New Collaborator State
    const [newCollab, setNewCollab] = useState({
        name: '',
        email: '',
        matricula: '',
        companyId: selectedCompanyId || '',
        areaId: '',
        shift: 'MANHA',
        disabilityType: 'NENHUMA',
        needsDescription: '',
        password: ''
    });

    // Update newCollab when selectedCompanyId changes
    useEffect(() => {
        if (selectedCompanyId) {
            setNewCollab(prev => ({ ...prev, companyId: selectedCompanyId }));
        }
    }, [selectedCompanyId]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // Use context companies if available, otherwise fetch
            if (contextCompanies.length > 0) {
                setCompanies(contextCompanies);
            } else {
                const resCompanies = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/companies`, { headers });
                setCompanies(await resCompanies.json());
            }

            const [resCollabs, resAreas] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collaborators`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/areas`, { headers })
            ]);

            setCollaborators(await resCollabs.json());
            setAreas(await resAreas.json());
        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [contextCompanies]); // Re-fetch if context companies change

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingId
                ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collaborators/${editingId}`
                : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collaborators`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newCollab)
            });

            if (response.ok) {
                setIsModalOpen(false);
                setNewCollab({
                    name: '', email: '', matricula: '', companyId: selectedCompanyId || '', areaId: '',
                    shift: 'MANHA', disabilityType: 'NENHUMA', needsDescription: '', password: ''
                });
                setEditingId(null);
                fetchData();
                alert(editingId ? 'Colaborador atualizado com sucesso!' : 'Colaborador cadastrado com sucesso!');
            } else {
                alert('Erro ao salvar colaborador.');
            }
        } catch (error) {
            console.error('Error saving collaborator', error);
        }
    };

    const handleEdit = (collab: any) => {
        setNewCollab({
            name: collab.name,
            email: collab.email,
            matricula: collab.collaboratorProfile?.matricula || '',
            companyId: collab.companyId,
            areaId: collab.collaboratorProfile?.areaId || '',
            shift: collab.collaboratorProfile?.shift || 'MANHA',
            disabilityType: collab.collaboratorProfile?.disabilityType || 'NENHUMA',
            needsDescription: collab.collaboratorProfile?.needsDescription || '',
            password: '' // Don't populate password
        });
        setEditingId(collab.id);
        setIsModalOpen(true);
    };

    // Filter collaborators based on selectedCompanyId
    const filteredCollaborators = collaborators.filter(collab => !selectedCompanyId || collab.companyId === selectedCompanyId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Colaboradores</h1>
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Colaborador</span>
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="Buscar por nome, matrícula..."
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10">Carregando...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {filteredCollaborators.map((collab) => (
                            <div key={collab.id} onClick={() => handleEdit(collab)} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden text-gray-400">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">{collab.name}</h3>
                                        <p className="text-xs text-gray-500">
                                            {collab.collaboratorProfile?.area?.name || 'Sem Área'} • {collab.collaboratorProfile?.shift || 'Sem Turno'}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{editingId ? 'Editar Colaborador' : 'Novo Colaborador'}</h2>
                            <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={newCollab.name}
                                        onChange={e => setNewCollab({ ...newCollab, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="input-field"
                                        value={newCollab.email}
                                        onChange={e => setNewCollab({ ...newCollab, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Senha {editingId && '(Deixe em branco para manter)'}</label>
                                    <input
                                        type="password"
                                        required={!editingId}
                                        className="input-field"
                                        value={newCollab.password}
                                        onChange={e => setNewCollab({ ...newCollab, password: e.target.value })}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={newCollab.matricula}
                                        onChange={e => setNewCollab({ ...newCollab, matricula: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                    <select
                                        required
                                        className={`input-field ${selectedCompanyId ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        value={newCollab.companyId}
                                        onChange={e => setNewCollab({ ...newCollab, companyId: e.target.value })}
                                        disabled={!!selectedCompanyId}
                                    >
                                        <option value="">Selecione...</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={newCollab.areaId}
                                        onChange={e => setNewCollab({ ...newCollab, areaId: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={newCollab.shift}
                                        onChange={e => setNewCollab({ ...newCollab, shift: e.target.value })}
                                    >
                                        <option value="MANHA">Manhã</option>
                                        <option value="TARDE">Tarde</option>
                                        <option value="NOITE">Noite</option>
                                        <option value="ESCALA_12X36">Escala 12x36</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Deficiência</label>
                                    <select
                                        required
                                        className="input-field"
                                        value={newCollab.disabilityType}
                                        onChange={e => setNewCollab({ ...newCollab, disabilityType: e.target.value })}
                                    >
                                        <option value="NENHUMA">Nenhuma</option>
                                        <option value="FISICA">Física</option>
                                        <option value="AUDITIVA">Auditiva</option>
                                        <option value="VISUAL">Visual</option>
                                        <option value="INTELECTUAL">Intelectual</option>
                                        <option value="MULTIPLA">Múltipla</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Necessidades Específicas</label>
                                    <textarea
                                        className="input-field"
                                        rows={3}
                                        value={newCollab.needsDescription}
                                        onChange={e => setNewCollab({ ...newCollab, needsDescription: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Salvar Colaborador
                                </button>
                            </div>
                        </form>
                    </div>
                </div >
            )}
        </div >
    );
};

export default CollaboratorsList;
