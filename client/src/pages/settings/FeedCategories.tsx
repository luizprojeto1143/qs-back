import { useState, useEffect } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
import { useCompany } from '../../contexts/CompanyContext';

const FeedCategories = () => {
    const { selectedCompanyId } = useCompany();
    const [categories, setCategories] = useState<any[]>([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers: any = { 'Authorization': `Bearer ${token}` };
            if (selectedCompanyId) headers['x-company-id'] = selectedCompanyId;

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/settings/feed-categories`, {
                headers
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setCategories(data);
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
            const token = localStorage.getItem('token');
            const headers: any = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            if (selectedCompanyId) headers['x-company-id'] = selectedCompanyId;

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/settings/feed-categories`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ name: newCategory })
            });

            if (response.ok) {
                setNewCategory('');
                fetchCategories();
            } else {
                alert('Erro ao criar categoria');
            }
        } catch (error) {
            console.error('Error creating category', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover esta categoria?')) return;

        try {
            const token = localStorage.getItem('token');
            const headers: any = { 'Authorization': `Bearer ${token}` };
            if (selectedCompanyId) headers['x-company-id'] = selectedCompanyId;

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/settings/feed-categories/${id}`, {
                method: 'DELETE',
                headers
            });

            if (response.ok) {
                fetchCategories();
            } else {
                alert('Erro ao remover categoria');
            }
        } catch (error) {
            console.error('Error deleting category', error);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Categorias do Feed</h1>
                <p className="text-gray-500">Gerencie as categorias disponíveis para os posts do feed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Add New */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
                    <h3 className="text-lg font-bold mb-4">Nova Categoria</h3>
                    <form onSubmit={handleAdd} className="flex space-x-2">
                        <input
                            type="text"
                            className="input-field flex-1"
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
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4">Categorias Ativas</h3>
                    {loading ? (
                        <p className="text-gray-500">Carregando...</p>
                    ) : (
                        <div className="space-y-2">
                            {categories.length === 0 && <p className="text-gray-400 text-sm">Nenhuma categoria cadastrada.</p>}
                            {categories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <Tag className="h-4 w-4 text-gray-400" />
                                        <span className="font-medium text-gray-700">{cat.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
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
