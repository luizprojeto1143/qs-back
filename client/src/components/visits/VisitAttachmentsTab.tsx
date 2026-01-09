import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { api } from '../../lib/api';
import type { VisitFormData } from '../../schemas/visitSchema';

export const VisitAttachmentsTab = () => {
    const { control, watch } = useFormContext<VisitFormData>();
    const { append, remove } = useFieldArray({
        control,
        name: 'anexos'
    });

    // We can use watch too if we just want to list them
    const anexos = watch('anexos');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const MAX_SIZE = 10 * 1024 * 1024; // 10MB

            if (file.size > MAX_SIZE) {
                toast.error('Arquivo muito grande! O limite é 10MB.');
                return;
            }

            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            try {
                const res = await api.post('/upload', formDataUpload);

                append({
                    name: file.name,
                    url: (res.data as any).url,
                    type: file.type,
                    // size: file.size // Not in schema, skipping
                });

                toast.success('Arquivo enviado com sucesso!');
            } catch (error) {
                console.error('Upload error', error);
                toast.error('Erro ao enviar arquivo');
            }
        }
    };

    return (
        <div className="space-y-6">
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer bg-gray-50">
                <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf,video/*"
                />
                <Upload className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm font-medium text-gray-900">Clique para enviar arquivo</p>
                <p className="text-xs text-gray-500">PNG, JPG, PDF, MP4 até 10MB</p>
            </label>

            {anexos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {anexos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-gray-100 p-2 rounded-lg">
                                    <Upload size={20} className="text-gray-500" />
                                </div>
                                <div className="truncate">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">{file.name}</h4>
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Download</a>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-gray-400 hover:text-red-500 p-2"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
