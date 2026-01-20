
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend
} from 'recharts';
import { AlertTriangle, TrendingUp, MessageSquare } from 'lucide-react';

const ResultsTab = () => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await api.get('/reviews/results');
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-10 text-center animate-pulse">Calculando resultados...</div>;

    if (!data || !data.available) {
        return (
            <div className="bg-white p-10 rounded-xl border border-gray-100 text-center">
                <div className="bg-yellow-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-500">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Relatório Indisponível</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                    {data?.message || 'Os resultados do ciclo atual ainda não foram consolidados ou você não recebeu avaliações suficientes.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-1">Resultados 360º</h2>
                <p className="opacity-90">{data.cycle}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Spider Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        Mapa de Competências
                    </h3>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data.chartData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 5]} />


                                <Radar name="Autoavaliação" dataKey="self" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                                <Radar name="Gestor" dataKey="manager" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                                <Radar name="RH" dataKey="peer" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />

                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Qualitative Feedback */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        Destaques e Comentários
                    </h3>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {data.comments.length === 0 ? (
                            <p className="text-gray-400 text-center py-10">Nenhum comentário registrado.</p>
                        ) : (
                            data.comments.map((comment: any, index: number) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-400">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold uppercase text-gray-500">{comment.competency}</span>
                                        <span className="text-xs px-2 py-1 bg-white rounded border border-gray-200 text-gray-600">
                                            {comment.type === 'SELF' ? 'Você' : comment.type === 'MANAGER' ? 'Gestor' : 'RH'}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 italic">"{comment.text}"</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Score Breakdown Table */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Detalhamento das Notas</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 text-left">
                                <th className="pb-3 text-sm font-bold text-gray-500 uppercase">Competência</th>
                                <th className="pb-3 text-sm font-bold text-gray-500 uppercase text-center">Auto</th>
                                <th className="pb-3 text-sm font-bold text-gray-500 uppercase text-center">Gestor</th>
                                <th className="pb-3 text-sm font-bold text-gray-500 uppercase text-center">RH</th>
                                <th className="pb-3 text-sm font-bold text-blue-600 uppercase text-center">Média Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {data.chartData.map((item: any) => {
                                const validScores = [item.self, item.manager, item.peer].filter(s => s > 0);
                                const average = validScores.length > 0
                                    ? validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length
                                    : 0;

                                return (
                                    <tr key={item.subject} className="group hover:bg-gray-50 transition-colors">
                                        <td className="py-4 font-medium text-gray-800">{item.subject}</td>
                                        <td className="py-4 text-center text-gray-600">{item.self || '-'}</td>
                                        <td className="py-4 text-center text-gray-600">{item.manager || '-'}</td>
                                        <td className="py-4 text-center text-gray-600">{item.peer ? item.peer.toFixed(1) : '-'}</td>
                                        <td className="py-4 text-center font-bold text-blue-600">{average > 0 ? average.toFixed(1) : '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ResultsTab;
