import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';

const FeedCategories = () => {
    const { selectedCompanyId } = useCompany();
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/settings/feed-categories');
            if (Array.isArray(response.data)) {
                setCategories(response.data);
            }
        } catch (error) {
            console.error('Error fetching categories', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCompanyId) {
            fetchCategories();
        }
    }, [selectedCompanyId]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategory.trim()) return;

        try {
            await api.post('/settings/feed-categories', { name: newCategory });
            setNewCategory('');
            fetchCategories();
        } catch (error) {
            console.error('Error creating category', error);
            alert('Erro ao criar categoria');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover esta categoria?')) return;

        try {
            await api.delete(`/settings/feed-categories/${id}`);
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category', error);
            alert('Erro ao remover categoria');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categorias do Feed</h1>
                <p className="text-gray-500 dark:text-gray-400">Gerencie as categorias disponíveis para os posts do feed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add New */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 h-fit">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Nova Categoria</h3>
                    <form onSubmit={handleAdd} className="flex space-x-2">
                        <input
                            type="text"
                            className="input-field dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Ex: EVENTOS"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button type="submit" className="btn-primary flex items-center justify-center px-4">
                            <Plus className="h-5 w-5" />
                        </button>
                    </form>
                </div>

                {/* List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Categorias Ativas</h3>
                    {loading ? (
                        <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
                    ) : (
                        <div className="space-y-2">
                            {categories.length === 0 && <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma categoria cadastrada.</p>}
                            {categories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{cat.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedCategories;
