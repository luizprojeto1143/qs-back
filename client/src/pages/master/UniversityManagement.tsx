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
import { CourseContentManager } from '../../components/master/university/CourseContentManager';

interface CourseFormData {
    title: string;
    description: string;
    coverUrl?: string;
    duration?: number;
    category?: string;
    difficulty?: string;
    companyId?: string;
}

interface LessonFormData {
    title: string;
    contentType: string;
    contentUrl?: string;
    duration?: number;
    order?: number;
}

interface Attachment {
    name: string;
    url: string;
    type: string;
}

const UniversityManagement = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);


    // Modals
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showQuizEditor, setShowQuizEditor] = useState(false);

    // Content Management
    const [courseToManage, setCourseToManage] = useState<Course | null>(null);

    // Context IDs
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

    const [companies, setCompanies] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        fetchCourses();
        fetchCompanies();
    }, []);

    // ... (fetch functions remain same)

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses');
            setCourses(response.data);

            // If we are managing a course, refresh its data too
            if (courseToManage) {
                const updated = response.data.find((c: Course) => c.id === courseToManage.id);
                if (updated) setCourseToManage(updated);
            }
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

    const handleCreateCourse = async (data: CourseFormData) => {
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
        const cId = selectedCourseId || courseToManage?.id;
        if (!cId) return;

        try {
            await api.post('/modules', { ...data, courseId: cId });
            toast.success('Módulo criado com sucesso!');
            setShowModuleModal(false);
            fetchCourses();
        } catch {
            toast.error('Erro ao criar módulo');
        }
    };

    const handleCreateLesson = async (data: LessonFormData, attachments: Attachment[]) => {
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
            if (courseToManage?.id === id) setCourseToManage(null);
            fetchCourses();
        } catch {
            toast.error('Erro ao remover curso');
        }
    };

    const handleEditCourse = (course: Course) => {
        toast.info(`Editar curso: ${course.title}`);
        // TODO: Implement edit course modal
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm('Tem certeza? Isso apagará todas as aulas deste módulo.')) return;
        try {
            await api.delete(`/modules/${moduleId}`);
            toast.success('Módulo removido!');
            fetchCourses();
        } catch {
            toast.error('Erro ao remover módulo');
        }
    };

    // Stub for Edit Module - to be implemented
    const handleEditModule = (module: { title: string }) => {
        toast.info(`Editar módulo: ${module.title}`);
    };

    const handleDeleteLesson = async (lessonId: string) => {
        if (!confirm('Tem certeza que deseja excluir esta aula?')) return;
        try {
            await api.delete(`/lessons/${lessonId}`);
            toast.success('Aula removida!');
            fetchCourses();
        } catch {
            toast.error('Erro ao remover aula');
        }
    };

    // Stub for Edit Lesson - to be implemented
    const handleEditLesson = (lesson: { title: string }) => {
        toast.info(`Editar aula: ${lesson.title}`);
    };

    if (loading) return <div>Carregando...</div>;

    if (showQuizEditor && selectedQuizId) {
        return <QuizEditor quizId={selectedQuizId} onClose={() => { setShowQuizEditor(false); fetchCourses(); }} />;
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Universidade Corporativa</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie seus cursos, verifique o progresso dos alunos e crie trilhas de aprendizado.</p>
                </div>
                <button
                    onClick={() => setShowCourseModal(true)}
                    className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg hover:shadow-xl transition-all"
                >
                    <Plus className="h-5 w-5" /> Novo Curso
                </button>
            </div>

            {/* Stats Cards (Optional Future) */}

            {/* Course Grid */}
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Seus Cursos</h2>
                    <div className="flex gap-2">
                        {/* Filters could go here */}
                    </div>
                </div>

                <CourseList
                    courses={courses}
                    onDeleteCourse={handleDeleteCourse}
                    onEditCourse={handleEditCourse}
                    onManageContent={(course) => setCourseToManage(course)}
                />
            </div>

            {/* Management Drawer */}
            {courseToManage && (
                <CourseContentManager
                    course={courseToManage}
                    onClose={() => setCourseToManage(null)}
                    onAddModule={(courseId: string) => { setSelectedCourseId(courseId); setShowModuleModal(true); }}
                    onDeleteModule={handleDeleteModule}
                    onEditModule={handleEditModule}
                    onAddLesson={(moduleId: string) => { setSelectedModuleId(moduleId); setShowLessonModal(true); }}
                    onDeleteLesson={handleDeleteLesson}
                    onEditLesson={handleEditLesson}
                    onCreateQuiz={handleCreateQuiz}
                    onEditQuiz={(id: string) => { setSelectedQuizId(id); setShowQuizEditor(true); }}
                />
            )}

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
