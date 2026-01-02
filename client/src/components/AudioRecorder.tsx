import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react';

interface AudioRecorderProps {
    label: string;
    onRecordingComplete: (blob: Blob, transcription: string) => void;
    onTranscriptionChange?: (text: string) => void;
    initialTranscription?: string;
    audioUrl?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
    label,
    onRecordingComplete,
    onTranscriptionChange,
    initialTranscription = '',
    audioUrl,
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [hasRecording, setHasRecording] = useState(!!audioUrl);
    const [isPlaying, setIsPlaying] = useState(false);
    const [transcription, setTranscription] = useState(initialTranscription);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(blob, transcription);
                setHasRecording(true);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const deleteRecording = () => {
        setHasRecording(false);
        setTranscription('');
        onTranscriptionChange?.('');
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTranscriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTranscription(e.target.value);
        onTranscriptionChange?.(e.target.value);
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{label}</h3>
                {hasRecording && (
                    <button
                        onClick={deleteRecording}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Recording Controls */}
            <div className="flex items-center gap-4">
                {!isRecording ? (
                    <button
                        onClick={startRecording}
                        disabled={hasRecording}
                        className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all
              ${hasRecording
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25'
                            }
            `}
                    >
                        <Mic className="w-4 h-4" />
                        {hasRecording ? 'Gravado' : 'Iniciar Gravação'}
                    </button>
                ) : (
                    <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-gray-700 to-gray-800 text-white hover:from-gray-800 hover:to-gray-900 shadow-lg"
                    >
                        <Square className="w-4 h-4" />
                        Parar ({formatTime(recordingTime)})
                    </button>
                )}

                {isRecording && (
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-600">Gravando...</span>
                    </div>
                )}
            </div>

            {/* Audio Playback */}
            {hasRecording && audioUrl && (
                <audio ref={audioRef} src={audioUrl} className="w-full" controls />
            )}

            {/* Transcription */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    Transcrição / Anotações
                </label>
                <textarea
                    value={transcription}
                    onChange={handleTranscriptionChange}
                    placeholder="Digite aqui as anotações ou transcrição do áudio..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
            </div>
        </div>
    );
};

export default AudioRecorder;
