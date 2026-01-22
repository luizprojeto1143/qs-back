import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, CheckCircle, ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface Option {
    id?: string;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    text: string;
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
    options: Option[];
}

interface Quiz {
    id: string;
    title: string;
    description: string;
    minScore: number;
    questions: Question[];
}

interface QuizEditorProps {
    quizId: string;
    onClose: () => void;
}

const QuizEditor = ({ quizId, onClose }: QuizEditorProps) => {
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionType] = useState<'MULTIPLE_CHOICE' | 'TRUE_FALSE'>('MULTIPLE_CHOICE');
    const [newOptions, setNewOptions] = useState<Option[]>([
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
    ]);

    useEffect(() => {
        fetchQuiz();
    }, [quizId]);

    const fetchQuiz = async () => {
        try {
            const response = await api.get(`/quizzes/${quizId}/editor`);
            setQuiz(response.data);
        } catch (error) {
            console.error('Error fetching quiz', error);
            toast.error('Erro ao carregar prova');
        } finally {
            setLoading(false);
        }
    };

    const handleAddOption = () => {
        setNewOptions([...newOptions, { text: '', isCorrect: false }]);
    };

    const handleRemoveOption = (index: number) => {
        if (newOptions.length <= 2) return;
        setNewOptions(newOptions.filter((_, i) => i !== index));
    };

    const handleOptionChange = (index: number, field: keyof Option, value: string | boolean) => {
        const updatedOptions = [...newOptions];
        if (field === 'text') {
            updatedOptions[index].text = value as string;
        } else if (field === 'isCorrect') {
            updatedOptions[index].isCorrect = value as boolean;
        }

        // Ensure only one correct answer for now (can be expanded later)
        if (field === 'isCorrect' && value === true) {
            updatedOptions.forEach((opt, i) => {
                if (i !== index) opt.isCorrect = false;
            });
        }

        setNewOptions(updatedOptions);
    };

    const handleAddQuestion = async () => {
        if (!newQuestionText.trim()) {
            toast.error('Digite o enunciado da questão');
            return;
        }

        const correctOption = newOptions.find(o => o.isCorrect);
        if (!correctOption) {
            toast.error('Selecione uma alternativa correta');
            return;
        }

        if (newOptions.some(o => !o.text.trim())) {
            toast.error('Preencha todas as alternativas');
            return;
        }

        try {
            await api.post('/quizzes/questions', {
                quizId,
                text: newQuestionText,
                type: newQuestionType,
                options: newOptions
            });

            toast.success('Questão adicionada!');
            setNewQuestionText('');
            setNewOptions([
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ]);
            fetchQuiz();
        } catch (error) {
            console.error('Error adding question', error);
            toast.error('Erro ao adicionar questão');
        }
    };

    const handleDeleteQuestion = async (questionId: string) => {
        if (!confirm('Tem certeza que deseja remover esta questão?')) return;
        try {
            await api.delete(`/quizzes/questions/${questionId}`);
            toast.success('Questão removida');
            fetchQuiz();
        } catch (error) {
            console.error('Error deleting question', error);
            toast.error('Erro ao remover questão');
        }
    };

    if (loading) return <div className="p-6 text-center">Carregando editor...</div>;
    if (!quiz) return <div className="p-6 text-center">Prova não encontrada</div>;

    return (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Editor de Prova: {quiz.title}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{quiz.description} • Nota Mínima: {quiz.minScore}%</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Add Question Form */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 h-fit">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Plus className="h-5 w-5 text-blue-600" />
                            Nova Questão
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enunciado</label>
                                <textarea
                                    className="input-field w-full min-h-[100px]"
                                    placeholder="Digite a pergunta aqui..."
                                    value={newQuestionText}
                                    onChange={e => setNewQuestionText(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alternativas</label>
                                <div className="space-y-3">
                                    {newOptions.map((option, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleOptionChange(idx, 'isCorrect', !option.isCorrect)}
                                                className={`p-2 rounded-lg transition-colors ${option.isCorrect ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                                                title={option.isCorrect ? "Resposta Correta" : "Marcar como Correta"}
                                            >
                                                <CheckCircle className="h-5 w-5" />
                                            </button>
                                            <input
                                                className="input-field flex-1"
                                                placeholder={`Opção ${idx + 1}`}
                                                value={option.text}
                                                onChange={e => handleOptionChange(idx, 'text', e.target.value)}
                                            />
                                            {newOptions.length > 2 && (
                                                <button onClick={() => handleRemoveOption(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleAddOption} className="mt-3 text-sm text-blue-600 hover:underline flex items-center gap-1">
                                    <Plus className="h-3 w-3" /> Adicionar Alternativa
                                </button>
                            </div>

                            <button onClick={handleAddQuestion} className="btn-primary w-full flex items-center justify-center gap-2 mt-4">
                                <Save className="h-4 w-4" />
                                Salvar Questão
                            </button>
                        </div>
                    </div>

                    {/* Right: Existing Questions List */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-between">
                            Questões Cadastradas
                            <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                {quiz.questions.length}
                            </span>
                        </h2>

                        {quiz.questions.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                Nenhuma questão cadastrada ainda.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {quiz.questions.map((q, idx) => (
                                    <div key={q.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                <span className="text-gray-400 mr-2">#{idx + 1}</span>
                                                {q.text}
                                            </h3>
                                            <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="space-y-1 ml-6">
                                            {q.options.map(opt => (
                                                <div key={opt.id} className={`flex items-center gap-2 text-sm ${opt.isCorrect ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                                                    {opt.isCorrect ? <CheckCircle className="h-3 w-3" /> : <div className="w-3" />}
                                                    {opt.text}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizEditor;
