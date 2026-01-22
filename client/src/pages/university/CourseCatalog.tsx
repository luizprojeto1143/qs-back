import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import {
    Play, Clock, Search, CheckCircle, TrendingUp, Zap,
    Target, Brain, Award, ChevronRight,
    BarChart3, Shield
} from 'lucide-react';
import { LearningTrailMap } from './components/LearningTrailMap';

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
    const [showTrailMap, setShowTrailMap] = useState(false);
    const navigate = useNavigate();

    // Mock Data for Trail Map (until connected to real backend fully)
    const mockTrailNodes = courses.slice(0, 4).map((c, i) => ({
        id: c.id,
        title: c.title,
        type: 'COURSE' as const,
        status: (i === 0 ? 'IN_PROGRESS' : i === 1 ? 'UNLOCKED' : 'LOCKED') as 'IN_PROGRESS' | 'UNLOCKED' | 'LOCKED' | 'COMPLETED',
        data: {
            description: c.description,
            coverUrl: c.coverUrl,
            duration: c.duration,
            progress: c.enrollments?.[0]?.progress || 0
        }
    }));

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

    // Derived State for Dashboard
    const inProgressCourses = courses.filter(c => c.enrollments && c.enrollments.length > 0 && !c.enrollments[0].completed);
    const completedCourses = courses.filter(c => c.enrollments && c.enrollments[0]?.completed);

    // Simulating "My Current Trail" - taking the first in-progress or first available
    const currentMainCourse = inProgressCourses[0] || courses[0];

    // Simulating "AI Suggestion" - taking a random course not started
    const notStartedCourses = courses.filter(c => !c.enrollments || c.enrollments.length === 0);
    const suggestionCourse = notStartedCourses.length > 0 ? notStartedCourses[0] : courses[1];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-24 animate-in fade-in duration-500">

            {/* 1. HERO SECTION */}
            <div className="relative rounded-3xl overflow-hidden min-h-[400px] flex items-center shadow-2xl group">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1614728853913-1e22ba863010?q=80&w=1600&auto=format&fit=crop"
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        alt="Hero Data"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
                </div>

                <div className="relative z-10 p-8 md:p-16 max-w-3xl">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-1 w-12 bg-blue-500 rounded-full"></div>
                        <span className="text-blue-400 font-bold tracking-wider text-sm uppercase">Universidade Corporativa ELITE</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        Prepare-se para o <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Futuro da Empresa</span>
                    </h1>
                    <p className="text-gray-300 text-lg mb-8 max-w-xl leading-relaxed">
                        Trilhas de aprendizagem personalizadas, inovação e crescimento profissional acelerado com inteligência artificial.
                    </p>
                    <button
                        onClick={() => currentMainCourse && navigate(`/app/university/course/${currentMainCourse.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-1 flex items-center gap-3"
                    >
                        <Play className="fill-current h-5 w-5" />
                        Iniciar Minha Trilha
                    </button>
                </div>
            </div>

            {/* 2. DASHBOARD WIDGETS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Widget 1: Minha Trilha Atual */}
                {currentMainCourse ? (
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-0 overflow-hidden relative shadow-lg border border-gray-700/50 group cursor-pointer"
                        onClick={() => navigate(`/app/university/course/${currentMainCourse.id}`)}>
                        <div className="absolute inset-0">
                            <img src={currentMainCourse.coverUrl || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400'} className="w-full h-full object-cover opacity-40 mix-blend-overlay transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                        </div>
                        <div className="relative p-6 h-full flex flex-col justify-end min-h-[200px]">
                            <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold w-fit mb-2 backdrop-blur-sm">
                                <Zap className="h-3 w-3 fill-current" />
                                Em Andamento
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1 line-clamp-2">{currentMainCourse.title}</h3>
                            <div className="w-full bg-gray-700/50 h-1.5 rounded-full mt-3 overflow-hidden">
                                <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${currentMainCourse.enrollments?.[0]?.progress || 0}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center mt-4">
                                <button className="text-white text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Continuar <ChevronRight className="h-4 w-4" />
                                </button>
                                <span className="text-xs text-gray-400">{currentMainCourse.enrollments?.[0]?.progress || 0}%</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center border border-gray-100 dark:border-gray-700">
                        <Play className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-gray-500">Nenhum curso em andamento</p>
                    </div>
                )}

                {/* Widget 2: Metas da Semana */}
                <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-6 relative overflow-hidden shadow-lg border border-blue-800/30">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Target className="h-24 w-24 text-blue-400" />
                    </div>
                    <h3 className="text-gray-400 font-medium text-sm mb-1">Metas da Semana</h3>
                    <div className="text-2xl font-bold text-white mb-4">Alcançar 3 KPIs</div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="flex justify-between text-xs text-blue-200 mb-1">
                                <span>Progresso</span>
                                <span>2/3</span>
                            </div>
                            <div className="w-full bg-blue-950 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-400 h-full rounded-full w-2/3 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center h-12 w-12 rounded-full border-4 border-blue-500/30 border-t-blue-400">
                            <span className="text-xs font-bold text-blue-100">66%</span>
                        </div>
                    </div>
                </div>

                {/* Widget 3: Sugestão da IA */}
                {suggestionCourse && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-150"></div>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
                                    <Brain className="h-3 w-3" />
                                    Sugestão da IA
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{suggestionCourse.title}</h3>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <img src={suggestionCourse.coverUrl || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200'} className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{suggestionCourse.description}</p>
                                <button
                                    onClick={() => navigate(`/app/university/course/${suggestionCourse.id}`)}
                                    className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-md font-bold hover:bg-purple-200 transition-colors"
                                >
                                    Saiba Mais
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. LEARNING TRAILS (Horizontal Scroll) */}
            <div>
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-gray-400" />
                        Trilhas de Aprendizagem
                    </h3>
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        Ver Todos <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    {/* Mock Trails based on Course Categories */}
                    {['Liderança Estratégica', 'Excelência Operacional', 'Cultura Inclusiva', 'Inovação Digital'].map((trail, index) => (
                        <div key={index} className="min-w-[280px] h-40 rounded-2xl relative overflow-hidden cursor-pointer group snap-start shadow-md hover:shadow-xl transition-all">
                            <img
                                src={`https://images.unsplash.com/photo-${index === 0 ? '1552664730-d307ca884978' : index === 1 ? '1556761175-5973ac0f96fc' : '1531482615713-2afd69097998'}?w=400&fit=crop`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent flex flex-col justify-end p-5">
                                <h4 className="text-white font-bold text-lg leading-tight group-hover:text-blue-300 transition-colors">{trail}</h4>
                                <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-300">
                                    <p className="text-gray-300 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100">4 Cursos • 12 Horas</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. STATISTICS & CERTIFICATIONS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Performance Panel */}
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold">Painel de Desempenho</h3>
                        <BarChart3 className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative h-24 w-24 flex items-center justify-center">
                            <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                                <path className="text-slate-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                <path className="text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" strokeDasharray="78, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                            <Clock className="absolute h-8 w-8 text-blue-400" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold">78%</div>
                            <div className="text-sm text-yellow-400 font-medium">Progresso Geral</div>
                            <p className="text-xs text-slate-400 mt-1">Melhore seus resultados finais</p>
                        </div>
                    </div>
                </div>

                {/* Certifications */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white">Certificações</h3>
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">2 Ativos</span>
                    </div>

                    <div className="flex-1 flex items-center justify-around gap-4 my-2">
                        {/* Mock Badges */}
                        <div className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-16 h-20 bg-gradient-to-br from-yellow-300 to-yellow-600 clip-path-badge shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                <Award className="text-white h-8 w-8 drop-shadow-md" />
                            </div>
                            <span className="text-[10px] font-bold text-center text-gray-600 dark:text-gray-300 leading-tight">Gestão <br /> Avançada</span>
                        </div>
                        <div className="flex flex-col items-center gap-2 group cursor-pointer">
                            <div className="w-16 h-20 bg-gradient-to-br from-blue-400 to-blue-700 clip-path-badge shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                <Shield className="text-white h-8 w-8 drop-shadow-md" />
                            </div>
                            <span className="text-[10px] font-bold text-center text-gray-600 dark:text-gray-300 leading-tight">Segurança <br /> no Trabalho</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/app/university/certificates')}
                        className="w-full mt-auto bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                        Ver Certificados <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Practical Challenges (Simulations) */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Simulações e Prática</h3>
                    <div className="space-y-3">
                        <div className="flex gap-3 group cursor-pointer">
                            <div className="w-20 h-14 rounded-lg overflow-hidden relative">
                                <img src="https://images.unsplash.com/photo-1573164713988-8665fc963095?w=200" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-all">
                                    <Play className="h-4 w-4 text-white fill-current" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1 group-hover:text-blue-600">Webinar: Inovações 2024</h4>
                                <p className="text-xs text-blue-600 font-medium mt-1">Ao Vivo Hoje 14h</p>
                            </div>
                        </div>
                        <div className="flex gap-3 group cursor-pointer">
                            <div className="w-20 h-14 rounded-lg overflow-hidden relative">
                                <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=200" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/10 transition-all">
                                    <Play className="h-4 w-4 text-white fill-current" />
                                </div>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 line-clamp-1 group-hover:text-blue-600">Novo Artigo: ESG</h4>
                                <p className="text-xs text-gray-400 mt-1">Sustentabilidade Empresarial</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Standard Course Grid (For remaining courses) */}
            <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Todos os Cursos</h3>
                    <div className="relative w-64">
                        <input
                            type="text"
                            placeholder="Buscar cursos..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map(course => (
                        <div key={course.id} onClick={() => navigate(`/app/university/course/${course.id}`)} className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
                            <div className="relative h-32 rounded-lg overflow-hidden mb-3">
                                <img src={course.coverUrl || 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                {course.enrollments[0]?.completed && (
                                    <div className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Concluído
                                    </div>
                                )}
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1 group-hover:text-blue-600">{course.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{course.category}</p>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .clip-path-badge {
                    clip-path: polygon(50% 0%, 100% 20%, 100% 80%, 50% 100%, 0% 80%, 0% 20%);
                }
            `}</style>

            {showTrailMap && (
                <LearningTrailMap
                    trailId="demo"
                    title="Liderança Estratégica"
                    description="Domine as habilidades essenciais para liderar equipes de alta performance no cenário atual."
                    nodes={mockTrailNodes}
                    onClose={() => setShowTrailMap(false)}
                />
            )}
        </div>
    );
};

export default CourseCatalog;
