import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, Filter, Plus, X, User } from 'lucide-react';

const Pendencies = () => {
    const [pendencies, setPendencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Dropdown Data
    const [companies, setCompanies] = useState<any[]>([]);
    const [areas, setAreas] = useState<any[]>([]);


    const [newPendency, setNewPendency] = useState({
        description: '',
        responsible: '',
        priority: 'MEDIA',
        deadline: '',
        companyId: '',
        areaId: '',
        collaboratorId: ''
    });

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [resPendencies, resCompanies, resAreas] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pendencies`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/companies`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/areas`, { headers }),
            ]);

            setPendencies(await resPendencies.json());
            setCompanies(await resCompanies.json());
            setAreas(await resAreas.json());

        } catch (error) {
            console.error('Error fetching data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pendencies`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newPendency)
            });

            if (response.ok) {
                setIsModalOpen(false);
                setNewPendency({
                    description: '', responsible: '', priority: 'MEDIA', deadline: '',
                    companyId: '', areaId: '', collaboratorId: ''
                });
                fetchData();
                alert('Pendência registrada com sucesso!');
            } else {
                alert('Erro ao registrar pendência.');
            }
        } catch (error) {
            console.error('Error creating pendency', error);
        }
    };

    const handleResolve = async (id: string) => {
        if (!confirm('Marcar pendência como resolvida?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/pendencies/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'RESOLVIDA' })
            });
            fetchData();
        } catch (error) {
            console.error('Error resolving pendency', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Gestão de Pendências</h1>
                <div className="flex space-x-3">
                    <button onClick={() => alert('Funcionalidade de filtros em desenvolvimento.')} className="btn-secondary flex items-center space-x-2">
                        <Filter className="h-4 w-4" />
                        <span>Filtrar</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Nova Pendência</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Carregando...</div>
            ) : pendencies.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center border border-gray-100 shadow-sm">
                    <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhuma pendência registrada</h3>
                    <p className="text-gray-500">Tudo certo por aqui! Nenhuma pendência em aberto.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-100">
                        {pendencies.map((item) => (
                            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4">
                                        <div className={`p-2 rounded-lg ${item.priority === 'ALTA' ? 'bg-red-50 text-red-600' :
                                            item.priority === 'MEDIA' ? 'bg-yellow-50 text-yellow-600' :
                                                'bg-blue-50 text-blue-600'
                                            }`}>
                                            <AlertCircle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">{item.description}</h3>
                                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                <span className="flex items-center">
                                                    <User className="h-4 w-4 mr-1" />
                                                    {item.responsible}
                                                </span>
                                                <span className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'Sem prazo'}
                                                </span>
                                                {item.area && (
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                        {item.area.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${item.status === 'RESOLVIDA' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {item.status}
                                        </span>
                                        {item.status !== 'RESOLVIDA' && (
                                            <button
                                                onClick={() => handleResolve(item.id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Resolver"
                                            >
                                                <CheckCircle className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Nova Pendência</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    required
                                    className="input-field"
                                    rows={3}
                                    value={newPendency.description}
                                    onChange={e => setNewPendency({ ...newPendency, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={newPendency.responsible}
                                        onChange={e => setNewPendency({ ...newPendency, responsible: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        value={newPendency.deadline}
                                        onChange={e => setNewPendency({ ...newPendency, deadline: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                    <select
                                        className="input-field"
                                        value={newPendency.priority}
                                        onChange={e => setNewPendency({ ...newPendency, priority: e.target.value })}
                                    >
                                        <option value="BAIXA">Baixa</option>
                                        <option value="MEDIA">Média</option>
                                        <option value="ALTA">Alta</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Área (Opcional)</label>
                                    <select
                                        className="input-field"
                                        value={newPendency.areaId}
                                        onChange={e => setNewPendency({ ...newPendency, areaId: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                <select
                                    required
                                    className="input-field"
                                    value={newPendency.companyId}
                                    onChange={e => setNewPendency({ ...newPendency, companyId: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Salvar Pendência
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pendencies;
