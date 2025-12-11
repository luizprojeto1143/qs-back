import { useState, useEffect } from 'react';
import { Plus, Trash2, Video, BookOpen, Layers, ChevronRight, ChevronDown } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface Course {
    id: string;
    title: string;
    description: string;
    duration: number;
    category: string;
    active: boolean;
    modules: Module[];
}

interface Module {
    id: string;
    title: string;
    order: number;
    lessons: Lesson[];
}

interface Lesson {
    id: string;
    title: string;
    duration: number;
    videoUrl: string;
}

const UniversityManagement = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

    // Modals
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);

    // Form States
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

    const [courseForm, setCourseForm] = useState({ title: '', description: '', category: '', duration: 0 });
    const [moduleForm, setModuleForm] = useState({ title: '', order: 1 });
    const [lessonForm, setLessonForm] = useState({ title: '', description: '', videoUrl: '', duration: 0, order: 1 });

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

    useEffect(() => {
        fetchCourses();
    }, []);

    const handleCreateCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/courses', courseForm);
            toast.success('Curso criado com sucesso!');
            setShowCourseModal(false);
            setCourseForm({ title: '', description: '', category: '', duration: 0 });
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
            await api.post('/lessons', { ...lessonForm, moduleId: selectedModuleId });
            toast.success('Aula criada com sucesso!');
            setShowLessonModal(false);
            setLessonForm({ title: '', description: '', videoUrl: '', duration: 0, order: 1 });
            fetchCourses();
        } catch (error) {
            toast.error('Erro ao criar aula');
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

    if (loading) return <div>Carregando...</div>;

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
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
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
