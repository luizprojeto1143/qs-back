import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image, Video, File } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

interface Attachment {
    type: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
    url: string;
    name: string;
}

interface AttachmentUploaderProps {
    attachments: Attachment[];
    onAttachmentsChange: (attachments: Attachment[]) => void;
    maxFiles?: number;
    acceptedTypes?: string;
}

const getIcon = (type: string) => {
    switch (type) {
        case 'PHOTO': return <Image className="w-5 h-5" />;
        case 'VIDEO': return <Video className="w-5 h-5" />;
        case 'DOCUMENT': return <FileText className="w-5 h-5" />;
        default: return <File className="w-5 h-5" />;
    }
};

const getFileType = (file: File): 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' => {
    if (file.type.startsWith('image/')) return 'PHOTO';
    if (file.type.startsWith('video/')) return 'VIDEO';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
};

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
    attachments,
    onAttachmentsChange,
    maxFiles = 10,
    acceptedTypes = 'image/*,video/*,application/pdf,.doc,.docx',
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (attachments.length + files.length > maxFiles) {
            toast.error(`Máximo de ${maxFiles} arquivos permitido`);
            return;
        }

        setUploading(true);

        try {
            for (const file of Array.from(files)) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await api.post('/upload', formData);
                const url = response.data.url;

                const newAttachment: Attachment = {
                    type: getFileType(file),
                    url,
                    name: file.name,
                };

                onAttachmentsChange([...attachments, newAttachment]);
            }
            toast.success('Arquivo(s) enviado(s) com sucesso!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Erro ao enviar arquivo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        const updated = attachments.filter((_, i) => i !== index);
        onAttachmentsChange(updated);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Anexos</h3>

            {/* Upload Area */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${uploading
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/50'
                    }
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={acceptedTypes}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                        <span className="text-sm text-blue-600">Enviando...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-blue-600 font-medium">Clique para enviar</span>
                            <span className="text-gray-500"> ou arraste arquivos</span>
                        </div>
                        <span className="text-xs text-gray-400">
                            Imagens, vídeos, PDFs, documentos (máx. {maxFiles} arquivos)
                        </span>
                    </div>
                )}
            </div>

            {/* Attachments List */}
            {attachments.length > 0 && (
                <div className="space-y-2">
                    {attachments.map((attachment, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg text-gray-600 shadow-sm">
                                    {getIcon(attachment.type)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                        {attachment.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{attachment.type}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeAttachment(index)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AttachmentUploader;
