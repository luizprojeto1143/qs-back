import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import QuizEditor from './QuizEditor';
import type { Course } from '../../types/university';
import { CourseList } from '../../components/master/university/CourseList';
import { CourseFormModal } from '../../components/master/university/CourseFormModal';
import { ModuleFormModal } from '../../components/master/university/ModuleFormModal';
import { LessonFormModal } from '../../components/master/university/LessonFormModal';

const UniversityManagement = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

    // Modals
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showQuizEditor, setShowQuizEditor] = useState(false);

    // Context IDs
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

    const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        fetchCourses();
        fetchCompanies();
    }, []);

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            setCourses(response.data);
        } catch {
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

    const handleCreateCourse = async (data: any) => {
        try {
            await api.post('/courses', data);
            toast.success('Curso criado com sucesso!');
            setShowCourseModal(false);
            fetchCourses();
        } catch {
            toast.error('Erro ao criar curso');
        }
    };

    const handleCreateModule = async (data: { title: string, order: number }) => {
        if (!selectedCourseId) return;
        try {
            await api.post('/modules', { ...data, courseId: selectedCourseId });
            toast.success('Módulo criado com sucesso!');
            setShowModuleModal(false);
            fetchCourses();
        } catch {
            toast.error('Erro ao criar módulo');
        }
    };

    const handleCreateLesson = async (data: any, attachments: any[]) => {
        if (!selectedModuleId) return;
        try {
            await api.post('/lessons', { ...data, moduleId: selectedModuleId, attachments });
            toast.success('Aula criada com sucesso!');
            setShowLessonModal(false);
            fetchCourses();
        } catch {
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
        } catch {
            toast.error('Erro ao criar prova');
        }
    };

    const handleDeleteCourse = async (id: string) => {
        if (!confirm('Tem certeza? Isso apagará todo o conteúdo do curso.')) return;
        try {
            await api.delete(`/courses/${id}`);
            toast.success('Curso removido!');
            fetchCourses();
        } catch {
            toast.error('Erro ao remover curso');
        }
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

            <CourseList
                courses={courses}
                expandedCourse={expandedCourse}
                setExpandedCourse={setExpandedCourse}
                onDeleteCourse={handleDeleteCourse}
                onAddModule={(id) => { setSelectedCourseId(id); setShowModuleModal(true); }}
                onAddLesson={(id) => { setSelectedModuleId(id); setShowLessonModal(true); }}
                onCreateQuiz={handleCreateQuiz}
                onEditQuiz={(id) => { setSelectedQuizId(id); setShowQuizEditor(true); }}
            />

            <CourseFormModal
                isOpen={showCourseModal}
                onClose={() => setShowCourseModal(false)}
                onSubmit={handleCreateCourse}
                companies={companies}
            />

            <ModuleFormModal
                isOpen={showModuleModal}
                onClose={() => setShowModuleModal(false)}
                onSubmit={handleCreateModule}
            />

            <LessonFormModal
                isOpen={showLessonModal}
                onClose={() => setShowLessonModal(false)}
                onSubmit={handleCreateLesson}
            />
        </div>
    );
};

export default UniversityManagement;
