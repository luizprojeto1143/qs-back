import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import type { VisitFormData } from '../../types/visit';

interface VisitAttachmentsTabProps {
    formData: VisitFormData;
    setFormData: React.Dispatch<React.SetStateAction<VisitFormData>>;
}

export const VisitAttachmentsTab = ({ formData, setFormData }: VisitAttachmentsTabProps) => {
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

                setFormData(prev => ({
                    ...prev,
                    anexos: [...prev.anexos, {
                        name: file.name,
                        url: res.data.url,
                        type: file.type,
                        size: file.size
                    }]
                }));
                toast.success('Arquivo enviado com sucesso!');
            } catch (error) {
                console.error('Upload error', error);
                toast.error('Erro ao enviar arquivo');
            }
        }
    };

    const removeAttachment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            anexos: prev.anexos.filter((_, i) => i !== index)
        }));
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

            {formData.anexos.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formData.anexos.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-gray-100 p-2 rounded-lg">
                                    <Upload size={20} className="text-gray-500" />
                                </div>
                                <div className="truncate">
                                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeAttachment(index)}
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
