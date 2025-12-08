import { useState, useEffect } from 'react';
import { Plus, Trash2, User, Mail, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';

interface Specialist {
    id: string;
    name: string;
    email: string;
    type: string;
}

const SPECIALIST_TYPES = [
    { value: 'PSICOLOGO', label: 'Psicólogo(a)' },
    { value: 'ASSISTENTE_SOCIAL', label: 'Assistente Social' },
    { value: 'ADVOGADO', label: 'Advogado(a)' },
    { value: 'MEDICO', label: 'Médico(a)' },
    { value: 'OUTRO', label: 'Outro' }
];

const SpecialistSettings = () => {
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newType, setNewType] = useState('PSICOLOGO');

    const fetchSpecialists = async () => {
        try {
            const response = await api.get('/specialists');
            setSpecialists(response.data);
        } catch (error) {
            console.error('Error fetching specialists', error);
            toast.error('Erro ao carregar especialistas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSpecialists();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName || !newEmail) return;

        try {
            const response = await api.post('/specialists', {
                name: newName,
                email: newEmail,
                type: newType
            });
            setSpecialists([...specialists, response.data]);
            setNewName('');
            setNewEmail('');
            setNewType('PSICOLOGO');
            toast.success('Especialista adicionado com sucesso!');
        } catch (error) {
            console.error('Error adding specialist', error);
            toast.error('Erro ao adicionar especialista');
        }
    };

    const handleDelete = async (id: string) => {
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

    const getTypeLabel = (type: string) => {
        return SPECIALIST_TYPES.find(t => t.value === type)?.label || type;
    };

    if (loading) return <div className="text-gray-500">Carregando...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastro de Especialistas</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Cadastre os especialistas que poderão ser convidados rapidamente durante as chamadas.
                </p>
            </div>

            {/* Add Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Novo Especialista</h2>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                            >
                                {SPECIALIST_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
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
                                                {getTypeLabel(specialist.type)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDelete(specialist.id)}
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
        </div>
    );
};

export default SpecialistSettings;
