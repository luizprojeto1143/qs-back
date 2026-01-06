import React, { useState } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../lib/api';

interface LessonFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any, attachments: any[]) => Promise<void>;
}

export const LessonFormModal = ({ isOpen, onClose, onSubmit }: LessonFormModalProps) => {
    const [lessonForm, setLessonForm] = useState({ title: '', description: '', videoUrl: '', transcription: '', duration: 0, order: 1 });
    const [attachments, setAttachments] = useState<{ name: string, url: string, type: string }[]>([]);
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/upload', formData);
            setAttachments([...attachments, {
                name: file.name,
                url: response.data.url,
                type: file.type.includes('pdf') ? 'PDF' : 'OTHER'
            }]);
            toast.success('Arquivo enviado!');
        } catch {
            toast.error('Erro no upload');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(lessonForm, attachments);
        setLessonForm({ title: '', description: '', videoUrl: '', transcription: '', duration: 0, order: 1 });
        setAttachments([]);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 dark:text-white">Nova Aula</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        className="input-field w-full"
                        placeholder="Título da Aula"
                        value={lessonForm.title}
                        onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                        required
                    />
                    <input
                        className="input-field w-full"
                        placeholder="URL do Vídeo (YouTube/Vimeo)"
                        value={lessonForm.videoUrl}
                        onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                        required
                    />
                    <textarea
                        className="input-field w-full h-32"
                        placeholder="Transcrição da Aula (Opcional)"
                        value={lessonForm.transcription}
                        onChange={e => setLessonForm({ ...lessonForm, transcription: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            className="input-field w-full"
                            placeholder="Duração (min)"
                            value={lessonForm.duration}
                            onChange={e => setLessonForm({ ...lessonForm, duration: Number(e.target.value) })}
                            required
                        />
                        <input
                            type="number"
                            className="input-field w-full"
                            placeholder="Ordem"
                            value={lessonForm.order}
                            onChange={e => setLessonForm({ ...lessonForm, order: Number(e.target.value) })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Material de Apoio (PDFs)</label>
                        <div className="flex items-center gap-2">
                            <label className="btn-secondary cursor-pointer flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                {uploading ? 'Enviando...' : 'Adicionar Arquivo'}
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} disabled={uploading} />
                            </label>
                        </div>
                        {attachments.length > 0 && (
                            <ul className="space-y-1 mt-2">
                                {attachments.map((att, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded">
                                        <FileText className="h-3 w-3" />
                                        <span className="flex-1 truncate">{att.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-primary">Criar Aula</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
