import React, { useState } from 'react';

interface CourseFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    companies: { id: string; name: string }[];
}

export const CourseFormModal = ({ isOpen, onClose, onSubmit, companies }: CourseFormModalProps) => {
    const [courseForm, setCourseForm] = useState({
        title: '',
        description: '',
        coverUrl: '',
        category: '',
        duration: 0,
        isMandatory: false,
        publishedAt: '',
        visibleToAll: false,
        allowedCompanyIds: [] as string[]
    });

    if (!isOpen) return null;

    const toggleCompanySelection = (companyId: string) => {
        setCourseForm(prev => {
            const current = prev.allowedCompanyIds || [];
            if (current.includes(companyId)) {
                return { ...prev, allowedCompanyIds: current.filter(id => id !== companyId) };
            } else {
                return { ...prev, allowedCompanyIds: [...current, companyId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(courseForm);
        setCourseForm({
            title: '', description: '', coverUrl: '', category: '', duration: 0, isMandatory: false, publishedAt: '',
            visibleToAll: false, allowedCompanyIds: []
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Novo Curso</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="input-field w-full"
                        placeholder="Título do Curso"
                        value={courseForm.title}
                        onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                        required
                    />
                    <textarea
                        className="input-field w-full"
                        placeholder="Descrição"
                        value={courseForm.description}
                        onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                        required
                    />
                    <input
                        className="input-field w-full"
                        placeholder="URL da Imagem de Capa"
                        value={courseForm.coverUrl}
                        onChange={e => setCourseForm({ ...courseForm, coverUrl: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            className="input-field w-full"
                            placeholder="Categoria (ex: Inclusão)"
                            value={courseForm.category}
                            onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}
                            required
                        />
                        <input
                            type="number"
                            className="input-field w-full"
                            placeholder="Duração (min)"
                            value={courseForm.duration}
                            onChange={e => setCourseForm({ ...courseForm, duration: Number(e.target.value) })}
                            required
                        />
                    </div>

                    {/* Visibility Settings */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Visibilidade</h3>
                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                            <input
                                type="checkbox"
                                checked={courseForm.visibleToAll}
                                onChange={e => setCourseForm({ ...courseForm, visibleToAll: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Disponível para todas as empresas</span>
                        </label>

                        {!courseForm.visibleToAll && (
                            <div className="space-y-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                                <p className="text-xs text-gray-500 mb-2">Selecione as empresas permitidas:</p>
                                {companies.map(company => (
                                    <label key={company.id} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={courseForm.allowedCompanyIds.includes(company.id)}
                                            onChange={() => toggleCompanySelection(company.id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{company.name}</span>
                                    </label>
                                ))}
                                {companies.length === 0 && <p className="text-xs text-gray-400">Nenhuma empresa encontrada.</p>}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={courseForm.isMandatory}
                                onChange={e => setCourseForm({ ...courseForm, isMandatory: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Curso Obrigatório</span>
                        </label>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Data de Lançamento (Opcional)</label>
                            <input
                                type="datetime-local"
                                className="input-field w-full"
                                value={courseForm.publishedAt}
                                onChange={e => setCourseForm({ ...courseForm, publishedAt: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Criar Curso</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
