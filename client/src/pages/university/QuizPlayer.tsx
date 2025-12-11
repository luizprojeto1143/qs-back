import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ChevronLeft, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Accessibility } from 'lucide-react';
import { toast } from 'sonner';

interface Option {
    id: string;
    text: string;
}

interface Question {
    id: string;
    text: string;
    type: string;
    options: Option[];
}

interface Quiz {
    id: string;
    title: string;
    description: string;
    questions: Question[];
    minScore: number;
}

const QuizPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

    // Accessibility State
    const [highContrast, setHighContrast] = useState(false);
    const [largeText, setLargeText] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await api.get(`/quizzes/${id}`);
                setQuiz(response.data);
            } catch (error) {
                console.error('Error fetching quiz', error);
                toast.error('Erro ao carregar prova');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchQuiz();
    }, [id]);

    const handleOptionSelect = (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleSubmit = async () => {
        if (!quiz) return;

        // Check if all questions answered (optional, user said "pular sem travar")
        // But for submission, usually we warn.
        const answeredCount = Object.keys(answers).length;
        if (answeredCount < quiz.questions.length) {
            const confirm = window.confirm(`Você respondeu ${answeredCount} de ${quiz.questions.length} perguntas. Deseja enviar mesmo assim?`);
            if (!confirm) return;
        }

        setSubmitting(true);
        try {
            const payload = {
                answers: Object.entries(answers).map(([qId, oId]) => ({
                    questionId: qId,
                    optionId: oId
                }))
            };

            const response = await api.post(`/quizzes/${id}/submit`, payload);
            setResult(response.data);

            if (response.data.passed) {
                toast.success('Parabéns! Você foi aprovado!');
            } else {
                toast.error('Você não atingiu a nota mínima. Tente novamente.');
            }
        } catch (error) {
            console.error('Error submitting quiz', error);
            toast.error('Erro ao enviar respostas');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-6 text-center">Carregando prova...</div>;
    if (!quiz) return <div className="p-6 text-center">Prova não encontrada</div>;

    if (result) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className={`mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6 ${result.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {result.passed ? <CheckCircle className="h-10 w-10" /> : <AlertCircle className="h-10 w-10" />}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {result.passed ? 'Aprovado!' : 'Não foi dessa vez'}
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        Sua nota: <span className="font-bold text-lg">{result.score}%</span>
                        <br />
                        Mínimo para aprovação: {quiz.minScore}%
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full btn-primary"
                        >
                            Voltar ao Curso
                        </button>
                        {!result.passed && (
                            <button
                                onClick={() => { setResult(null); setAnswers({}); setCurrentQuestionIndex(0); }}
                                className="w-full btn-secondary"
                            >
                                Tentar Novamente
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

    return (
        <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col ${highContrast ? 'contrast-more' : ''}`}>
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className={`font-bold text-gray-900 dark:text-white ${largeText ? 'text-xl' : 'text-lg'}`}>{quiz.title}</h1>
                        <p className="text-xs text-gray-500">Questão {currentQuestionIndex + 1} de {quiz.questions.length}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setLargeText(!largeText)}
                        className={`p-2 rounded-lg ${largeText ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                        title="Aumentar Texto"
                    >
                        <span className="text-lg font-bold">AA</span>
                    </button>
                    <button
                        onClick={() => setHighContrast(!highContrast)}
                        className={`p-2 rounded-lg ${highContrast ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                        title="Alto Contraste"
                    >
                        <Accessibility className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 max-w-3xl mx-auto w-full p-4 md:p-8 flex flex-col justify-center">
                <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 md:p-10 ${highContrast ? 'border-2 border-black' : ''}`}>
                    <h2 className={`font-bold text-gray-900 dark:text-white mb-8 ${largeText ? 'text-3xl' : 'text-xl'}`}>
                        {currentQuestion.text}
                    </h2>

                    <div className="space-y-4">
                        {currentQuestion.options.map(option => {
                            const isSelected = answers[currentQuestion.id] === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                                        } ${largeText ? 'text-xl p-6' : 'text-base'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                                            }`}>
                                            {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                                        </div>
                                        <span className="text-gray-800 dark:text-gray-200">{option.text}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                    >
                        <ArrowLeft className="h-4 w-4" /> Anterior
                    </button>

                    {isLastQuestion ? (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                            {submitting ? 'Enviando...' : 'Finalizar Prova'}
                            <CheckCircle className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(quiz.questions.length - 1, prev + 1))}
                            className="btn-primary flex items-center gap-2"
                        >
                            Próxima <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mt-8">
                    {quiz.questions.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 w-2 rounded-full transition-colors ${idx === currentQuestionIndex
                                    ? 'bg-blue-600 scale-125'
                                    : answers[quiz.questions[idx].id]
                                        ? 'bg-blue-300'
                                        : 'bg-gray-300 dark:bg-gray-700'
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuizPlayer;
