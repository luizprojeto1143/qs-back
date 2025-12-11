import { useState, useEffect } from 'react';
import { Plus, Trash2, Video, BookOpen, Layers, ChevronRight, ChevronDown, Upload, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface Course {
    id: string;
    title: string;
    description: string;
    duration: number;
    category: string;
    active: boolean;
    isMandatory: boolean;
    publishedAt: string | null;
    modules: Module[];
}

import QuizEditor from './QuizEditor';

interface Quiz {
    id: string;
    title: string;
}

interface Module {
    id: string;
    title: string;
    order: number;
    lessons: Lesson[];
    quizzes: Quiz[];
}

interface Lesson {
    id: string;
    title: string;
    duration: number;
    videoUrl: string;
    attachments: { name: string; url: string; type: string }[];
}

const UniversityManagement = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

    // Modals
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showQuizEditor, setShowQuizEditor] = useState(false);

    // Form States
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

    const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);
    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        coverUrl: '',
        category: '',
        duration: 0,
        isMandatory: false,
        publishedAt: '',
        visibleToAll: false,
        allowedCompanyIds: [] as string[]
    });
    const [moduleForm, setModuleForm] = useState({ title: '', order: 1 });
    const [lessonForm, setLessonForm] = useState({ title: '', description: '', videoUrl: '', transcription: '', duration: 0, order: 1 });
    const [attachments, setAttachments] = useState<{ name: string, url: string, type: string }[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload', formData);
            setAttachments([...attachments, {
                name: file.name,
                url: response.data.url,
                type: file.type.includes('pdf') ? 'PDF' : 'OTHER'
            }]);
            toast.success('Arquivo enviado!');
        } catch (error) {
            toast.error('Erro no upload');
        } finally {
            setUploading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses', error);
            toast.error('Erro ao carregar cursos');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const response = await api.get('/companies');
            setCompanies(response.data);
        } catch (error) {
            console.error('Error fetching companies', error);
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchCompanies();
    }, []);

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/courses', courseForm);
            toast.success('Curso criado com sucesso!');
            setShowCourseModal(false);
            setCourseForm({
                title: '', description: '', coverUrl: '', category: '', duration: 0, isMandatory: false, publishedAt: '',
                visibleToAll: false, allowedCompanyIds: []
            });
            fetchCourses();
        } catch (error) {
            toast.error('Erro ao criar curso');
        }
    };

    const handleCreateModule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCourseId) return;
        try {
            await api.post('/modules', { ...moduleForm, courseId: selectedCourseId });
            toast.success('Módulo criado com sucesso!');
            setShowModuleModal(false);
            setModuleForm({ title: '', order: 1 });
            fetchCourses();
        } catch (error) {
            toast.error('Erro ao criar módulo');
        }
    };

    const handleCreateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModuleId) return;
        try {
            await api.post('/lessons', { ...lessonForm, moduleId: selectedModuleId, attachments });
            toast.success('Aula criada com sucesso!');
            setShowLessonModal(false);
            setLessonForm({ title: '', description: '', videoUrl: '', transcription: '', duration: 0, order: 1 });
            setAttachments([]);
            fetchCourses();
        } catch (error) {
            toast.error('Erro ao criar aula');
        }
    };

    const handleCreateQuiz = async (moduleId: string, courseId: string) => {
        try {
            const response = await api.post('/quizzes', {
                title: 'Prova do Módulo',
                description: 'Avaliação de conhecimento',
                courseId,
                moduleId,
                minScore: 70
            });
            toast.success('Prova criada! Adicione questões.');
            setSelectedQuizId(response.data.id);
            setShowQuizEditor(true);
            fetchCourses();
        } catch (error) {
            toast.error('Erro ao criar prova');
        }
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm('Tem certeza? Isso apagará todo o conteúdo do curso.')) return;
        try {
            await api.delete(`/courses/${id}`);
            toast.success('Curso removido!');
            fetchCourses();
        } catch (error) {
            toast.error('Erro ao remover curso');
        }
    };

    const toggleCompanySelection = (companyId: string) => {
        setCourseForm(prev => {
            const current = prev.allowedCompanyIds || [];
            if (current.includes(companyId)) {
                return { ...prev, allowedCompanyIds: current.filter(id => id !== companyId) };
            } else {
                return { ...prev, allowedCompanyIds: [...current, companyId] };
            }
        });
    };

    if (loading) return <div>Carregando...</div>;

    if (showQuizEditor && selectedQuizId) {
        return <QuizEditor quizId={selectedQuizId} onClose={() => { setShowQuizEditor(false); fetchCourses(); }} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Universidade Corporativa</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gerencie cursos, módulos e aulas.</p>
                </div>
                <button onClick={() => setShowCourseModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Novo Curso
                </button>
            </div>

            <div className="grid gap-6">
                {courses.map(course => (
                    <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg h-fit">
                                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{course.title}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{course.description}</p>
                                    <div className="flex gap-3 mt-3">
                                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                            {course.category}
                                        </span>
                                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                            {course.duration} min
                                        </span>
                                        {(course as any).visibleToAll ? (
                                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                                Todas as Empresas
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                                                Empresas Específicas
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedCourseId(course.id);
                                        setShowModuleModal(true);
                                    }}
                                    className="btn-secondary text-xs"
                                >
                                    + Módulo
                                </button>
                                <button onClick={() => handleDeleteCourse(course.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                                    className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                                >
                                    {expandedCourse === course.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {expandedCourse === course.id && (
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 space-y-4">
                                {course.modules?.map(module => (
                                    <div key={module.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                <Layers className="h-4 w-4 text-gray-400" />
                                                {module.title}
                                            </h4>
                                            <div className="flex gap-3">
                                                {module.quizzes && module.quizzes.length > 0 ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedQuizId(module.quizzes[0].id);
                                                            setShowQuizEditor(true);
                                                        }}
                                                        className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        Editar Prova
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleCreateQuiz(module.id, course.id)}
                                                        className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        Criar Prova
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        setSelectedModuleId(module.id);
                                                        setShowLessonModal(true);
                                                    }}
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    + Adicionar Aula
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                                            {module.lessons?.map(lesson => (
                                                <div key={lesson.id} className="flex justify-between items-center text-sm group">
                                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                        <Video className="h-3 w-3" />
                                                        <span>{lesson.title}</span>
                                                        <span className="text-xs text-gray-400">({lesson.duration} min)</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!module.lessons || module.lessons.length === 0) && (
                                                <p className="text-xs text-gray-400 italic">Nenhuma aula neste módulo.</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(!course.modules || course.modules.length === 0) && (
                                    <p className="text-center text-gray-500 text-sm py-4">Nenhum módulo cadastrado.</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Course Modal */}
            {showCourseModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Novo Curso</h2>
                        <form onSubmit={handleCreateCourse} className="space-y-4">
                            <input
                                className="input-field w-full"
                                placeholder="Título do Curso"
                                value={courseForm.title}
                                onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                                required
                            />
                            <textarea
                                className="input-field w-full"
                                placeholder="Descrição"
                                value={courseForm.description}
                                onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                                required
                            />
                            <input
                                className="input-field w-full"
                                placeholder="URL da Imagem de Capa"
                                value={courseForm.coverUrl}
                                onChange={e => setCourseForm({ ...courseForm, coverUrl: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    className="input-field w-full"
                                    placeholder="Categoria (ex: Inclusão)"
                                    value={courseForm.category}
                                    onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}
                                    required
                                />
                                <input
                                    type="number"
                                    className="input-field w-full"
                                    placeholder="Duração (min)"
                                    value={courseForm.duration}
                                    onChange={e => setCourseForm({ ...courseForm, duration: Number(e.target.value) })}
                                    required
                                />
                            </div>

                            {/* Visibility Settings */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Visibilidade</h3>
                                <label className="flex items-center gap-2 cursor-pointer mb-3">
                                    <input
                                        type="checkbox"
                                        checked={courseForm.visibleToAll}
                                        onChange={e => setCourseForm({ ...courseForm, visibleToAll: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Disponível para todas as empresas</span>
                                </label>

                                {!courseForm.visibleToAll && (
                                    <div className="space-y-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                                        <p className="text-xs text-gray-500 mb-2">Selecione as empresas permitidas:</p>
                                        {companies.map(company => (
                                            <label key={company.id} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={courseForm.allowedCompanyIds.includes(company.id)}
                                                    onChange={() => toggleCompanySelection(company.id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{company.name}</span>
                                            </label>
                                        ))}
                                        {companies.length === 0 && <p className="text-xs text-gray-400">Nenhuma empresa encontrada.</p>}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={courseForm.isMandatory}
                                        onChange={e => setCourseForm({ ...courseForm, isMandatory: e.target.checked })}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Curso Obrigatório</span>
                                </label>
                                <div className="flex-1">
                                    <label className="block text-xs text-gray-500 mb-1">Data de Lançamento (Opcional)</label>
                                    <input
                                        type="datetime-local"
                                        className="input-field w-full"
                                        value={courseForm.publishedAt}
                                        onChange={e => setCourseForm({ ...courseForm, publishedAt: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowCourseModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Criar Curso</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Module Modal */}
            {showModuleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Novo Módulo</h2>
                        <form onSubmit={handleCreateModule} className="space-y-4">
                            <input
                                className="input-field w-full"
                                placeholder="Título do Módulo"
                                value={moduleForm.title}
                                onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                className="input-field w-full"
                                placeholder="Ordem (ex: 1)"
                                value={moduleForm.order}
                                onChange={e => setModuleForm({ ...moduleForm, order: Number(e.target.value) })}
                                required
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowModuleModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Criar Módulo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Lesson Modal */}
            {showLessonModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">Nova Aula</h2>
                        <form onSubmit={handleCreateLesson} className="space-y-4">
                            <input
                                className="input-field w-full"
                                placeholder="Título da Aula"
                                value={lessonForm.title}
                                onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                                required
                            />
                            <input
                                className="input-field w-full"
                                placeholder="URL do Vídeo (YouTube/Vimeo)"
                                value={lessonForm.videoUrl}
                                onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                                required
                            />
                            <textarea
                                className="input-field w-full h-32"
                                placeholder="Transcrição da Aula (Opcional)"
                                value={lessonForm.transcription}
                                onChange={e => setLessonForm({ ...lessonForm, transcription: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="number"
                                    className="input-field w-full"
                                    placeholder="Duração (min)"
                                    value={lessonForm.duration}
                                    onChange={e => setLessonForm({ ...lessonForm, duration: Number(e.target.value) })}
                                    required
                                />
                                <input
                                    type="number"
                                    className="input-field w-full"
                                    placeholder="Ordem"
                                    value={lessonForm.order}
                                    onChange={e => setLessonForm({ ...lessonForm, order: Number(e.target.value) })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material de Apoio (PDFs)</label>
                                <div className="flex items-center gap-2">
                                    <label className="btn-secondary cursor-pointer flex items-center gap-2">
                                        <Upload className="h-4 w-4" />
                                        {uploading ? 'Enviando...' : 'Adicionar Arquivo'}
                                        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} disabled={uploading} />
                                    </label>
                                </div>
                                {attachments.length > 0 && (
                                    <ul className="space-y-1 mt-2">
                                        {attachments.map((att, idx) => (
                                            <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                                <FileText className="h-3 w-3" />
                                                <span className="flex-1 truncate">{att.name}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setShowLessonModal(false)} className="btn-secondary">Cancelar</button>
                                <button type="submit" className="btn-primary">Criar Aula</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversityManagement;
