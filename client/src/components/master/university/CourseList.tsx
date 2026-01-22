import { BookOpen, Trash2, Edit, PlayCircle, Clock, Users, Building2, MoreVertical, Layout, FileText, CheckCircle2 } from 'lucide-react';
import type { Course } from '../../../types/university';
import { useState } from 'react';

interface CourseListProps {
    courses: Course[];
    onDeleteCourse: (id: string) => void;
    onEditCourse: (course: Course) => void;
    onManageContent: (course: Course) => void;
}

export const CourseList = ({
    courses,
    onDeleteCourse,
    onEditCourse,
    onManageContent
}: CourseListProps) => {
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
                <div key={course.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col">
                    {/* Cover Image Area */}
                    <div className="h-40 bg-gradient-to-br from-blue-500 to-indigo-600 relative overflow-hidden">
                        {course.coverUrl ? (
                            <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-black/10"></div>
                                <BookOpen className="h-12 w-12 text-white/80" />
                                {/* Decorative Circles */}
                                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-black/10 rounded-full blur-xl"></div>
                            </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md ${course.active
                                    ? 'bg-green-500/20 text-white border border-white/20'
                                    : 'bg-gray-500/50 text-white border border-white/20'
                                }`}>
                                {course.active ? 'Publicado' : 'Rascunho'}
                            </span>
                        </div>

                        {/* Action Menu Button */}
                        <div className="absolute top-3 right-3">
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === course.id ? null : course.id); }}
                                    className="p-1.5 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors backdrop-blur-sm"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </button>

                                {activeMenu === course.id && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setActiveMenu(null)}
                                        ></div>
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
                                            <button
                                                onClick={() => { setActiveMenu(null); onEditCourse(course); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-2"
                                            >
                                                <Edit className="h-4 w-4" /> Editar Detalhes
                                            </button>
                                            <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                                            <button
                                                onClick={() => { setActiveMenu(null); onDeleteCourse(course.id); }}
                                                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                            >
                                                <Trash2 className="h-4 w-4" /> Excluir Curso
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col">
                        <div className="mb-4">
                            <div className="flex gap-2 mb-2 flex-wrap">
                                <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded font-bold uppercase tracking-wide">
                                    {course.category}
                                </span>
                                {course.visibleToAll ? (
                                    <span className="text-[10px] px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded font-bold uppercase tracking-wide flex items-center gap-1">
                                        <Users className="h-3 w-3" /> Todos
                                    </span>
                                ) : (
                                    <span className="text-[10px] px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded font-bold uppercase tracking-wide flex items-center gap-1">
                                        <Building2 className="h-3 w-3" /> Empresas
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-2 line-clamp-2" title={course.title}>
                                {course.title}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                                {course.description}
                            </p>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>{course.duration} min</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Layout className="h-3.5 w-3.5" />
                                    <span>{course.modules?.length || 0} módulos</span>
                                </div>
                            </div>

                            <button
                                onClick={() => onManageContent(course)}
                                className="w-full py-2.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 text-primary dark:text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white"
                            >
                                <Layout className="h-4 w-4" />
                                Gerenciar Conteúdo
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {/* Empty State Help */}
            {courses.length === 0 && (
                <div className="col-span-full py-16 text-center bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Nenhum curso criado</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                        Comece criando seu primeiro curso para treinar seus colaboradores.
                    </p>
                </div>
            )}
        </div>
    );
};
