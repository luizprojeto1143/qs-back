import { useState } from 'react';
import { api } from '../../lib/api';
import { useCompany } from '../../contexts/CompanyContext';
import { Brain, Sparkles, Loader } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingState } from '../../components/master/ai-insights/LoadingState';
import { EmptyState } from '../../components/master/ai-insights/EmptyState';
import { AnalysisResults } from '../../components/master/ai-insights/AnalysisResults';

interface Analysis {
    analysis: string;
    priorityActions: string[];
    positivePoints: string[];
    recommendation: string;
}

const AIInsightsDashboard = () => {
    const { selectedCompanyId } = useCompany();
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<Analysis | null>(null);

    const handleGenerateAnalysis = async () => {
        if (!selectedCompanyId) return;

        setLoading(true);
        try {
            const response = await api.post('/ai/analyze', {}, {
                'x-company-id': selectedCompanyId
            });
            setAnalysis(response.data.ai);
        } catch (error) {
            console.error('Error analyzing data:', error);
            const err = error as { response?: { data?: { error?: string } } };
            const msg = err.response?.data?.error || 'Falha ao conectar com o serviço de IA.';
            if (msg.includes('API Key')) {
                toast.error('Chave da OpenAI não configurada ou inválida.');
            } else {
                toast.error(`Erro na análise: ${msg}`);
            }
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

            {!analysis && !loading && <EmptyState />}

            {loading && <LoadingState />}

            {analysis && <AnalysisResults data={analysis} />}
        </div>
    );
};

export default AIInsightsDashboard;
