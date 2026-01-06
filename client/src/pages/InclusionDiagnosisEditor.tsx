import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { useInclusionDiagnosis } from '../hooks/useInclusionDiagnosis';

const CATEGORIES = [
    'acessibilidade_arquitetonica',
    'acessibilidade_comunicacional',
    'acessibilidade_metodologica',
    'acessibilidade_instrumental',
    'acessibilidade_programatica',
    'acessibilidade_atitudinal',
    'recrutamento_selecao',
    'gestao_carreira'
];

const InclusionDiagnosisEditor = () => {
    const {
        loading,
        saving,
        diagnosis,
        handleScoreChange,
        handleNotesChange,
        saveDiagnosis,
        navigate
    } = useInclusionDiagnosis();

    if (loading) return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate(-1)} className="hover:bg-gray-200 p-2 rounded-full transition-colors">
                            <ArrowLeft className="h-6 w-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Editar Diagnóstico de Inclusão</h1>
                            <p className="text-gray-500">Avalie cada dimensão da acessibilidade e inclusão.</p>
                        </div>
                    </div>
                    <button
                        onClick={saveDiagnosis}
                        disabled={saving}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <Save className="h-4 w-4" />
                        <span>{saving ? 'Salvando...' : 'Salvar Diagnóstico'}</span>
                    </button>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-lg">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                As alterações realizadas aqui refletirão imediatamente no relatório de Diagnóstico de Inclusão visualizado pelo RH.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {CATEGORIES.map(category => (
                        <div key={category} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold capitalize mb-4 text-gray-800 border-b pb-2">
                                {category.replace(/_/g, ' ')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pontuação (0-100%)</label>
                                    <div className="flex items-center space-x-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={diagnosis[category]?.score || 0}
                                            onChange={(e) => handleScoreChange(category, parseInt(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <span className="font-bold text-primary w-12 text-right">{diagnosis[category]?.score || 0}%</span>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Observações / Plano de Ação</label>
                                    <textarea
                                        className="input-field min-h-[100px]"
                                        placeholder="Descreva os pontos de atenção e ações necessárias..."
                                        value={diagnosis[category]?.notes || ''}
                                        onChange={(e) => handleNotesChange(category, e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InclusionDiagnosisEditor;
