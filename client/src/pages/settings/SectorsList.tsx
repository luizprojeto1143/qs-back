import { useState, useEffect } from 'react';
import { Layers, Plus, X } from 'lucide-react';

const SectorsList = () => {
    const [sectors, setSectors] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newSector, setNewSector] = useState({ name: '', companyId: '' });

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [resSectors, resCompanies] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sectors`, { headers }),
                fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/companies`, { headers })
            ]);

            const sectorsData = await resSectors.json();
            const companiesData = await resCompanies.json();

            setSectors(sectorsData);
            setCompanies(companiesData);
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
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sectors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newSector)
            });

            if (response.ok) {
                setIsModalOpen(false);
                setNewSector({ name: '', companyId: '' });
                fetchData();
                alert('Setor cadastrado com sucesso!');
            } else {
                alert('Erro ao cadastrar setor.');
            }
        } catch (error) {
            console.error('Error creating sector', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Cadastro de Setores</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Novo Setor</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Carregando...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome do Setor</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sectors.map((sector) => (
                                <tr key={sector.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                                <Layers className="h-5 w-5" />
                                            </div>
                                            <span>{sector.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{sector.company?.name}</td>
                                    <td className="px-6 py-4">
                                        <button className="text-primary hover:text-blue-700 text-sm font-medium">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Novo Setor</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                <select
                                    required
                                    className="input-field"
                                    value={newSector.companyId}
                                    onChange={e => setNewSector({ ...newSector, companyId: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {Array.isArray(companies) && companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Setor</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={newSector.name}
                                    onChange={e => setNewSector({ ...newSector, name: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SectorsList;
