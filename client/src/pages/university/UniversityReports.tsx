import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BarChart2, Download, Search, User, BookOpen, Activity, TrendingUp, Filter, Eye, X, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Enrollment {
    id: string;
    progress: number;
    completed: boolean;
    completedAt: string | null;
    updatedAt: string;
    user: {
        id: string;
        name: string;
        email: string;
        sector: string;
    };
    course: {
        id: string;
        title: string;
        category: string;
    };
}

interface Analytics {
    mostWatched: { title: string; students: number }[];
    engagementRate: number;
    heatmap: { lesson: string; completionRate: number }[];
}

interface UserDetails {
    user: { name: string; email: string; avatar: string | null };
    stats: { coursesCompleted: number; coursesInProgress: number; totalLearningTime: string; certificatesCount: number };
    enrollments: { id: string; courseTitle: string; progress: number; completed: boolean; completedAt: string | null; lastAccess: string }[];
    certificates: { id: string; courseTitle: string; code: string; issuedAt: string }[];
    quizAttempts: { id: string; quizTitle: string; score: number; passed: boolean; date: string }[];
}

const UniversityReports = () => {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'general' | 'analytics'>('general');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [reportsRes, analyticsRes] = await Promise.all([
                    api.get('/courses/reports/progress'),
                    api.get('/courses/reports/analytics')
                ]);
                setEnrollments(reportsRes.data);
                setAnalytics(analyticsRes.data);
            } catch (error) {
                console.error('Error fetching data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedUserId) {
            const fetchDetails = async () => {
                setLoadingDetails(true);
                try {
                    const res = await api.get(`/courses/users/${selectedUserId}`);
                    setUserDetails(res.data);
                } catch (error) {
                    console.error('Error fetching user details', error);
                } finally {
                    setLoadingDetails(false);
                }
            };
            fetchDetails();
        } else {
            setUserDetails(null);
        }
    }, [selectedUserId]);

    const uniqueSectors = Array.from(new Set(enrollments.map(e => e.user.sector))).filter(Boolean);
    const uniqueCourses = Array.from(new Set(enrollments.map(e => e.course.title)));

    const filteredEnrollments = enrollments.filter(e => {
        const matchesSearch =
            e.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.user.sector.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSector = selectedSector ? e.user.sector === selectedSector : true;
        const matchesCourse = selectedCourse ? e.course.title === selectedCourse : true;

        return matchesSearch && matchesSector && matchesCourse;
    });

    const exportToExcel = () => {
        const data = filteredEnrollments.map(e => ({
            'Colaborador': e.user.name,
            'Email': e.user.email,
            'Setor': e.user.sector,
            'Curso': e.course.title,
            'Progresso': `${e.progress}%`,
            'Status': e.completed ? 'Concluído' : 'Em Andamento',
            'Data Conclusão': e.completedAt ? new Date(e.completedAt).toLocaleDateString() : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Relatório Universidade");
        XLSX.writeFile(wb, "relatorio_universidade_qs.xlsx");
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Relatório de Treinamento - Universidade Corporativa", 14, 15);

        const tableData = filteredEnrollments.map(e => [
            e.user.name,
            e.user.sector,
            e.course.title,
            `${e.progress}%`,
            e.completed ? 'Concluído' : 'Em Andamento'
        ]);

        autoTable(doc, {
            head: [['Colaborador', 'Setor', 'Curso', 'Progresso', 'Status']],
            body: tableData,
            startY: 20,
        });

        doc.save("relatorio_universidade_qs.pdf");
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios de Treinamento</h1>
                    <p className="text-gray-500 dark:text-gray-400">Acompanhe o desenvolvimento da sua equipe.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`px-4 py-2 text-sm rounded-md transition-all ${activeTab === 'general' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                        >
                            Geral
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`px-4 py-2 text-sm rounded-md transition-all ${activeTab === 'analytics' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}
                        >
                            Análises
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'general' ? (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Total de Alunos</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {new Set(enrollments.map(e => e.user.id)).size}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Cursos Concluídos</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {enrollments.filter(e => e.completed).length}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                                    <BarChart2 className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Média de Progresso</p>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {enrollments.length > 0
                                            ? Math.round(enrollments.reduce((acc, curr) => acc + curr.progress, 0) / enrollments.length)
                                            : 0}%
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters & Actions */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por colaborador, curso ou setor..."
                                    className="input-field pl-10 w-full"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`btn-secondary flex items-center gap-2 ${showFilters ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                                >
                                    <Filter className="h-4 w-4" /> Filtros
                                </button>
                                <button onClick={exportToExcel} className="btn-secondary flex items-center gap-2">
                                    <Download className="h-4 w-4" /> Excel
                                </button>
                                <button onClick={exportToPDF} className="btn-secondary flex items-center gap-2">
                                    <FileText className="h-4 w-4" /> PDF
                                </button>
                            </div>
                        </div>

                        {showFilters && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Setor</label>
                                    <select
                                        className="input-field w-full"
                                        value={selectedSector}
                                        onChange={e => setSelectedSector(e.target.value)}
                                    >
                                        <option value="">Todos os Setores</option>
                                        {uniqueSectors.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Curso</label>
                                    <select
                                        className="input-field w-full"
                                        value={selectedCourse}
                                        onChange={e => setSelectedCourse(e.target.value)}
                                    >
                                        <option value="">Todos os Cursos</option>
                                        {uniqueCourses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Colaborador</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Curso</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Progresso</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Última Atividade</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredEnrollments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhum registro encontrado.</td>
                                        </tr>
                                    ) : (
                                        filteredEnrollments.map((enrollment) => (
                                            <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{enrollment.user.name}</p>
                                                        <p className="text-xs text-gray-500">{enrollment.user.sector}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{enrollment.course.title}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${enrollment.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                                                                style={{ width: `${enrollment.progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{enrollment.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {enrollment.completed ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                            Concluído
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                            Em Andamento
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(enrollment.updatedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => setSelectedUserId(enrollment.user.id)}
                                                        className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                                                        title="Ver Detalhes"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Engagement Rate */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                                <Activity className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Taxa de Engajamento</h3>
                                <p className="text-sm text-gray-500">Usuários ativos nos últimos 30 dias</p>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">{analytics?.engagementRate}%</span>
                            <span className="text-sm text-gray-500 mb-1">da base total</span>
                        </div>
                        <div className="w-full h-4 bg-gray-100 dark:bg-gray-700 rounded-full mt-4 overflow-hidden">
                            <div
                                className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                                style={{ width: `${analytics?.engagementRate}%` }}
                            />
                        </div>
                    </div>

                    {/* Most Watched Courses */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cursos Mais Assistidos</h3>
                                <p className="text-sm text-gray-500">Top 5 cursos por número de alunos</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {analytics?.mostWatched.map((course, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-gray-400 w-4">#{idx + 1}</span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{course.title}</span>
                                    </div>
                                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{course.students} alunos</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Drop-off Heatmap */}
                    <div className="col-span-1 md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                                <BarChart2 className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Retenção por Aula (Heatmap)</h3>
                                <p className="text-sm text-gray-500">Onde os alunos estão abandonando o curso mais popular</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {analytics?.heatmap.map((item, idx) => (
                                <div key={idx} className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-medium text-gray-500 uppercase">Aula {idx + 1}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.completionRate >= 80 ? 'bg-green-100 text-green-700' :
                                            item.completionRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {item.completionRate}% Conclusão
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={item.lesson}>
                                        {item.lesson}
                                    </p>
                                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mt-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${item.completionRate >= 80 ? 'bg-green-500' :
                                                item.completionRate >= 50 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`}
                                            style={{ width: `${item.completionRate}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {selectedUserId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h2 className="text-xl font-bold dark:text-white">Detalhes do Aluno</h2>
                            <button onClick={() => setSelectedUserId(null)} className="text-gray-500 hover:text-gray-700">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div className="p-12 text-center">Carregando detalhes...</div>
                        ) : userDetails ? (
                            <div className="p-6 space-y-8">
                                {/* Header Info */}
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                                        {userDetails.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{userDetails.user.name}</h3>
                                        <p className="text-gray-500">{userDetails.user.email}</p>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 uppercase">Cursos Concluídos</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{userDetails.stats.coursesCompleted}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 uppercase">Em Andamento</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{userDetails.stats.coursesInProgress}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 uppercase">Tempo de Estudo</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{userDetails.stats.totalLearningTime}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 uppercase">Certificados</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{userDetails.stats.certificatesCount}</p>
                                    </div>
                                </div>

                                {/* Course History */}
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">Histórico de Cursos</h4>
                                    <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                                <tr>
                                                    <th className="px-4 py-3">Curso</th>
                                                    <th className="px-4 py-3">Progresso</th>
                                                    <th className="px-4 py-3">Status</th>
                                                    <th className="px-4 py-3">Conclusão</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {userDetails.enrollments.map(enrollment => (
                                                    <tr key={enrollment.id}>
                                                        <td className="px-4 py-3 font-medium">{enrollment.courseTitle}</td>
                                                        <td className="px-4 py-3">{enrollment.progress}%</td>
                                                        <td className="px-4 py-3">
                                                            {enrollment.completed ? (
                                                                <span className="text-green-600 font-medium">Concluído</span>
                                                            ) : (
                                                                <span className="text-blue-600 font-medium">Em Andamento</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>



                                {/* Quiz Attempts */}
                                {userDetails.quizAttempts && userDetails.quizAttempts.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">Desempenho em Provas</h4>
                                        <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-50 dark:bg-gray-700/50">
                                                    <tr>
                                                        <th className="px-4 py-3">Prova</th>
                                                        <th className="px-4 py-3">Nota</th>
                                                        <th className="px-4 py-3">Status</th>
                                                        <th className="px-4 py-3">Data</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                    {userDetails.quizAttempts.map(attempt => (
                                                        <tr key={attempt.id}>
                                                            <td className="px-4 py-3 font-medium">{attempt.quizTitle}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`font-bold ${attempt.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {attempt.score}%
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {attempt.passed ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                                        Aprovado
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                                        Reprovado
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-500">
                                                                {new Date(attempt.date).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Certificates */}
                                {userDetails.certificates.length > 0 && (
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">Certificados Emitidos</h4>
                                        <div className="grid gap-3">
                                            {userDetails.certificates.map(cert => (
                                                <div key={cert.id} className="flex justify-between items-center p-3 border rounded-lg dark:border-gray-700">
                                                    <div>
                                                        <p className="font-medium">{cert.courseTitle}</p>
                                                        <p className="text-xs text-gray-500">Emitido em: {new Date(cert.issuedAt).toLocaleDateString()}</p>
                                                    </div>
                                                    <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{cert.code}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-red-500">Erro ao carregar dados do usuário.</div>
                        )}
                    </div>
                </div >
            )}
        </div >
    );
};

export default UniversityReports;
