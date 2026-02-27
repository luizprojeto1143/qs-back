
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Play, Clock } from 'lucide-react';
import { toast } from 'sonner';
import ReviewForm from './ReviewForm';

interface Review {
    id: string;
    reviewee: { name: string; role: string };
    type: string;
    cycle: { name: string };
}

interface Cycle {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
}

const PerformanceTab = () => {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [activeCycles, setActiveCycles] = useState<Cycle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedReviewId) {
            fetchData();
        }
    }, [selectedReviewId]);

    const fetchData = async () => {
        try {
            const [reviewsRes, cyclesRes] = await Promise.all([
                api.get('/reviews/my'),
                user?.role === 'MASTER' || user?.role === 'RH' ? api.get('/cycles') : Promise.resolve({ data: [] })
            ]);
            setReviews(reviewsRes.data);
            setActiveCycles(cyclesRes.data);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados');
        } finally {
            setIsLoading(false);
        }
    };

    if (selectedReviewId) {
        return (
            <ReviewForm
                reviewId={selectedReviewId}
                onBack={() => setSelectedReviewId(null)}
                onComplete={() => {
                    setSelectedReviewId(null);
                    fetchData();
                }}
            />
        );
    }

    if (isLoading) return <div className="p-8 text-center animate-pulse">Carregando...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* My Pending Reviews */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Avaliações Pendentes
                </h3>

                {reviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        Nenhuma avaliação pendente para você neste momento.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {reviews.map((review) => (
                            <div key={review.id} className="border p-4 rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors group relative overflow-hidden">
                                <div>
                                    <p className="font-bold text-gray-800">{review.reviewee.name}</p>
                                    <p className="text-xs text-gray-500 uppercase">{review.type === 'SELF' ? 'Autoavaliação' : `Avaliação de ${review.reviewee.role}`}</p>
                                    <p className="text-xs text-blue-600 mt-1">{review.cycle.name}</p>
                                </div>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => setSelectedReviewId(review.id)}
                                        className="btn-primary text-sm px-4 py-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0"
                                    >
                                        Iniciar
                                    </button>
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 group-hover:hidden text-gray-400">
                                    <Play className="h-5 w-5" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* HR Area - Active Cycles */}
            {(user?.role === 'MASTER' || user?.role === 'RH') && (
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm opacity-75 hover:opacity-100 transition-opacity">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Play className="h-5 w-5 text-purple-600" />
                            Ciclos de Avaliação (Admin)
                        </h3>
                        {/* Future: Create Cycle Button */}
                    </div>

                    <div className="space-y-3">
                        {activeCycles.length === 0 ? (
                            <p className="text-gray-500">Nenhum ciclo criado.</p>
                        ) : (
                            activeCycles.map((cycle) => (
                                <div key={cycle.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-bold">{cycle.name}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-xs text-xs font-bold ${cycle.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>
                                        {cycle.status}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceTab;
