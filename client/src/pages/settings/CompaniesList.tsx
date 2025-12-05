import { useState, useEffect } from 'react';
import { Building, Plus, X } from 'lucide-react';
import { api } from '../../lib/api';

const CompaniesList = () => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newCompany, setNewCompany] = useState({ name: '', cnpj: '', email: '', password: '' });

    const fetchCompanies = async () => {
        try {
            const response = await api.get('/companies');
            setCompanies(response.data);
        } catch (error) {
            console.error('Error fetching companies', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/companies/${editingId}` : '/companies';
            const method = editingId ? 'put' : 'post';

            await api[method](url, newCompany);

            setIsModalOpen(false);
            setNewCompany({ name: '', cnpj: '', email: '', password: '' });
            setEditingId(null);
            fetchCompanies();
            alert(editingId ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!');
        } catch (error: any) {
            console.error('Error saving company', error);
            alert(error.message || 'Erro ao salvar empresa.');
        }
    };

    const handleEdit = (company: any) => {
        setNewCompany({
            name: company.name,
            cnpj: company.cnpj,
            email: '', // Don't populate sensitive/unknown data if not needed, or fetch if available
            password: ''
        });
        setEditingId(company.id);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Cadastro de Empresas</h1>
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Nova Empresa</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Carregando...</div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">CNPJ</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Array.isArray(companies) && companies.map((company) => (
                                <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <Building className="h-5 w-5" />
                                            </div>
                                            <span>{company.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{company.cnpj}</td>
                                    <td className="px-6 py-4">
                                        <button type="button" onClick={() => handleEdit(company)} className="text-primary hover:text-blue-700 text-sm font-medium">Editar</button>
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
                            <h2 className="text-xl font-bold">{editingId ? 'Editar Empresa' : 'Nova Empresa'}</h2>
                            <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={newCompany.name}
                                    onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={newCompany.cnpj}
                                    onChange={e => setNewCompany({ ...newCompany, cnpj: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email do Responsável (RH)</label>
                                <input
                                    type="email"
                                    required
                                    className="input-field"
                                    value={newCompany.email}
                                    onChange={e => setNewCompany({ ...newCompany, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Senha {editingId && '(Deixe em branco para manter)'}</label>
                                <input
                                    type="password"
                                    required={!editingId}
                                    className="input-field"
                                    value={newCompany.password}
                                    onChange={e => setNewCompany({ ...newCompany, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingId(null); }}
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

export default CompaniesList;
