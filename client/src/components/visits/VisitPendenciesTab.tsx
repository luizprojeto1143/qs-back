import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useFormContext, useFieldArray } from 'react-hook-form';
import type { VisitFormData } from '../../schemas/visitSchema';

export const VisitPendenciesTab = () => {
    const { control } = useFormContext<VisitFormData>();
    const { fields, append, remove } = useFieldArray({
        control,
        name: 'pendencias'
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPendency, setNewPendency] = useState({
        description: '',
        responsibleId: '', // Ideally should map to a user/collab, keeping as string for now
        responsibleName: '', // Helper to show name
        priority: 'MEDIA',
        deadline: '',
        status: 'PENDENTE'
    });

    // We need a simple way to input responsible. For now, text input as before.
    // Ideally this should be a select from collaborators.

    const handlePendencySubmit = (e: React.FormEvent) => {
        e.preventDefault();

        append({
            description: newPendency.description,
            responsible: newPendency.responsibleName,
            priority: newPendency.priority as any,
            deadline: newPendency.deadline || null,
            status: 'PENDENTE'
        });

        setNewPendency({ description: '', responsibleId: '', responsibleName: '', priority: 'MEDIA', deadline: '', status: 'PENDENTE' });
        setIsModalOpen(false);
        toast.success('Pendência adicionada à lista!');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus className="h-4 w-4" />
                    <span>Nova Pendência</span>
                </button>
            </div>

            {fields.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    <p>Nenhuma pendência registrada para este acompanhamento.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {fields.map((p, index) => (
                        <div key={p.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div>
                                <h4 className="font-medium text-gray-900">{p.description}</h4>
                                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.priority === 'ALTA' ? 'bg-red-100 text-red-800' :
                                        p.priority === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                        {p.priority === 'MEDIA' ? 'Média' : p.priority === 'ALTA' ? 'Alta' : 'Baixa'}
                                    </span>
                                    <span>{(p as any).responsible || (p as any).responsibleId}</span>
                                    <span>{p.deadline ? new Date(p.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-gray-400 hover:text-red-500 p-2"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Nova Pendência</h2>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handlePendencySubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    required
                                    className="input-field"
                                    rows={3}
                                    value={newPendency.description}
                                    onChange={e => setNewPendency({ ...newPendency, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field"
                                        value={newPendency.responsibleName}
                                        onChange={e => setNewPendency({ ...newPendency, responsibleName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                                    <input
                                        type="date"
                                        required
                                        className="input-field"
                                        value={newPendency.deadline}
                                        onChange={e => setNewPendency({ ...newPendency, deadline: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                <select
                                    className="input-field"
                                    value={newPendency.priority}
                                    onChange={e => setNewPendency({ ...newPendency, priority: e.target.value })}
                                >
                                    <option value="BAIXA">Baixa</option>
                                    <option value="MEDIA">Média</option>
                                    <option value="ALTA">Alta</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn-primary">
                                    Adicionar Pendência
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
