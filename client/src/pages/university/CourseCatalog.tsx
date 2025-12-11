import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, BookOpen, Search, Filter, Star, CheckCircle } from 'lucide-react';

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
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedDifficulty, setSelectedDifficulty] = useState('');
    const [showFilters, setShowFilters] = useState(false);

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

    const uniqueCategories = Array.from(new Set(courses.map(c => c.category)));
    const uniqueDifficulties = Array.from(new Set(courses.map(c => c.difficulty || 'Iniciante')));

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory ? course.category === selectedCategory : true;
        const matchesDifficulty = selectedDifficulty ? (course.difficulty || 'Iniciante') === selectedDifficulty : true;

        return matchesSearch && matchesCategory && matchesDifficulty;
    });

    const recommendedCourse = courses.length > 0 ? courses[0] : null;

    if (loading) return <div className="p-6 text-center text-gray-500">Carregando cursos...</div>;

    return (
        <div className="space-y-8 pb-20">
            {/* Header & Banner */}
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Universidade Corporativa</h1>
                    <p className="text-gray-500 dark:text-gray-400">Aprenda e evolua com nossos cursos exclusivos.</p>
                </div>

                {/* Recommended Banner */}
                {recommendedCourse && (
                    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-4 max-w-2xl">
                                <div className="flex items-center gap-2 text-sm font-medium bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                                    <Star className="h-4 w-4 fill-current text-yellow-300" />
                                    Recomendado para você
                                </div>
                                <h2 className="text-3xl font-bold">{recommendedCourse.title}</h2>
                                <p className="text-blue-100 line-clamp-2">{recommendedCourse.description}</p>
                                <button
                                    onClick={() => navigate(`/app/university/course/${recommendedCourse.id}`)}
                                    className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors flex items-center gap-2"
                                >
                                    <Play className="h-5 w-5 fill-current" />
                                    Começar Agora
                                </button>
                            </div>
                            {recommendedCourse.coverUrl && (
                                <img
                                    src={recommendedCourse.coverUrl}
                                    alt={recommendedCourse.title}
                                    className="hidden md:block w-48 h-32 object-cover rounded-lg shadow-lg rotate-3 hover:rotate-0 transition-transform duration-500"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar cursos..."
                            className="input-field pl-10 w-full"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                    >
                        <Filter className="h-4 w-4" /> Filtros
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                            <select
                                className="input-field w-full"
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                            >
                                <option value="">Todas</option>
                                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Dificuldade</label>
                            <select
                                className="input-field w-full"
                                value={selectedDifficulty}
                                onChange={e => setSelectedDifficulty(e.target.value)}
                            >
                                <option value="">Todas</option>
                                {uniqueDifficulties.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map(course => {
                    const enrollment = course.enrollments?.[0];
                    const progress = enrollment?.progress || 0;
                    const isCompleted = enrollment?.completed;

                    return (
                        <div
                            key={course.id}
                            onClick={() => navigate(`/app/university/course/${course.id}`)}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-all group flex flex-col h-full"
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
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                                        {course.category}
                                    </span>
                                    {course.difficulty && (
                                        <span className={`text-xs px-2 py-1 rounded-full backdrop-blur-sm text-white ${course.difficulty === 'Iniciante' ? 'bg-green-500/80' :
                                            course.difficulty === 'Intermediário' ? 'bg-yellow-500/80' :
                                                'bg-red-500/80'
                                            }`}>
                                            {course.difficulty}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {course.duration} min
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{course.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-1">
                                    {course.description}
                                </p>

                                {/* Progress Bar */}
                                {enrollment ? (
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className={isCompleted ? 'text-green-600' : 'text-blue-600'}>
                                                {isCompleted ? 'Concluído' : 'Em andamento'}
                                            </span>
                                            <span className="text-gray-500">{progress}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4 h-2" /> // Spacer
                                )}

                                <button className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${isCompleted
                                    ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400'
                                    : enrollment
                                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
                                        : 'btn-primary'
                                    }`}>
                                    {isCompleted ? (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Ver Certificado
                                        </>
                                    ) : enrollment ? (
                                        <>
                                            <Play className="h-4 w-4 fill-current" />
                                            Continuar
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4 fill-current" />
                                            Começar Agora
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}

                {filteredCourses.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum curso encontrado</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Tente ajustar seus filtros de busca.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseCatalog;
