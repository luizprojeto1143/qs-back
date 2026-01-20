import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { MessageSquare, Send, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../../contexts/AuthContext';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        avatar?: string; // Optional if not always present
        role: string;
        level: number;
    };
    replies: Comment[];
}

interface LessonCommentsProps {
    lessonId: string;
}

export const LessonComments = ({ lessonId }: LessonCommentsProps) => {
    const { user } = useAuth(); // Assuming auth context exposes current user
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchComments = async () => {
        try {
            const response = await api.get(`/lessons/${lessonId}/comments`);
            setComments(response.data);
        } catch (error) {
            console.error('Error fetching comments', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [lessonId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await api.post(`/lessons/${lessonId}/comments`, {
                content: newComment
            });
            setNewComment('');
            fetchComments(); // Refresh list
            toast.success('Comentário enviado!');
        } catch (error) {
            toast.error('Erro ao enviar comentário');
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!confirm('Tem certeza que deseja excluir este comentário?')) return;
        try {
            await api.delete(`/comments/${commentId}`);
            fetchComments();
            toast.success('Comentário excluído');
        } catch (error) {
            toast.error('Erro ao excluir');
        }
    };

    if (loading) return <div className="py-4 text-center text-gray-500">Carregando comentários...</div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mt-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Dúvidas e Comentários da Comunidade
            </h3>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <User className="h-5 w-5 text-gray-500" />
                    )}
                </div>
                <div className="flex-1 relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Tem alguma dúvida ou quer compartilhar algo?"
                        className="w-full p-3 pr-12 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none min-h-[50px]"
                        rows={2}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute right-2 bottom-2.5 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </form>

            {/* Comments List */}
            <div className="space-y-6">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                        Seja o primeiro a comentar nesta aula! 🚀
                    </div>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3 group">
                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-white dark:ring-gray-800 shadow-sm relative">
                                {comment.user.avatar ? (
                                    <img src={comment.user.avatar} alt={comment.user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="h-5 w-5 text-gray-500" />
                                )}
                                {/* Level Badge (Tiny) */}
                                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-[9px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center border border-white">
                                    {comment.user.level}
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl rounded-tl-none">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-gray-900 dark:text-white">
                                                {comment.user.name}
                                            </span>
                                            {comment.user.role !== 'COLABORADOR' && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${comment.user.role === 'MASTER' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {comment.user.role}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400">
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {(user?.id === comment.user.id || user?.role === 'MASTER') && (
                                            <button
                                                onClick={() => handleDelete(comment.id)}
                                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {comment.content}
                                    </p>
                                </div>

                                {/* Action buttons (Reply, Like - Future) */}
                                <div className="flex gap-4 mt-1 ml-2">
                                    <button className="text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-300">
                                        Responder
                                    </button>
                                </div>

                                {/* Replies (Simplified for V1) */}
                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                                        {comment.replies.map(reply => (
                                            <div key={reply.id} className="flex gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                                    <User className="h-3 w-3 text-gray-500" />
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-xl rounded-tl-none flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="font-semibold text-xs text-gray-900 dark:text-white">{reply.user.name}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-700 dark:text-gray-300">{reply.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
