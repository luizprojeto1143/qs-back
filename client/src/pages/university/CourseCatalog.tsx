import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, BookOpen, Search, Star, CheckCircle, TrendingUp, Zap, Award } from 'lucide-react';

interface Course {
    id: string;
    title: string;
    description: string;
    coverUrl?: string;
    duration: number;
    category: string;
    difficulty: string;
    enrollments: { progress: number; completed: boolean }[];
}

const CourseCatalog = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses');
                setCourses(response.data);
            } catch (error: any) {
                console.error('Error fetching courses', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const uniqueCategories = ['Todos', ...Array.from(new Set(courses.map(c => c.category)))];

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' ? true : course.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const inProgressCourses = courses.filter(c => c.enrollments && c.enrollments.length > 0 && !c.enrollments[0].completed);
    const completedCourses = courses.filter(c => c.enrollments && c.enrollments[0]?.completed);
    const featuredCourse = courses.find(c => c.coverUrl) || courses[0];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-24 animate-in fade-in duration-500">
            {/* Header Moderno */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                        Universidade Corporativa
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
                        Evolua sua carreira, um play de cada vez. 🚀
                    </p>
                </div>

                {/* Search Bar Flutuante */}
                <div className="relative w-full md:w-72 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="O que vamos aprender hoje?"
                        className="block w-full pl-10 pr-3 py-3 border-none rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Continue Learning Section (Horizontal Scroll) */}
            {inProgressCourses.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-lg">
                        <Zap className="h-5 w-5 text-yellow-500 fill-current" />
                        Continue de onde parou
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        {inProgressCourses.map(course => (
                            <div
                                key={course.id}
                                onClick={() => navigate(`/app/university/course/${course.id}`)}
                                className="min-w-[280px] md:min-w-[320px] bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all snap-start"
                            >
                                <div className="flex gap-4">
                                    <div className="h-20 w-20 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                                        {course.coverUrl ? (
                                            <img src={course.coverUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                                <Play className="h-8 w-8 text-white/50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{course.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{course.category}</p>
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs font-medium mb-1">
                                                <span className="text-blue-600">{course.enrollments[0].progress}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${course.enrollments[0].progress}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Featured Banner */}
            {!searchTerm && featuredCourse && (
                <div
                    onClick={() => navigate(`/app/university/course/${featuredCourse.id}`)}
                    className="relative rounded-3xl overflow-hidden cursor-pointer group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10" />
                    <img
                        src={featuredCourse.coverUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'}
                        className="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute bottom-0 left-0 p-6 md:p-10 z-20 max-w-2xl">
                        <span className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full mb-3">
                            Destaque da Semana
                        </span>
                        <h2 className="text-2xl md:text-4xl font-black text-white mb-2 leading-tight">
                            {featuredCourse.title}
                        </h2>
                        <p className="text-gray-200 line-clamp-2 md:text-lg mb-6">
                            {featuredCourse.description}
                        </p>
                        <button className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2">
                            <Play className="h-5 w-5 fill-current" />
                            Assistir Agora
                        </button>
                    </div>
                </div>
            )}

            {/* Categories (Pills) */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    Explorar
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {uniqueCategories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${selectedCategory === category
                                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg scale-105'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => {
                    const enrollment = course.enrollments?.[0];
                    const isCompleted = enrollment?.completed;

                    return (
                        <div
                            key={course.id}
                            onClick={() => navigate(`/app/university/course/${course.id}`)}
                            className="group bg-white dark:bg-gray-800 rounded-3xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer flex flex-col"
                        >
                            {/* Card Image */}
                            <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                                {course.coverUrl ? (
                                    <img src={course.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                                        <BookOpen className="h-10 w-10 text-gray-400" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-gray-900 flex items-center gap-1 shadow-sm">
                                    <Clock className="h-3 w-3" />
                                    {course.duration}m
                                </div>
                                {isCompleted && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                        <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 shadow-lg transform scale-110">
                                            <CheckCircle className="h-5 w-5" />
                                            Concluído
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Card Content */}
                            <div className="px-2 pb-2 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                                        {course.category}
                                    </span>
                                    <span className="text-[10px] font-medium text-gray-400">
                                        {course.difficulty}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                    {course.title}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                                    {course.description}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white dark:border-gray-800" />
                                        ))}
                                        <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                            +12
                                        </div>
                                    </div>
                                    <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                        Ver Detalhes <Play className="h-3 w-3 fill-current" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredCourses.length === 0 && (
                <div className="text-center py-20">
                    <div className="bg-gray-50 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Nenhum curso encontrado</h3>
                    <p className="text-gray-500">Tente buscar por outro termo ou categoria.</p>
                </div>
            )}
        </div>
    );
};

export default CourseCatalog;
