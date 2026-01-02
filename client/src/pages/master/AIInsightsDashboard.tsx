import { useState } from 'react';
import { api } from '../../lib/api';
import { useCompany } from '../../contexts/CompanyContext';
import { Brain, Sparkles, AlertTriangle, ArrowRight, Loader } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const AIInsightsDashboard = () => {
    const { selectedCompanyId } = useCompany();
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);

    const handleGenerateAnalysis = async () => {
        if (!selectedCompanyId) return;

        setLoading(true);
        try {
            const response = await api.post('/ai/analyze', {}, {
                headers: { 'x-company-id': selectedCompanyId }
            });
            setAnalysis(response.data.ai);
        } catch (error) {
            console.error('Error analyzing data:', error);
            alert('Falha ao gerar análise. Verifique se a chave da OpenAI está configurada.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Brain className="h-8 w-8 text-purple-600" />
                        IA Analítica
                    </h1>
                    <p className="text-sm text-gray-500">Inteligência artificial aplicada à gestão de inclusão</p>
                </div>
                <div>
                    <button
                        onClick={handleGenerateAnalysis}
                        disabled={loading || !selectedCompanyId}
                        className="btn-primary bg-purple-600 hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {loading ? 'Analisando...' : 'Gerar Nova Análise'}
                    </button>
                </div>
            </div>

            {!analysis && !loading && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-8 text-center">
                    <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-purple-900">Nenhuma análise gerada ainda</h3>
                    <p className="text-purple-700 max-w-md mx-auto mt-2">
                        Clique no botão acima para que nossa IA analise os dados de denúncias, clima e score para gerar insights estratégicos.
                    </p>
                </div>
            )}

            {loading && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                    <p className="mt-6 text-gray-500">A IA está processando seus dados...</p>
                </div>
            )}

            {analysis && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                    {/* Resumo */}
                    <Card className="lg:col-span-2 border-l-4 border-l-purple-500">
                        <CardHeader>
                            <CardTitle className="text-purple-700 flex items-center gap-2">
                                <Sparkles className="h-5 w-5" />
                                Análise Executiva
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg text-gray-700 leading-relaxed">
                                {analysis.analysis}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Ações Prioritárias */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-gray-800">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Ações Prioritárias
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {analysis.priorityActions?.map((action: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                                        <div className="bg-orange-200 text-orange-700 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                            {idx + 1}
                                        </div>
                                        <span className="text-gray-700 text-sm font-medium">{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Pontos Positivos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-gray-800">
                                <ArrowRight className="h-5 w-5 text-green-500" />
                                Pontos Fortes Identificados
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {analysis.positivePoints?.map((point: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-gray-700 text-sm">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Recomendação Final */}
                    <Card className="lg:col-span-2 bg-gradient-to-r from-blue-50 to-purple-50 border-none">
                        <CardContent className="p-6">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Recomendação Estratégica</h4>
                            <p className="text-xl font-medium text-gray-800 italic">
                                "{analysis.recommendation}"
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AIInsightsDashboard;
