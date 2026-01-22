import { useState, useRef } from 'react';
import { Mic, Square, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useFormContext, useFieldArray } from 'react-hook-form';

import { api } from '../../lib/api';
import type { VisitFormData } from '../../schemas/visitSchema';
import { QuickAddModal } from '../modals/QuickAddModal';

interface AreaOption {
    id: string;
    name: string;
    sector?: { companyId: string };
}

interface CollaboratorOption {
    id: string;
    name: string;
}

interface VisitReportsTabProps {
    areas: AreaOption[];
    collaborators: CollaboratorOption[];
    onRefreshData?: () => void;
}

export const VisitReportsTab = ({
    areas,
    collaborators,
    onRefreshData
}: VisitReportsTabProps) => {
    const { register, watch, setValue, control, formState: { errors } } = useFormContext<VisitFormData>();

    // Watchers
    const watchCompanyId = watch('companyId');
    const watchAreaId = watch('areaId');
    const watchCollaboratorIds = watch('collaboratorIds') || [];
    const watchRelatos = watch('relatos');

    // Individual Notes Array
    const { fields, append, update } = useFieldArray({
        control,
        name: 'notes'
    });

    // Recording State
    const [isRecording, setIsRecording] = useState<string | null>(null);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [quickAddType, setQuickAddType] = useState<'area' | 'collaborator' | null>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startRecording = async (field: 'lideranca' | 'colaborador') => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const audioFile = new File([blob], `audio-${field}-${Date.now()}.webm`, { type: 'audio/webm' });
                const formDataUpload = new FormData();
                formDataUpload.append('file', audioFile);

                try {
                    const res = await api.post('/upload', formDataUpload);
                    const targetField = field === 'lideranca' ? 'relatos.audioLideranca' : 'relatos.audioColaborador';
                    setValue(targetField, res.data.url);
                    toast.success('Áudio gravado e salvo!');
                } catch (error) {
                    console.error('Upload error', error);
                    toast.error('Erro ao salvar áudio');
                }
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(field);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);

        } catch {
            toast.error('Erro ao acessar microfone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRecording(null);
            setMediaRecorder(null);
        }
    };

    const handleQuickAddSuccess = (newItem: unknown) => {
        const item = newItem as { id?: string; user?: { id?: string } };
        if (quickAddType === 'area') {
            setValue('areaId', item.id, { shouldValidate: true, shouldDirty: true });
        } else if (quickAddType === 'collaborator') {
            // A API retorna { user: {...}, profile: {...} } para colaboradores
            // Precisamos usar o userId que é o identificador correto para o collaboratorIds
            const newId = item.user?.id || item.id;
            if (newId) {
                const updatedIds = [...watchCollaboratorIds, newId];
                setValue('collaboratorIds', updatedIds, { shouldValidate: true, shouldDirty: true });
            }
        }
        // Atualizar a lista de colaboradores para que o nome apareça na UI
        if (onRefreshData) onRefreshData();
        setQuickAddType(null);
    };

    // Update notes when collaborators change
    const getNoteForCollab = (collabId: string) => {
        const existing = fields.find(f => f.collaboratorId === collabId);
        return existing;
    };

    const updateNote = (collabId: string, content: string) => {
        const index = fields.findIndex(f => f.collaboratorId === collabId);
        if (index >= 0) {
            // Update existing
            update(index, { collaboratorId: collabId, content });
        } else {
            // Add new
            append({ collaboratorId: collabId, content });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Área</label>
                        <button
                            type="button"
                            onClick={() => setQuickAddType('area')}
                            className="p-1 text-primary hover:bg-primary/10 rounded-full transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <select
                        className={`input-field ${errors.areaId ? 'border-red-500' : ''}`}
                        {...register('areaId')}
                    >
                        <option value="">Selecione a Área</option>
                        {areas
                            .filter(a => !watchCompanyId || (a.sector && a.sector.companyId === watchCompanyId))
                            .map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    {errors.areaId && <p className="text-xs text-red-500">{errors.areaId.message}</p>}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Colaboradores</label>
                        <button
                            type="button"
                            onClick={() => setQuickAddType('collaborator')}
                            className="p-1 text-primary hover:bg-primary/10 rounded-full transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </div>
                    <select
                        className={`input-field ${errors.collaboratorIds ? 'border-red-500' : ''}`}
                        onChange={e => {
                            const val = e.target.value;
                            if (val && !watchCollaboratorIds.includes(val)) {
                                setValue('collaboratorIds', [...watchCollaboratorIds, val]);
                            }
                        }}
                    >
                        <option value="">Adicionar...</option>
                        {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.collaboratorIds && <p className="text-xs text-red-500">{errors.collaboratorIds.message}</p>}

                    <div className="flex flex-wrap gap-2 mt-2">
                        {watchCollaboratorIds.map((id: string) => {
                            const collab = collaborators.find(c => c.id === id);
                            return (
                                <span key={id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {collab?.name}
                                    <button
                                        type="button"
                                        onClick={() => setValue('collaboratorIds', watchCollaboratorIds.filter((cid: string) => cid !== id))}
                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                    >
                                        ×
                                    </button>
                                </span>
                            )
                        })}
                    </div>
                </div>
            </div>

            {quickAddType && (
                <QuickAddModal
                    type={quickAddType}
                    companyId={watchCompanyId}
                    areaId={watchAreaId || undefined}
                    onSuccess={handleQuickAddSuccess}
                    onClose={() => setQuickAddType(null)}
                />
            )}

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">Relato da Liderança</label>
                <div className="relative">
                    <textarea
                        rows={4}
                        className="input-field p-4"
                        placeholder="Digite o relato..."
                        {...register('relatos.lideranca')}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        {watchRelatos.audioLideranca ? (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                                <audio src={watchRelatos.audioLideranca} controls className="h-6 w-48" />
                                <button
                                    type="button"
                                    onClick={() => setValue('relatos.audioLideranca', null)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : isRecording === 'lideranca' ? (
                            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full animate-pulse">
                                <span className="text-xs font-medium text-red-600">Gravando {formatTime(recordingTime)}</span>
                                <button
                                    type="button"
                                    onClick={stopRecording}
                                    className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                                >
                                    <Square size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => startRecording('lideranca')}
                                className="p-2 bg-primary text-white rounded-full hover:bg-blue-700 transition-colors"
                            >
                                <Mic className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">Relato do Colaborador</label>
                <div className="relative">
                    <textarea
                        rows={4}
                        className="input-field p-4"
                        placeholder="Digite o relato..."
                        {...register('relatos.colaborador')}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        {watchRelatos.audioColaborador ? (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                                <audio src={watchRelatos.audioColaborador} controls className="h-6 w-48" />
                                <button
                                    type="button"
                                    onClick={() => setValue('relatos.audioColaborador', null)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : isRecording === 'colaborador' ? (
                            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-full animate-pulse">
                                <span className="text-xs font-medium text-red-600">Gravando {formatTime(recordingTime)}</span>
                                <button
                                    type="button"
                                    onClick={stopRecording}
                                    className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                                >
                                    <Square size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => startRecording('colaborador')}
                                className="p-2 bg-primary text-white rounded-full hover:bg-blue-700 transition-colors"
                            >
                                <Mic className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">Relato da Consultoria</label>
                <textarea
                    rows={4}
                    className="input-field p-4"
                    placeholder="Digite o relato da consultoria..."
                    {...register('relatos.consultoria')}
                />
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-lg font-medium text-gray-900">Observações Individuais</h3>
                {watchCollaboratorIds.length === 0 ? (
                    <p className="text-sm text-gray-500">Selecione colaboradores para adicionar observações individuais.</p>
                ) : (
                    <div className="grid gap-4">
                        {watchCollaboratorIds.map((collabId: string) => {
                            const collab = collaborators.find(c => c.id === collabId);
                            const note = getNoteForCollab(collabId)?.content || '';

                            return (
                                <div key={collabId} className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        {collab?.name || 'Colaborador'}
                                    </label>
                                    <textarea
                                        className="input-field"
                                        rows={2}
                                        placeholder={`Observação sobre ${collab?.name?.split(' ')[0]}...`}
                                        value={note}
                                        onChange={e => updateNote(collabId, e.target.value)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
