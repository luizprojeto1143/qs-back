import { useFormContext, type FieldPath } from 'react-hook-form';
import type { VisitFormData } from '../../schemas/visitSchema';

export const VisitEvaluationsTab = () => {
    const { watch, setValue } = useFormContext<VisitFormData>();
    const evaluations = watch('avaliacoes');

    const sections = [
        { id: 'area', label: 'Avaliação da Área' },
        { id: 'lideranca', label: 'Avaliação da Liderança' },
        { id: 'colaborador', label: 'Avaliação do Colaborador' }
    ];

    const criteria = ['Comunicação', 'Acolhimento', 'Acessibilidade', 'Relacionamento', 'Postura'];

    const handleRating = (sectionId: string, item: string, rating: number) => {
        // Dynamic nested paths for z.record aren't auto-inferred by react-hook-form
        // Cast to FieldPath to satisfy TypeScript while preserving runtime correctness
        const path = `avaliacoes.${sectionId}.${item}` as FieldPath<VisitFormData>;
        setValue(path, rating as never);
    };

    return (
        <div className="space-y-6">
            {sections.map((section) => (
                <div key={section.id} className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">{section.label}</h3>
                    <div className="grid gap-4">
                        {criteria.map((item) => (
                            <div key={item} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                <span className="text-sm font-medium text-gray-700">{item}</span>
                                <div className="flex space-x-2">
                                    {[1, 2, 3, 4, 5].map((rating) => {
                                        const currentRating = (evaluations as Record<string, Record<string, number>>)[section.id]?.[item];
                                        return (
                                            <button
                                                type="button"
                                                key={rating}
                                                onClick={() => handleRating(section.id, item, rating)}
                                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all text-sm font-medium
                                                    ${currentRating === rating
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'border-gray-200 text-gray-600 bg-white hover:bg-blue-50 hover:border-blue-200'
                                                    }
                                                `}
                                            >
                                                {rating}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};
