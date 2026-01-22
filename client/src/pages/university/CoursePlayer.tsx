import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { ChevronLeft, CheckCircle, Menu, FileText, Download, Award } from 'lucide-react';
import { toast } from 'sonner';
import { VideoPlayer } from './components/VideoPlayer';
import { TranscriptViewer } from './components/TranscriptViewer';
import { AccessibilityControls } from './components/AccessibilityControls';
import { LessonComments } from './components/LessonComments';

interface Attachment {
    id: string;
    name: string;
    url: string;
    type: string;
}

interface Lesson {
    id: string;
    title: string;
    description: string;
    videoUrl: string;
    duration: number;
    transcription?: string;
    progress: { completed: boolean }[];
    attachments: Attachment[];
}

interface Quiz {
    id: string;
    title: string;
    description: string;
}

interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
    quizzes: Quiz[];
}

interface Course {
    id: string;
    title: string;
    modules: Module[];
    quizzes: Quiz[];
}

const CoursePlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState<'video' | 'materials' | 'transcript'>('video');

    // New Feature: Focus Mode
    const [focusMode, setFocusMode] = useState(false);

    // Accessibility Features
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
    const [highContrast, setHighContrast] = useState(false);

    // Font size classes
    const fontSizeClasses = {
        small: 'text-sm',
        medium: 'text-base',
        large: 'text-lg'
    };

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/${id}`);
                setCourse(response.data);

                // Find first uncompleted lesson or just the first one
                const modules = response.data.modules;
                if (modules.length > 0) {
                    // Simple logic to find first lesson for now
                    if (modules[0].lessons.length > 0) {
                        setCurrentLesson(modules[0].lessons[0]);
                    }
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

    // Handle Focus Mode side effects
    useEffect(() => {
        if (focusMode) {
            setSidebarOpen(false);
        } else {
            setSidebarOpen(true);
        }
    }, [focusMode]);

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

                if (currentLesson && currentLesson.id === lessonId) {
                    setCurrentLesson({ ...currentLesson, progress: [{ completed: true }] });
                }
            }
            toast.success('Aula concluída!');
        } catch (error) {
            console.error('Error updating progress', error);
        }
    };

    const isModuleCompleted = (moduleId: string) => {
        const module = course?.modules.find(m => m.id === moduleId);
        if (!module) return false;
        return module.lessons.every(l => l.progress?.[0]?.completed);
    };

    if (loading) return <div className="p-6 text-center">Carregando...</div>;
    if (!course) return <div className="p-6 text-center">Curso não encontrado</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] md:flex-row bg-gray-100 dark:bg-gray-900">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300">

                {/* Header within Player */}
                <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 ${focusMode ? 'hidden' : ''}`}>
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="font-bold text-gray-900 dark:text-white truncate">{course.title}</h1>

                    <div className="ml-auto flex items-center gap-2">
                        <AccessibilityControls
                            focusMode={focusMode}
                            setFocusMode={setFocusMode}
                            fontSize={fontSize}
                            setFontSize={setFontSize}
                            highContrast={highContrast}
                            setHighContrast={setHighContrast}
                        />

                        <button
                            className="md:hidden p-2"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Focus Mode Exit Bar */}
                {focusMode && (
                    <div className="bg-black/90 text-white px-4 py-2 flex justify-between items-center text-sm">
                        <span>Modo Foco Ativo</span>
                        <AccessibilityControls
                            focusMode={focusMode}
                            setFocusMode={setFocusMode}
                            fontSize={fontSize}
                            setFontSize={setFontSize}
                            highContrast={highContrast}
                            setHighContrast={setHighContrast}
                        />
                    </div>
                )}

                <div className={`flex-1 overflow-y-auto p-4 md:p-6 ${fontSizeClasses[fontSize]} ${highContrast ? 'bg-black text-white' : ''}`}>
                    {currentLesson ? (
                        <div className={`mx-auto space-y-6 transition-all duration-500 ${focusMode ? 'max-w-6xl' : 'max-w-4xl'} ${highContrast ? 'bg-black' : ''}`}>

                            {/* Tabs (Hidden in Focus Mode for cleaner UI, or kept? Let's keep for now but simplify) */}
                            {!focusMode && (
                                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                                    <button
                                        onClick={() => setActiveTab('video')}
                                        className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'video' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Vídeo Aula
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('materials')}
                                        className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'materials' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Materiais Extras
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('transcript')}
                                        className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'transcript' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Transcrição / Legendas
                                    </button>
                                </div>
                            )}

                            {activeTab === 'video' && (
                                <>
                                    <VideoPlayer
                                        url={currentLesson.videoUrl}
                                        title={currentLesson.title}
                                        onEnded={() => handleLessonComplete(currentLesson.id)}
                                    />

                                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{currentLesson.title}</h2>
                                            <p className="text-gray-600 dark:text-gray-300">{currentLesson.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleLessonComplete(currentLesson.id)}
                                            className={`btn-primary flex items-center gap-2 whitespace-nowrap ${currentLesson.progress?.[0]?.completed ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                        >
                                            <CheckCircle className="h-4 w-4" />
                                            {currentLesson.progress?.[0]?.completed ? 'Concluída' : 'Marcar como Vista'}
                                        </button>
                                    </div>
                                </>
                            )}

                            {activeTab === 'materials' && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Materiais de Apoio
                                    </h3>
                                    {currentLesson.attachments && currentLesson.attachments.length > 0 ? (
                                        <div className="space-y-3">
                                            {currentLesson.attachments.map(att => (
                                                <a
                                                    key={att.id}
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{att.name}</p>
                                                            <p className="text-xs text-gray-500 uppercase">{att.type}</p>
                                                        </div>
                                                    </div>
                                                    <Download className="h-4 w-4 text-gray-400" />
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-center py-8">Nenhum material extra disponível para esta aula.</p>
                                    )}
                                </div>
                            )}

                            {/* Transcript is now an integrated component */}
                            {activeTab === 'transcript' && (
                                <TranscriptViewer text={currentLesson.transcription} />
                            )}

                            {/* Social Learning: Comments Section */}
                            {!focusMode && (
                                <LessonComments lessonId={currentLesson.id} />
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            Selecione uma aula para começar
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar (Lessons) - Hidden in Focus Mode unless explicitly toggled (UX decision: Focus Mode hides sidebar) */}
            <div className={`${sidebarOpen && !focusMode ? 'w-full md:w-80' : 'w-0'} transition-all duration-300 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden absolute md:relative z-10 h-full`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white flex justify-between items-center">
                    <span>Conteúdo do Curso</span>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {course.modules.map((module, mIndex) => {
                        const moduleCompleted = isModuleCompleted(module.id);
                        return (
                            <div key={module.id} className="border-b border-gray-100 dark:border-gray-700">
                                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center">
                                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                        Módulo {mIndex + 1}: {module.title}
                                    </span>
                                    {moduleCompleted && (
                                        <div title="Módulo Concluído">
                                            <Award className="h-4 w-4 text-yellow-500" />
                                        </div>
                                    )}
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
                                                    <CheckCircle className={`h-4 w-4 ${isCompleted ? 'fill-green-500 text-white' : ''}`} />
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
                                {module.quizzes && module.quizzes.length > 0 && (
                                    <button
                                        onClick={() => navigate(`/app/university/quiz/${module.quizzes[0].id}`)}
                                        className="w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-blue-600 dark:text-blue-400 border-t border-gray-100 dark:border-gray-700"
                                    >
                                        <div className="mt-0.5 text-blue-500">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">Prova do Módulo</div>
                                            <div className="text-xs text-gray-500 mt-1 opacity-70">Avaliação de conhecimento</div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CoursePlayer;
