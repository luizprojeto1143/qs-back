import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, BookOpen } from 'lucide-react';

interface Course {
    id: string;
    title: string;
    description: string;
    coverUrl?: string;
    duration: number;
    category: string;
}

const CourseCatalog = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses');
                setCourses(response.data);
            } catch (error) {
                console.error('Error fetching courses', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) return <div className="p-6 text-center text-gray-500">Carregando cursos...</div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Universidade Corporativa</h1>
                    <p className="text-gray-500 dark:text-gray-400">Aprenda e evolua com nossos cursos exclusivos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                    <div
                        key={course.id}
                        onClick={() => navigate(`/app/university/course/${course.id}`)}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-all group"
                    >
                        <div className="h-40 bg-gray-200 dark:bg-gray-700 relative">
                            {course.coverUrl ? (
                                <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                    <BookOpen className="h-12 w-12 text-white/50" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {course.duration} min
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                                    {course.category}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{course.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                                {course.description}
                            </p>
                            <button className="w-full btn-primary flex items-center justify-center gap-2">
                                <Play className="h-4 w-4 fill-current" />
                                Começar Agora
                            </button>
                        </div>
                    </div>
                ))}

                {courses.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum curso disponível</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            No momento não há cursos habilitados para sua empresa.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseCatalog;
