import { useState, useEffect } from 'react';
import { Video, Plus, MoreHorizontal, X, Image as ImageIcon, Edit, Trash2 } from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import { toast } from 'sonner';
import { api } from '../lib/api';

const Feed = () => {
    const { selectedCompanyId } = useCompany();
    const [posts, setPosts] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    const [categories, setCategories] = useState<any[]>([]);

    // New Post Form State
    const [newPost, setNewPost] = useState({
        title: '',
        description: '',
        category: '',
        imageUrl: '',
        videoLibrasUrl: ''
    });

    const fetchPosts = async () => {
        try {
            const response = await api.get('/feed');
            const data = response.data;
            if (Array.isArray(data)) {
                setPosts(data);
            } else {
                console.error('Feed data is not an array:', data);
                setPosts([]);
            }
        } catch (error) {
            console.error('Error fetching posts', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/settings/feed-categories');
            const data = response.data;
            if (Array.isArray(data)) {
                setCategories(data);
                if (data.length > 0 && !newPost.category) {
                    setNewPost(prev => ({ ...prev, category: data[0].name }));
                }
            }
        } catch (error) {
            console.error('Error fetching categories', error);
        }
    };

    useEffect(() => {
        if (selectedCompanyId) {
            fetchPosts();
            fetchCategories();
        }
    }, [selectedCompanyId]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/feed/${editingId}` : '/feed';
            const method = editingId ? 'put' : 'post';

            await api[method](url, newPost);

            setIsModalOpen(false);
            setNewPost({ title: '', description: '', category: categories[0]?.name || '', imageUrl: '', videoLibrasUrl: '' });
            setEditingId(null);
            fetchPosts(); // Refresh list
            toast.success(editingId ? 'Post atualizado com sucesso!' : 'Post criado com sucesso!');
        } catch (error) {
            console.error('Error saving post', error);
            toast.error('Erro ao salvar post');
        }
    };

    const handleEdit = (post: any) => {
        setNewPost({
            title: post.title,
            description: post.description,
            category: post.category,
            imageUrl: post.imageUrl || '',
            videoLibrasUrl: post.videoLibrasUrl || ''
        });
        setEditingId(post.id);
        setIsModalOpen(true);
        setActiveMenuId(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este post?')) return;

        try {
            await api.delete(`/feed/${id}`);
            fetchPosts();
            toast.success('Post excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting post', error);
            toast.error('Erro ao excluir post');
        }
        setActiveMenuId(null);
    };

    return (
        <div className="space-y-6" onClick={() => setActiveMenuId(null)}>
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Feed Acessível</h1>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); setEditingId(null); setNewPost({ title: '', description: '', category: categories[0]?.name || '', imageUrl: '', videoLibrasUrl: '' }); }}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Novo Post</span>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Carregando feed...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post) => (
                        <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow relative">
                            {post.imageUrl && (
                                <div className="h-48 w-full relative">
                                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                                    {post.videoLibrasUrl && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <Video className="h-6 w-6 text-primary ml-1" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide">
                                        {post.category}
                                    </span>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === post.id ? null : post.id); }}
                                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                                        >
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>

                                        {activeMenuId === post.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(post); }}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Excluir
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{post.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleEdit(post); }}
                                        className="text-primary text-sm font-medium hover:text-blue-700"
                                    >
                                        Editar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Post Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{editingId ? 'Editar Post' : 'Novo Post'}</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePost} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    className="input-field"
                                    value={newPost.title}
                                    onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                <select
                                    className="input-field"
                                    value={newPost.category}
                                    onChange={e => setNewPost({ ...newPost, category: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    className="input-field"
                                    rows={3}
                                    value={newPost.description}
                                    onChange={e => setNewPost({ ...newPost, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500">
                                        <ImageIcon className="h-4 w-4" />
                                    </span>
                                    <input
                                        type="url"
                                        className="input-field rounded-l-none"
                                        placeholder="https://..."
                                        value={newPost.imageUrl}
                                        onChange={e => setNewPost({ ...newPost, imageUrl: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">URL do Vídeo (Libras)</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500">
                                        <Video className="h-4 w-4" />
                                    </span>
                                    <input
                                        type="url"
                                        className="input-field rounded-l-none"
                                        placeholder="https://..."
                                        value={newPost.videoLibrasUrl}
                                        onChange={e => setNewPost({ ...newPost, videoLibrasUrl: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary w-full mt-2">
                                {editingId ? 'Salvar Alterações' : 'Publicar'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Feed;
