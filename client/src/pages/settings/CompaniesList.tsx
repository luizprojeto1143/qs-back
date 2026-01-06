import { useState, useEffect } from 'react';
import { Building, Plus, X, GraduationCap } from 'lucide-react';
import { api } from '../../lib/api';
import { EmptyState } from '../../components/EmptyState';

const CompaniesList = () => {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newCompany, setNewCompany] = useState({
        name: '',
        cnpj: '',
        email: '',
        password: '',
        universityEnabled: false
    });

    const fetchCompanies = async () => {
        try {
            const response = await api.get('/companies?includeInactive=true');
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
            setNewCompany({ name: '', cnpj: '', email: '', password: '', universityEnabled: false });
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
            password: '',
            universityEnabled: company.universityEnabled || false
        });
        setEditingId(company.id);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastro de Empresas</h1>
                <button
                    type="button"
                    onClick={() => {
                        setNewCompany({ name: '', cnpj: '', email: '', password: '', universityEnabled: false });
                        setEditingId(null);
                        setIsModalOpen(true);
                    }}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Nova Empresa</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">Carregando...</div>
            ) : companies.length === 0 ? (
                <EmptyState
                    title="Nenhuma empresa encontrada"
                    description="Comece cadastrando a primeira empresa do sistema para gerenciar seus dados."
                    icon={Building}
                    action={{
                        label: 'Nova Empresa',
                        onClick: () => {
                            setNewCompany({ name: '', cnpj: '', email: '', password: '', universityEnabled: false });
                            setEditingId(null);
                            setIsModalOpen(true);
                        }
                    }}
                />
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">CNPJ</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Universidade</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {Array.isArray(companies) && companies.map((company) => (
                                    <tr key={company.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!company.active ? 'opacity-60' : ''}`}>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                                    <Building className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <span>{company.name}</span>
                                                    {!company.active && <span className="ml-2 text-xs text-red-500">(Inativa)</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{company.cnpj}</td>
                                        <td className="px-6 py-4">
                                            {company.universityEnabled ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                    <GraduationCap className="w-3 h-3 mr-1" />
                                                    Ativa
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                    Inativa
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button type="button" onClick={() => handleEdit(company)} className="text-primary hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Editar Empresa' : 'Nova Empresa'}</h2>
                            <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Fechar modal">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Empresa</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newCompany.name}
                                    onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newCompany.cnpj}
                                    onChange={e => setNewCompany({ ...newCompany, cnpj: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email do Responsável (RH)</label>
                                <input
                                    type="email"
                                    required
                                    className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newCompany.email}
                                    onChange={e => setNewCompany({ ...newCompany, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha {editingId && '(Deixe em branco para manter)'}</label>
                                <input
                                    type="password"
                                    required={!editingId}
                                    className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newCompany.password}
                                    onChange={e => setNewCompany({ ...newCompany, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="universityEnabled"
                                    checked={newCompany.universityEnabled}
                                    onChange={e => setNewCompany({ ...newCompany, universityEnabled: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="universityEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Habilitar Universidade Corporativa
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
