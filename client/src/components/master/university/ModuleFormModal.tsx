import React, { useState } from 'react';

interface ModuleFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { title: string; order: number }) => Promise<void>;
}

export const ModuleFormModal = ({ isOpen, onClose, onSubmit }: ModuleFormModalProps) => {
    const [moduleForm, setModuleForm] = useState({ title: '', order: 1 });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(moduleForm);
        setModuleForm({ title: '', order: 1 });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Novo Módulo</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="input-field w-full"
                        placeholder="Título do Módulo"
                        value={moduleForm.title}
                        onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
                        required
                    />
                    <input
                        type="number"
                        className="input-field w-full"
                        placeholder="Ordem (ex: 1)"
                        value={moduleForm.order}
                        onChange={e => setModuleForm({ ...moduleForm, order: Number(e.target.value) })}
                        required
                    />
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Criar Módulo</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
