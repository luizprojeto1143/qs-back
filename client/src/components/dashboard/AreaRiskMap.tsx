import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface RiskArea {
    id: string;
    name: string;
    riskLevel: 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRITICO';
    score: number;
    issuesCount: number;
}

export const AreaRiskMap = ({ areas }: { areas: RiskArea[] }) => {
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'CRITICO': return 'bg-red-500 text-white';
            case 'ALTO': return 'bg-orange-500 text-white';
            case 'MODERADO': return 'bg-yellow-400 text-gray-900';
            case 'BAIXO': return 'bg-green-500 text-white';
            default: return 'bg-gray-200 text-gray-600';
        }
    };

    const getRiskIcon = (level: string) => {
        switch (level) {
            case 'CRITICO':
            case 'ALTO': return <AlertTriangle className="h-5 w-5" />;
            case 'MODERADO': return <Info className="h-5 w-5" />;
            case 'BAIXO': return <CheckCircle className="h-5 w-5" />;
            default: return null;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg font-semibold text-gray-800 dark:text-gray-200">
                    <span>Mapa de Risco de Inclusão</span>
                    <div className="flex gap-2 text-xs font-normal">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Baixo</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> Moderado</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-orange-500"></div> Alto</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Crítico</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {areas.map(area => (
                        <div
                            key={area.id}
                            className={`
                                relative p-4 rounded-xl shadow-sm transition-all hover:scale-105 cursor-pointer
                                ${getRiskColor(area.riskLevel)}
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-sm truncate pr-2" title={area.name}>{area.name}</h3>
                                {getRiskIcon(area.riskLevel)}
                            </div>

                            <div className="space-y-1">
                                <div className="text-2xl font-bold tracking-tight">{area.score}</div>
                                <div className="text-xs opacity-90 flex justify-between">
                                    <span>QS Score</span>
                                    <span>{area.issuesCount} alertas</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
