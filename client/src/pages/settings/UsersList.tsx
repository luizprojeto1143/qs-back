import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Plus, Pencil, Trash2, X, Check, Shield, Building2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'MASTER' | 'RH' | 'LIDER';
    companyId?: string;
    areaId?: string;
    company?: { name: string };
    area?: { name: string };
}

interface Company {
    id: string;
    name: string;
}

interface Area {
    id: string;
    name: string;
    sector?: {
        companyId: string;
    };
}

export function UsersList() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'RH',
        companyId: '',
        areaId: ''
    });

    const queryClient = useQueryClient();

    const { data: users, isLoading } = useQuery<User[]>({
        queryKey: ['users'],
        queryFn: async () => {
            const response = await api.get('/users');
            return response.data.data;
        }
    });

    const { data: companies } = useQuery<Company[]>({
        queryKey: ['companies'],
        queryFn: async () => {
            const response = await api.get('/companies');
            return response.data;
        }
    });

    // Fetch areas based on selected company
    const { data: areas } = useQuery<Area[]>({
        queryKey: ['areas', formData.companyId],
        queryFn: async () => {
            if (!formData.companyId) return [];
            const response = await api.get(`/areas?companyId=${formData.companyId}`);
            return response.data;
        },
        enabled: !!formData.companyId
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post('/users', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Usuário criado com sucesso!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erro ao criar usuário');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.put(`/users/${editingUser?.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsModalOpen(false);
            resetForm();
            toast.success('Usuário atualizado com sucesso!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'Erro ao atualizar usuário');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuário removido com sucesso!');
        },
        onError: () => {
            toast.error('Erro ao remover usuário');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Don't fill password on edit
            role: user.role as string,
            companyId: user.companyId || '',
            areaId: user.areaId || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja remover este usuário?')) {
            deleteMutation.mutate(id);
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'RH',
            companyId: '',
            areaId: ''
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Gestão de Usuários</h2>
                    <p className="text-gray-600 dark:text-gray-400">Gerencie acessos de RH e Líderes</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Novo Usuário
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Nome</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Perfil</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Empresa</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Área (Líder)</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-4 text-center text-gray-500 dark:text-gray-400">Carregando...</td></tr>
                            ) : users?.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="p-4 font-medium text-gray-800 dark:text-white">{user.name}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${user.role === 'MASTER' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                                                user.role === 'RH' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                                                    'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'}`}>
                                            <Shield size={12} />
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">
                                        {user.company?.name || '-'}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">
                                        {user.area?.name || '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                aria-label={`Editar usuário ${user.name}`}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                aria-label={`Excluir usuário ${user.name}`}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 m-4">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                    {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Fechar modal">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        placeholder={editingUser ? 'Deixe em branco para manter' : ''}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Perfil</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    >
                                        <option value="RH">RH</option>
                                        <option value="LIDER">Líder</option>
                                        <option value="MASTER">Consultoria</option>
                                    </select>
                                </div>

                                {formData.role !== 'MASTER' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                            <select
                                                required
                                                value={formData.companyId}
                                                onChange={e => setFormData({ ...formData, companyId: e.target.value, areaId: '' })}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Selecione uma empresa...</option>
                                                {companies?.map(company => (
                                                    <option key={company.id} value={company.id}>{company.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {formData.role === 'LIDER' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                            <select
                                                required
                                                value={formData.areaId}
                                                onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="">Selecione uma área...</option>
                                                {formData.companyId ? (
                                                    areas?.length ? (
                                                        areas.map(area => (
                                                            <option key={area.id} value={area.id}>{area.name}</option>
                                                        ))
                                                    ) : (
                                                        <option disabled>Nenhuma área nesta empresa</option>
                                                    )
                                                ) : (
                                                    <option disabled>Selecione uma empresa primeiro</option>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <Check size={18} />
                                        {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
