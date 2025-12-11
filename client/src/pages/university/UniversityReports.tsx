import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { BarChart2, Download, Search, User, BookOpen } from 'lucide-react';
import * as XLSX from 'xlsx';

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
    };
}

const UniversityReports = () => {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await api.get('/courses/reports/progress');
                setEnrollments(response.data);
            } catch (error) {
                console.error('Error fetching reports', error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    const filteredEnrollments = enrollments.filter(e =>
        e.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.user.sector.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios de Treinamento</h1>
                    <p className="text-gray-500 dark:text-gray-400">Acompanhe o desenvolvimento da sua equipe.</p>
                </div>
                <button onClick={exportToExcel} className="btn-secondary flex items-center gap-2">
                    <Download className="h-4 w-4" /> Exportar Excel
                </button>
            </div>

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

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por colaborador, curso ou setor..."
                        className="input-field pl-10 w-full"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando dados...</td>
                                </tr>
                            ) : filteredEnrollments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhum registro encontrado.</td>
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UniversityReports;
