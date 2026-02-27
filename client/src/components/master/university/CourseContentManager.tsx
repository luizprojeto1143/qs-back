import { useState } from 'react';
import { X, Plus, Trash2, Edit, Video, FileText, ChevronDown, GripVertical, Layers } from 'lucide-react';
import type { Course, Module, Lesson } from '../../../types/university';

interface CourseContentManagerProps {
    course: Course;
    onClose: () => void;
    onAddModule: (courseId: string) => void;
    onDeleteModule: (moduleId: string) => void;
    onEditModule: (module: Module) => void;
    onAddLesson: (moduleId: string) => void;
    onDeleteLesson: (lessonId: string) => void;
    onEditLesson: (lesson: Lesson) => void;
    onCreateQuiz: (moduleId: string, courseId: string) => void;
    onEditQuiz: (quizId: string) => void;
}

export const CourseContentManager = ({
    course,
    onClose,
    onAddModule,
    onDeleteModule,
    onEditModule,
    onAddLesson,
    onDeleteLesson,
    onEditLesson,
    onCreateQuiz,
    onEditQuiz
}: CourseContentManagerProps) => {
    const [expandedModule, setExpandedModule] = useState<string | null>(course.modules?.[0]?.id || null);

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-white dark:bg-gray-900 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{course.title}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gerenciamento de Conteúdo</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
                    <div className="space-y-6">
                        {/* Modules Header */}
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Módulos ({course.modules?.length || 0})</h3>
                            <button
                                onClick={() => onAddModule(course.id)}
                                className="text-sm font-medium text-primary hover:text-blue-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                                <Plus className="h-4 w-4" /> Adicionar Módulo
                            </button>
                        </div>

                        {/* Modules List */}
                        <div className="space-y-4">
                            {course.modules?.map((module, index) => (
                                <div
                                    key={module.id}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                                >
                                    {/* Module Header */}
                                    <div
                                        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors select-none"
                                        onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                                    >
                                        <div className="text-gray-400">
                                            <GripVertical className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white text-base flex items-center gap-2">
                                                {module.title}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{module.lessons?.length || 0} aulas • 20 min</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEditModule(module); }}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar Módulo"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDeleteModule(module.id); }}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir Módulo"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                            <div className={`transform transition-transform duration-200 ${expandedModule === module.id ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Module Content (Lessons) */}
                                    {expandedModule === module.id && (
                                        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                                            {/* Lessons List */}
                                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                                {module.lessons?.map((lesson, idx) => (
                                                    <div key={lesson.id} className="p-3 pl-12 flex items-center gap-3 group hover:bg-white dark:hover:bg-gray-800 transition-colors">
                                                        <div className={`p-2 rounded-lg ${lesson.videoUrl ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                                                            {lesson.videoUrl ? <Video className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 transition-colors">{lesson.title}</p>
                                                            <p className="text-xs text-gray-400">{lesson.duration} min</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => onEditLesson(lesson)}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                                                                title="Editar Aula"
                                                            >
                                                                <Edit className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => onDeleteLesson(lesson.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                                                                title="Excluir Aula"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Quiz Section */}
                                                {module.quizzes?.length > 0 ? (
                                                    <div className="p-3 pl-12 flex items-center gap-3 bg-purple-50/50 dark:bg-purple-900/10 border-l-2 border-purple-500">
                                                        <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-purple-900 dark:text-purple-200">Prova do Módulo</p>
                                                            <p className="text-xs text-purple-600 dark:text-purple-400">{module.quizzes[0].title}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => onEditQuiz(module.quizzes[0].id)}
                                                            className="text-xs font-medium text-purple-700 hover:text-purple-900 px-3 py-1.5 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                                                        >
                                                            Editar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="p-3 pl-12">
                                                        <button
                                                            onClick={() => onCreateQuiz(module.id, course.id)}
                                                            className="text-xs flex items-center gap-1.5 text-purple-600 hover:text-purple-700 font-medium p-2 hover:bg-purple-50 rounded-lg w-full"
                                                        >
                                                            <Plus className="h-3.5 w-3.5" /> Adicionar Prova
                                                        </button>
                                                    </div>
                                                )}

                                                <button
                                                    onClick={() => onAddLesson(module.id)}
                                                    className="w-full text-left p-3 pl-12 text-sm text-gray-500 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 border-t border-gray-100 dark:border-gray-800"
                                                >
                                                    <Plus className="h-4 w-4" /> Adicionar Aula
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {(!course.modules || course.modules.length === 0) && (
                                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                    <div className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
                                        <Layers className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <h3 className="text-base font-medium text-gray-900 dark:text-white">Este curso está vazio</h3>
                                    <p className="text-sm text-gray-500 mb-4">Adicione o primeiro módulo para começar.</p>
                                    <button
                                        onClick={() => onAddModule(course.id)}
                                        className="btn-primary text-sm px-4 py-2"
                                    >
                                        Criar Primeiro Módulo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs text-center text-gray-400">
                    <p>Todas as alterações são salvas automaticamente</p>
                </div>
            </div>
        </div>
    );
};
