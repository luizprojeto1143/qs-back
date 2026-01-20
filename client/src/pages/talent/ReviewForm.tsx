
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Star } from 'lucide-react';

interface ReviewFormProps {
    reviewId: string;
    onBack: () => void;
    onComplete: () => void;
}

const COMPETENCIES = [
    {
        id: 'comunicacao',
        title: 'Comunicação',
        description: 'Capacidade de se expressar de forma clara e assertiva, garantindo o entendimento mútuo.'
    },
    {
        id: 'proatividade',
        title: 'Proatividade',
        description: 'Iniciativa para antecipar problemas e buscar soluções sem necessidade de supervisão constante.'
    },
    {
        id: 'trabalho_equipe',
        title: 'Trabalho em Equipe',
        description: 'Habilidade de colaborar com colegas, respeitando opiniões e contribuindo para o clima organizacional.'
    },
    {
        id: 'entrega_resultados',
        title: 'Entrega de Resultados',
        description: 'Comprometimento com metas, prazos e qualidade das entregas.'
    },
    {
        id: 'inovacao',
        title: 'Inovação e Melhoria',
        description: 'Busca constante por novas formas de fazer o trabalho mais eficiente e melhor.'
    }
];

const ReviewForm = ({ reviewId, onBack, onComplete }: ReviewFormProps) => {
    const [review, setReview] = useState<any>(null);
    const [answers, setAnswers] = useState<Record<string, { rating: number, comment: string }>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchReview();
    }, [reviewId]);

    const fetchReview = async () => {
        try {
            const res = await api.get(`/reviews/${reviewId}`);
            setReview(res.data);
            // If already has answers (draft), load them here. For now, empty.
        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar avaliação');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRating = (competencyId: string, rating: number) => {
        setAnswers(prev => ({
            ...prev,
            [competencyId]: { ...prev[competencyId], rating }
        }));
    };

    const handleComment = (competencyId: string, comment: string) => {
        setAnswers(prev => ({
            ...prev,
            [competencyId]: { ...prev[competencyId], comment }
        }));
    };

    const handleSubmit = async () => {
        // Validate all answered
        const pending = COMPETENCIES.filter(c => !answers[c.id]?.rating);
        if (pending.length > 0) {
            toast.error(`Por favor, avalie todas as competências: ${pending.map(p => p.title).join(', ')}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                answers: Object.entries(answers).map(([competency, data]) => ({
                    competency: COMPETENCIES.find(c => c.id === competency)?.title || competency, // Send Title as competency name for now
                    rating: data.rating,
                    comment: data.comment
                }))
            };

            await api.post(`/reviews/${reviewId}/submit`, payload);
            toast.success('Avaliação enviada com sucesso!');
            onComplete();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao enviar avaliação');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Carregando avaliação...</div>;
    if (!review) return <div className="p-8 text-center text-red-500">Avaliação não encontrada.</div>;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </button>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Ciclo</p>
                    <p className="font-bold text-gray-900">{review.cycle?.name}</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8 flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xl">
                    {review.reviewee?.name?.charAt(0)}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{review.reviewee?.name}</h2>
                    <p className="text-gray-500">{review.reviewee?.role} • {review.type === 'SELF' ? 'Autoavaliação' : 'Avaliação de Gestor'}</p>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
                {COMPETENCIES.map((comp) => (
                    <div key={comp.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{comp.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">{comp.description}</p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Classificação</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => handleRating(comp.id, star)}
                                        className={`p-2 rounded-lg transition-all ${(answers[comp.id]?.rating || 0) >= star
                                                ? 'text-yellow-400 bg-yellow-50'
                                                : 'text-gray-300 hover:text-gray-400'
                                            }`}
                                    >
                                        <Star className={`h-8 w-8 ${(answers[comp.id]?.rating || 0) >= star ? 'fill-current' : ''}`} />
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-1 px-1 max-w-xs">
                                <span>Precisa Melhorar</span>
                                <span>Excelente</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Comentários / Evidências</label>
                            <textarea
                                className="input-field"
                                rows={3}
                                placeholder="Cite exemplos..."
                                value={answers[comp.id]?.comment || ''}
                                onChange={(e) => handleComment(comp.id, e.target.value)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Action */}
            <div className="mt-8 flex justify-end p-4 bg-gray-50 rounded-xl border border-gray-100">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="btn-primary flex items-center gap-2 px-8 py-3 text-lg"
                >
                    <Save className="h-5 w-5" />
                    {isSubmitting ? 'Enviando...' : 'Finalizar Avaliação'}
                </button>
            </div>
        </div>
    );
};

export default ReviewForm;
