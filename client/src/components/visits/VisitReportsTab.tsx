import { useState, useRef } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import type { VisitFormData, IndividualNote } from '../../types/visit';

interface VisitReportsTabProps {
    formData: VisitFormData;
    setFormData: React.Dispatch<React.SetStateAction<VisitFormData>>;
    areas: any[];
    collaborators: any[];
    individualNotes: IndividualNote[];
    setIndividualNotes: React.Dispatch<React.SetStateAction<IndividualNote[]>>;
}

export const VisitReportsTab = ({
    formData,
    setFormData,
    areas,
    collaborators,
    individualNotes,
    setIndividualNotes
}: VisitReportsTabProps) => {
    // Recording State
    const [isRecording, setIsRecording] = useState<string | null>(null); // 'lideranca' | 'colaborador' | null
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                    setFormData(prev => ({
                        ...prev,
                        relatos: {
                            ...prev.relatos,
                            [field === 'lideranca' ? 'audioLideranca' : 'audioColaborador']: res.data.url
                        }
                    }));
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

        } catch (err) {
            console.error('Error accessing microphone', err);
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

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Área</label>
                    <select
                        className="input-field"
                        onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                        value={formData.areaId}
                    >
                        <option value="">Selecione a Área</option>
                        {areas
                            .filter(a => !formData.companyId || (a.sector && a.sector.companyId === formData.companyId))
                            .map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Colaboradores</label>
                    <select
                        className="input-field"
                        onChange={e => {
                            const val = e.target.value;
                            if (val && !formData.collaboratorIds.includes(val)) {
                                setFormData({ ...formData, collaboratorIds: [...formData.collaboratorIds, val] })
                            }
                        }}
                    >
                        <option value="">Adicionar...</option>
                        {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formData.collaboratorIds.map(id => {
                            const collab = collaborators.find(c => c.id === id);
                            return (
                                <span key={id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {collab?.name}
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, collaboratorIds: formData.collaboratorIds.filter(cid => cid !== id) })}
                                        className="ml-1 text-blue-600 hover:text-blue-800"
                                        aria-label={`Remover colaborador ${collab?.name}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">Relato da Liderança</label>
                <div className="relative">
                    <textarea
                        rows={4}
                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-4"
                        placeholder="Digite o relato..."
                        value={formData.relatos.lideranca}
                        onChange={e => setFormData({ ...formData, relatos: { ...formData.relatos, lideranca: e.target.value } })}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        {formData.relatos.audioLideranca ? (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                                <audio src={formData.relatos.audioLideranca} controls className="h-6 w-48" />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, relatos: { ...prev.relatos, audioLideranca: null } }))}
                                    className="text-red-500 hover:text-red-700"
                                    aria-label="Remover áudio da liderança"
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
                                    aria-label="Parar gravação"
                                >
                                    <Square size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => startRecording('lideranca')}
                                className="p-2 bg-primary text-white rounded-full hover:bg-blue-700 transition-colors"
                                title="Gravar áudio"
                                aria-label="Iniciar gravação de áudio da liderança"
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
                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-4"
                        placeholder="Digite o relato..."
                        value={formData.relatos.colaborador}
                        onChange={e => setFormData({ ...formData, relatos: { ...formData.relatos, colaborador: e.target.value } })}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        {formData.relatos.audioColaborador ? (
                            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
                                <audio src={formData.relatos.audioColaborador} controls className="h-6 w-48" />
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, relatos: { ...prev.relatos, audioColaborador: null } }))}
                                    className="text-red-500 hover:text-red-700"
                                    aria-label="Remover áudio do colaborador"
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
                                    aria-label="Parar gravação"
                                >
                                    <Square size={14} />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => startRecording('colaborador')}
                                className="p-2 bg-primary text-white rounded-full hover:bg-blue-700 transition-colors"
                                title="Gravar áudio"
                                aria-label="Iniciar gravação de áudio do colaborador"
                            >
                                <Mic className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">Relato da Consultoria</label>
                <div className="relative">
                    <textarea
                        rows={4}
                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-4"
                        placeholder="Digite o relato da consultoria..."
                        value={formData.relatos.consultoria}
                        onChange={e => setFormData({ ...formData, relatos: { ...formData.relatos, consultoria: e.target.value } })}
                    />
                </div>
            </div>

            {/* Individual Notes Section */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-lg font-medium text-gray-900">Observações Individuais</h3>
                {formData.collaboratorIds.length === 0 ? (
                    <p className="text-sm text-gray-500">Selecione colaboradores para adicionar observações individuais.</p>
                ) : (
                    <div className="grid gap-4">
                        {formData.collaboratorIds.map(collabId => {
                            const collab = collaborators.find(c => c.id === collabId);
                            const note = individualNotes.find(n => n.collaboratorId === collabId)?.content || '';

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
                                        onChange={e => {
                                            const newContent = e.target.value;
                                            setIndividualNotes(prev => {
                                                const existing = prev.find(n => n.collaboratorId === collabId);
                                                if (existing) {
                                                    return prev.map(n => n.collaboratorId === collabId ? { ...n, content: newContent } : n);
                                                }
                                                return [...prev, { collaboratorId: collabId, content: newContent }];
                                            });
                                        }}
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
