import { Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

interface AnalysisData {
    analysis: string;
    priorityActions: string[];
    positivePoints: string[];
    recommendation: string;
}

interface AnalysisResultsProps {
    data: AnalysisData;
}

export const AnalysisResults = ({ data }: AnalysisResultsProps) => {
    return (
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
                        {data.analysis}
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
                        {data.priorityActions?.map((action, idx) => (
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
                        {data.positivePoints?.map((point, idx) => (
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
                        "{data.recommendation}"
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};
