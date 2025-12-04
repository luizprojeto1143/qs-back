import { Play, Calendar, Clock } from 'lucide-react';

const MobileHome = () => {
    const feedItems = [
        {
            id: 1,
            title: 'Semana da Inclusão',
            type: 'video',
            duration: '5 min',
            thumbnail: 'bg-blue-100',
            author: 'Equipe de Diversidade'
        },
        {
            id: 2,
            title: 'Novos benefícios disponíveis',
            type: 'article',
            readTime: '3 min leitura',
            thumbnail: 'bg-green-100',
            author: 'RH'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Olá, João 👋</h1>
                <p className="text-gray-500">Confira as novidades de hoje</p>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-primary rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20">
                <h2 className="text-lg font-bold mb-4">Próximo Agendamento</h2>
                <div className="flex items-start space-x-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                    <Calendar className="h-10 w-10 text-white opacity-80" />
                    <div>
                        <p className="font-semibold">Acompanhamento Mensal</p>
                        <p className="text-sm text-blue-100 mt-1">Hoje, 14:30</p>
                        <p className="text-xs text-blue-200 mt-2 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Com Maria (Líder)
                        </p>
                    </div>
                </div>
            </div>

            {/* Feed Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Feed Acessível</h2>
                <div className="space-y-4">
                    {feedItems.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex space-x-4">
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
        </div>
    );
};

export default MobileHome;
