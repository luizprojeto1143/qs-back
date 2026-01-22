import { BookOpen, Video, Trash2, ChevronDown, ChevronRight, Layers, FileText, Edit } from 'lucide-react';
import type { Course } from '../../../types/university';

interface CourseListProps {
    courses: Course[];
    expandedCourse: string | null;
    setExpandedCourse: (id: string | null) => void;
    onDeleteCourse: (id: string) => void;
    onEditCourse: (course: Course) => void;
    onAddModule: (courseId: string) => void;
    onDeleteModule: (moduleId: string) => void;
    onAddLesson: (moduleId: string) => void;
    onDeleteLesson: (lessonId: string) => void;
    onCreateQuiz: (moduleId: string, courseId: string) => void;
    onEditQuiz: (quizId: string) => void;
}

export const CourseList = ({
    courses,
    expandedCourse,
    setExpandedCourse,
    onDeleteCourse,
    onEditCourse,
    onAddModule,
    onDeleteModule,
    onAddLesson,
    onDeleteLesson,
    onCreateQuiz,
    onEditQuiz
}: CourseListProps) => {
    return (
        <div className="grid gap-6">
            {courses.map(course => (
                <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start gap-4">
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
                                    {course.visibleToAll ? (
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
                                onClick={() => onAddModule(course.id)}
                                className="btn-secondary text-xs"
                            >
                                + Módulo
                            </button>
                            <button onClick={() => onEditCourse(course)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" aria-label="Editar curso">
                                <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => onDeleteCourse(course.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" aria-label="Excluir curso">
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                                className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
                                aria-label={expandedCourse === course.id ? "Recolher detalhes do curso" : "Expandir detalhes do curso"}
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
                                        <div className="flex gap-3 items-center">
                                            {module.quizzes && module.quizzes.length > 0 ? (
                                                <button
                                                    onClick={() => onEditQuiz(module.quizzes[0].id)}
                                                    className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    Editar Prova
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onCreateQuiz(module.id, course.id)}
                                                    className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    Criar Prova
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onAddLesson(module.id)}
                                                className="text-xs text-blue-600 hover:underline"
                                            >
                                                + Adicionar Aula
                                            </button>
                                            <button
                                                onClick={() => onDeleteModule(module.id)}
                                                className="text-xs text-red-500 hover:text-red-700"
                                                title="Excluir módulo"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                                        {module.lessons?.map(lesson => (
                                            <div key={lesson.id} className="flex justify-between items-center text-sm group py-1">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <Video className="h-3 w-3" />
                                                    <span>{lesson.title}</span>
                                                    <span className="text-xs text-gray-400">({lesson.duration} min)</span>
                                                </div>
                                                <button
                                                    onClick={() => onDeleteLesson(lesson.id)}
                                                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Excluir aula"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
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
    );
};
