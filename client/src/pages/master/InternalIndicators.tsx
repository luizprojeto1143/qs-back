import { useState, useEffect } from 'react';
import {
    Users,
    PieChart as PieChartIcon,
    BarChart3,
    TrendingUp,
    Download
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    CartesianGrid,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from 'recharts';
import { api } from '../../lib/api';
import { useCompany } from '../../contexts/CompanyContext';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface CensusMetric {
    name: string;
    value: number;
}

interface CensusData {
    totalCollaborators: number;
    gender: CensusMetric[];
    ethnicity: CensusMetric[];
    age: CensusMetric[];
}

interface RetentionData {
    retentionRate: number;
    activePcds: number;
    totalPcds: number;
}

interface SectorMetric {
    name: string;
    MASCULINO: number;
    FEMININO: number;
    OUTRO: number;
}

interface RadarMetric {
    subject: string;
    A: number;
    B: number;
}

const InternalIndicators = () => {
    const { selectedCompanyId } = useCompany();
    const [data, setData] = useState<CensusData | null>(null);
    const [retention, setRetention] = useState<RetentionData | null>(null);
    const [sectors, setSectors] = useState<SectorMetric[]>([]);
    const [radarData, setRadarData] = useState<RadarMetric[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCensus = async () => {
            if (!selectedCompanyId) return;
            setLoading(true);
            try {
                const [censusRes, retentionRes, sectorsRes, radarRes] = await Promise.all([
                    api.get(`/metrics/diversity/${selectedCompanyId}`),
                    api.get(`/metrics/retention/${selectedCompanyId}`),
                    api.get(`/metrics/sectors/${selectedCompanyId}`),
                    api.get(`/metrics/radar/${selectedCompanyId}`)
                ]);
                setData(censusRes.data);
                setRetention(retentionRes.data);
                setSectors(sectorsRes.data);
                setRadarData(radarRes.data);
            } catch (error) {
                console.error('Error loading census:', error);
                toast.error('Erro ao carregar dados do censo');
            } finally {
                setLoading(false);
            }
        };
        loadCensus();
    }, [selectedCompanyId]);

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando indicadores...</div>;
    if (!data) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <PieChartIcon className="w-8 h-8 text-indigo-600" />
                        Indicadores Internos (Censo)
                    </h1>
                    <p className="text-gray-500">Panorama demográfico e de diversidade da empresa</p>
                </div>
                <button className="btn-secondary flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Exportar Relatório
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card flex items-center gap-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{data.totalCollaborators}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Total de Colaboradores</p>
                    </div>
                </div>

                <div className="card flex items-center gap-4 bg-gradient-to-br from-green-50 to-white border-green-100">
                    <div className="p-3 bg-green-100 rounded-xl text-green-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">95%</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Taxa de Resposta</p>
                    </div>
                </div>

                <div className="card flex items-center gap-4 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-900">{retention?.retentionRate || 0}%</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Retenção de PCDs</p>
                        <span className="text-xs text-gray-400">
                            {retention?.activePcds || 0} ativos / {retention?.totalPcds || 0} total
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gênero */}
                <div className="card min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-500" />
                        Distribuição por Gênero
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.gender}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {data.gender.map((_, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Etnia */}
                <div className="card min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-500" />
                        Distribuição por Raça/Etnia
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.ethnicity}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#82ca9d"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {data.ethnicity.map((_, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Faixa Etária */}
                <div className="card col-span-1 lg:col-span-2 min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-gray-500" />
                        Faixa Etária
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data.age}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#8884d8" name="Colaboradores" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Comparativo Setorial */}
                <div className="card col-span-1 lg:col-span-2 min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-gray-500" />
                        Diversidade por Setor (Gênero)
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={sectors}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="MASCULINO" stackId="a" fill="#0088FE" name="Masculino" />
                                <Bar dataKey="FEMININO" stackId="a" fill="#FF8042" name="Feminino" />
                                <Bar dataKey="OUTRO" stackId="a" fill="#00C49F" name="Outro" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Radar de Risco Reputacional */}
                <div className="card col-span-1 lg:col-span-2 min-h-[400px]">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-500" />
                        Radar de Risco Reputacional (Top Áreas)
                    </h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                <Radar name="Retenção" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                <Radar name="QS Score" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                                <Legend />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InternalIndicators;
