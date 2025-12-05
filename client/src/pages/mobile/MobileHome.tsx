import { useState, useEffect } from 'react';
import { Play, Calendar, Clock, X, Video } from 'lucide-react';

const MobileHome = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const firstName = user.name ? user.name.split(' ')[0] : 'Visitante';
    const [selectedPost, setSelectedPost] = useState<any>(null);

    const [feedItems, setFeedItems] = useState<any[]>([]);
    const [nextSchedule, setNextSchedule] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [resFeed, resSchedule] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/feed`, { headers }),
                    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/schedules`, { headers })
                ]);

                const feedData = await resFeed.json();
                const scheduleData = await resSchedule.json();

                if (Array.isArray(feedData)) {
                    setFeedItems(feedData.map((item: any) => ({
                        ...item,
                        type: item.videoLibrasUrl ? 'video' : 'article',
                        thumbnail: item.videoLibrasUrl ? 'bg-blue-100' : 'bg-green-100', // Simple logic for now
                        author: 'RH' // Backend doesn't return author name yet, defaulting
                    })));
                }

                if (Array.isArray(scheduleData) && scheduleData.length > 0) {
                    // Find next schedule
                    const now = new Date();
                    const next = scheduleData
                        .filter((s: any) => new Date(s.date) > now)
                        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

                    if (next) setNextSchedule(next);
                }

            } catch (error) {
                console.error('Error fetching mobile home data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando novidades...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Olá, {firstName} 👋</h1>
                <p className="text-gray-500">Confira as novidades de hoje</p>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-primary rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20">
                <h2 className="text-lg font-bold mb-4">Próximo Agendamento</h2>
                <div className="flex items-start space-x-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                    <Calendar className="h-10 w-10 text-white opacity-80" />
                    <div>
                        {nextSchedule ? (
                            <>
                                <p className="font-semibold">Acompanhamento</p>
                                <p className="text-sm text-blue-100 mt-1">
                                    {new Date(nextSchedule.date).toLocaleDateString()} às {nextSchedule.time}
                                </p>
                                <p className="text-xs text-blue-200 mt-2 flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {nextSchedule.collaborator ? `Com ${nextSchedule.collaborator}` : 'Aguardando confirmação'}
                                </p>
                            </>
                        ) : (
                            <p className="font-semibold">Nenhum agendamento futuro</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Feed Section - Only for non-Leaders */}
            {user.role !== 'LIDER' && (
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-900">Feed Acessível</h2>
                    <div className="space-y-4">
                        {feedItems.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedPost(item)}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex space-x-4 active:scale-95 transition-transform cursor-pointer"
                            >
                                <div className={`w-24 h-24 rounded-xl ${item.thumbnail} flex items-center justify-center flex-shrink-0`}>
                                    {item.type === 'video' ? (
                                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                                            <Play className="h-4 w-4 text-primary ml-1" />
                                        </div>
                                    ) : (
                                        <span className="text-2xl">📄</span>
                                    )}
                                </div>
                                <div className="flex-1 py-1">
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wide mb-2">
                                        {item.type === 'video' ? 'Vídeo em Libras' : 'Artigo'}
                                    </span>
                                    <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.title}</h3>
                                    <p className="text-xs text-gray-500">{item.author}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {item.type === 'video' ? item.duration : item.readTime}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Post Details Modal */}
            {selectedPost && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                        <div className="relative">
                            {selectedPost.imageUrl && (
                                <div className="h-56 w-full">
                                    <img src={selectedPost.imageUrl} alt={selectedPost.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <button
                                onClick={() => setSelectedPost(null)}
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex items-center space-x-2">
                                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide">
                                    {selectedPost.category}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(selectedPost.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900">{selectedPost.title}</h2>

                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {selectedPost.description}
                            </p>

                            {selectedPost.videoLibrasUrl && (
                                <div className="pt-4 border-t border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                                        <Video className="h-4 w-4 mr-2 text-primary" />
                                        Tradução em Libras
                                    </h3>
                                    <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                                        <a
                                            href={selectedPost.videoLibrasUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex flex-col items-center text-primary hover:underline"
                                        >
                                            <Video className="h-8 w-8 mb-2" />
                                            <span>Assistir Vídeo</span>
                                        </a>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedPost(null)}
                                className="w-full btn-secondary mt-4"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileHome;
