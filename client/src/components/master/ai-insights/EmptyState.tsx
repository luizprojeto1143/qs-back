import { Sparkles } from 'lucide-react';

export const EmptyState = () => (
    <div className="bg-purple-50 border border-purple-100 rounded-xl p-8 text-center animate-in fade-in zoom-in duration-300">
        <Sparkles className="h-12 w-12 text-purple-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-purple-900">Nenhuma análise gerada ainda</h3>
        <p className="text-purple-700 max-w-md mx-auto mt-2">
            Clique no botão acima para que nossa IA analise os dados de denúncias, clima e score para gerar insights estratégicos.
        </p>
    </div>
);
