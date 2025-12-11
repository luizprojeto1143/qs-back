import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ChevronLeft, Play, CheckCircle, Menu } from 'lucide-react';
import { toast } from 'sonner';

interface Lesson {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    duration: number;
    progress: { completed: boolean }[];
}

interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
}

interface Course {
    id: string;
    title: string;
    modules: Module[];
}

const CoursePlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${id}`);
                setCourse(response.data);

                // Find first uncompleted lesson or just the first one
                const modules = response.data.modules;
                if (modules.length > 0 && modules[0].lessons.length > 0) {
                    // Logic to find first uncompleted could go here
                    setCurrentLesson(modules[0].lessons[0]);
                }
            } catch (error) {
                console.error('Error fetching course', error);
                toast.error('Erro ao carregar curso');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchCourse();
    }, [id]);

    const handleLessonComplete = async (lessonId: string) => {
        try {
            await api.post('/progress', {
                lessonId,
                completed: true
            });

            // Update local state
            if (course) {
                const updatedModules = course.modules.map(m => ({
                    ...m,
                    lessons: m.lessons.map(l => {
                        if (l.id === lessonId) {
                            return { ...l, progress: [{ completed: true }] };
                        }
                        return l;
                    })
                }));
                setCourse({ ...course, modules: updatedModules });

                // Also update currentLesson if it's the one we just completed
                if (currentLesson && currentLesson.id === lessonId) {
                    setCurrentLesson({ ...currentLesson, progress: [{ completed: true }] });
                }
            }
            toast.success('Aula concluída!');

            // Auto-advance logic could go here
        } catch (error) {
            console.error('Error updating progress', error);
        }
    };

    if (loading) return <div className="p-6 text-center">Carregando...</div>;
    if (!course) return <div className="p-6 text-center">Curso não encontrado</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] md:flex-row bg-gray-100 dark:bg-gray-900">
            {/* Main Content (Video) */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="font-bold text-gray-900 dark:text-white truncate">{course.title}</h1>
                    <button
                        className="md:hidden ml-auto p-2"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    {currentLesson ? (
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                                <iframe
                                    src={currentLesson.videoUrl.replace('watch?v=', 'embed/')}
                                    className="w-full h-full"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{currentLesson.title}</h2>
                                    <p className="text-gray-600 dark:text-gray-300">{currentLesson.description}</p>
                                </div>
                                <button
                                    onClick={() => handleLessonComplete(currentLesson.id)}
                                    className={`btn-primary flex items-center gap-2 ${currentLesson.progress?.[0]?.completed ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    {currentLesson.progress?.[0]?.completed ? 'Concluída' : 'Marcar como Vista'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Selecione uma aula para começar
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar (Lessons) */}
            <div className={`${sidebarOpen ? 'w-full md:w-80' : 'w-0'} transition-all duration-300 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden absolute md:relative z-10 h-full`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white">
                    Conteúdo do Curso
                </div>
                <div className="flex-1 overflow-y-auto">
                    {course.modules.map((module, mIndex) => (
                        <div key={module.id} className="border-b border-gray-100 dark:border-gray-700">
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 font-medium text-sm text-gray-700 dark:text-gray-300">
                                Módulo {mIndex + 1}: {module.title}
                            </div>
                            <div>
                                {module.lessons.map((lesson, lIndex) => {
                                    const isCompleted = lesson.progress?.[0]?.completed;
                                    const isActive = currentLesson?.id === lesson.id;

                                    return (
                                        <button
                                            key={lesson.id}
                                            onClick={() => {
                                                setCurrentLesson(lesson);
                                                if (window.innerWidth < 768) setSidebarOpen(false);
                                            }}
                                            className={`w-full text-left p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''}`}
                                        >
                                            <div className={`mt-0.5 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`}>
                                                {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                    {lIndex + 1}. {lesson.title}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">{lesson.duration} min</div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CoursePlayer;
