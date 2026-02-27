import { useState, useEffect } from 'react';
import { Plus, Trash2, User, Mail, Briefcase, Settings2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface Specialist {
    id: string;
    name: string;
    email: string;
    type: string;
}

interface Specialty {
    id: string;
    name: string;
}

const SpecialistSettings = () => {
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [loading, setLoading] = useState(true);

    // Specialist Form
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newType, setNewType] = useState('');

    // Specialty Form
    const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);
    const [newSpecialtyName, setNewSpecialtyName] = useState('');

    const fetchData = async () => {
        try {
            const [specialistsRes, specialtiesRes] = await Promise.all([
                api.get('/specialists'),
                api.get('/specialties')
            ]);
            setSpecialists(specialistsRes.data);
            setSpecialties(specialtiesRes.data);
            if (specialtiesRes.data.length > 0) {
                setNewType(specialtiesRes.data[0].name);
            }
        } catch (error) {
            console.error('Error fetching data', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddSpecialist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newEmail || !newType) {
            toast.error('Preencha todos os campos');
            return;
        }

        try {
            const response = await api.post('/specialists', {
                name: newName,
                email: newEmail,
                type: newType
            });
            setSpecialists([...specialists, response.data]);
            setNewName('');
            setNewEmail('');
            toast.success('Especialista adicionado com sucesso!');
        } catch (error) {
            console.error('Error adding specialist', error);
            toast.error('Erro ao adicionar especialista');
        }
    };

    const handleDeleteSpecialist = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este especialista?')) return;

        try {
            await api.delete(`/specialists/${id}`);
            setSpecialists(specialists.filter(s => s.id !== id));
            toast.success('Especialista removido com sucesso!');
        } catch (error) {
            console.error('Error deleting specialist', error);
            toast.error('Erro ao remover especialista');
        }
    };

    const handleAddSpecialty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSpecialtyName) return;

        try {
            const response = await api.post('/specialties', {
                name: newSpecialtyName
            });
            setSpecialties([...specialties, response.data]);
            setNewSpecialtyName('');
            setShowSpecialtyModal(false);

            // If it's the first specialty, select it
            if (specialties.length === 0) {
                setNewType(response.data.name);
            }

            toast.success('Especialidade adicionada!');
        } catch (error) {
            console.error('Error adding specialty', error);
            toast.error('Erro ao adicionar especialidade');
        }
    };

    const handleDeleteSpecialty = async (id: string) => {
        if (!confirm('Tem certeza? Isso não afetará especialistas já cadastrados.')) return;

        try {
            await api.delete(`/specialties/${id}`);
            setSpecialties(specialties.filter(s => s.id !== id));
            toast.success('Especialidade removida!');
        } catch (error) {
            console.error('Error deleting specialty', error);
            toast.error('Erro ao remover especialidade');
        }
    };

    if (loading) return <div className="text-gray-500">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastro de Especialistas</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Cadastre os especialistas que poderão ser convidados rapidamente durante as chamadas.
                    </p>
                </div>
                <button
                    onClick={() => setShowSpecialtyModal(true)}
                    className="btn-secondary flex items-center space-x-2"
                >
                    <Settings2 className="h-4 w-4" />
                    <span>Gerenciar Especialidades</span>
                </button>
            </div>

            {/* Add Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Novo Especialista</h2>
                <form onSubmit={handleAddSpecialist} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="input-field pl-10 w-full"
                                placeholder="Nome completo"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="input-field pl-10 w-full"
                                placeholder="email@exemplo.com"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especialidade</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                                value={newType}
                                onChange={(e) => setNewType(e.target.value)}
                                className="input-field pl-10 w-full"
                                required
                            >
                                <option value="">Selecione...</option>
                                {specialties.map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary flex items-center justify-center space-x-2 h-10">
                        <Plus className="h-4 w-4" />
                        <span>Adicionar</span>
                    </button>
                </form>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Especialidade</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {specialists.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Nenhum especialista cadastrado.
                                    </td>
                                </tr>
                            ) : (
                                specialists.map((specialist) => (
                                    <tr key={specialist.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {specialist.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {specialist.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                {specialist.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDeleteSpecialist(specialist.id)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Specialties Modal */}
            {showSpecialtyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gerenciar Especialidades</h3>
                            <button onClick={() => setShowSpecialtyModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <form onSubmit={handleAddSpecialty} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newSpecialtyName}
                                    onChange={(e) => setNewSpecialtyName(e.target.value)}
                                    className="input-field flex-1"
                                    placeholder="Nova especialidade..."
                                    required
                                />
                                <button type="submit" className="btn-primary">
                                    <Plus className="h-4 w-4" />
                                </button>
                            </form>

                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {specialties.length === 0 ? (
                                    <p className="text-center text-gray-500 text-sm py-4">Nenhuma especialidade cadastrada.</p>
                                ) : (
                                    specialties.map(specialty => (
                                        <div key={specialty.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <span className="text-sm text-gray-700 dark:text-gray-300">{specialty.name}</span>
                                            <button
                                                onClick={() => handleDeleteSpecialty(specialty.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpecialistSettings;
