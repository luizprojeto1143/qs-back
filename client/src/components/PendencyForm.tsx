import React, { useState } from 'react';
import { Plus, Trash2, Flag, Calendar, User } from 'lucide-react';
import { Button } from './ui/Button';

interface Pendency {
    description: string;
    responsible: string;
    priority: 'BAIXA' | 'MEDIA' | 'ALTA';
    deadline?: string;
}

interface PendencyFormProps {
    pendencies: Pendency[];
    onPendenciesChange: (pendencies: Pendency[]) => void;
}

const priorityConfig = {
    BAIXA: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Baixa' },
    MEDIA: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Média' },
    ALTA: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Alta' },
};

export const PendencyForm: React.FC<PendencyFormProps> = ({
    pendencies,
    onPendenciesChange,
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newPendency, setNewPendency] = useState<Pendency>({
        description: '',
        responsible: '',
        priority: 'MEDIA',
        deadline: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPendency.description || !newPendency.responsible) return;

        onPendenciesChange([...pendencies, newPendency]);
        setNewPendency({ description: '', responsible: '', priority: 'MEDIA', deadline: '' });
        setIsAdding(false);
    };

    const removePendency = (index: number) => {
        onPendenciesChange(pendencies.filter((_, i) => i !== index));
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Pendências</h3>
                {!isAdding && (
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setIsAdding(true)}
                    >
                        Adicionar
                    </Button>
                )}
            </div>

            {/* Add New Pendency Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-xl space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Descrição *</label>
                        <textarea
                            value={newPendency.description}
                            onChange={(e) => setNewPendency({ ...newPendency, description: e.target.value })}
                            placeholder="Descreva a pendência..."
                            rows={2}
                            className="mt-1 w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Responsável *</label>
                            <div className="relative mt-1">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={newPendency.responsible}
                                    onChange={(e) => setNewPendency({ ...newPendency, responsible: e.target.value })}
                                    placeholder="Nome do responsável"
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700">Prazo</label>
                            <div className="relative mt-1">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={newPendency.deadline}
                                    onChange={(e) => setNewPendency({ ...newPendency, deadline: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700">Prioridade</label>
                        <div className="flex gap-2 mt-1">
                            {(['BAIXA', 'MEDIA', 'ALTA'] as const).map((priority) => (
                                <button
                                    key={priority}
                                    type="button"
                                    onClick={() => setNewPendency({ ...newPendency, priority })}
                                    className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border font-medium text-sm transition-all
                    ${newPendency.priority === priority
                                            ? priorityConfig[priority].color + ' ring-2 ring-offset-1 ring-current/30'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                        }
                  `}
                                >
                                    <Flag className="w-3 h-3" />
                                    {priorityConfig[priority].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="ghost" type="button" onClick={() => setIsAdding(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Adicionar Pendência
                        </Button>
                    </div>
                </form>
            )}

            {/* Pendencies List */}
            {pendencies.length > 0 && (
                <div className="space-y-2">
                    {pendencies.map((pendency, index) => (
                        <div
                            key={index}
                            className="flex items-start justify-between p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex-1 space-y-1">
                                <p className="text-sm text-gray-900 font-medium">{pendency.description}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {pendency.responsible}
                                    </span>
                                    {pendency.deadline && (
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(pendency.deadline).toLocaleDateString('pt-BR')}
                                        </span>
                                    )}
                                    <span className={`px-2 py-0.5 rounded-full border ${priorityConfig[pendency.priority].color}`}>
                                        {priorityConfig[pendency.priority].label}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => removePendency(index)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {pendencies.length === 0 && !isAdding && (
                <div className="text-center py-8 text-gray-400">
                    <Flag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma pendência adicionada</p>
                </div>
            )}
        </div>
    );
};

export default PendencyForm;
