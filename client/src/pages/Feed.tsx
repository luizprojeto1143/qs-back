import { useState, useEffect } from 'react';
import { Video, Plus, MoreHorizontal, X, Image as ImageIcon } from 'lucide-react';

const Feed = () => {
    const [posts, setPosts] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    // New Post Form State
    const [newPost, setNewPost] = useState({
        title: '',
        description: '',
        category: 'AVISO',
        imageUrl: '',
        videoLibrasUrl: ''
    });

    const fetchPosts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/feed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setPosts(data);
        } catch (error) {
            console.error('Error fetching posts', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/feed`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newPost)
            });

            if (response.ok) {
                setIsModalOpen(false);
                setNewPost({ title: '', description: '', category: 'AVISO', imageUrl: '', videoLibrasUrl: '' });
                fetchPosts(); // Refresh list
            } else {
                alert('Erro ao criar post');
            }
        } catch (error) {
            console.error('Error creating post', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Feed Acessível</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
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
                        <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
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
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </button>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2">{post.title}</h3>
                                <p className="text-gray-600 text-sm line-clamp-3 mb-4">{post.description}</p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <span className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                                    <button className="text-primary text-sm font-medium hover:text-blue-700">Editar</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Post Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Novo Post</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                                    <option value="AVISO">Aviso</option>
                                    <option value="BENEFICIO">Benefício</option>
                                    <option value="CAMPANHA">Campanha</option>
                                    <option value="VAGA">Vaga</option>
                                    <option value="CARDAPIO">Cardápio</option>
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
                                Publicar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Feed;
