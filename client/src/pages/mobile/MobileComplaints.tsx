
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Send, Video, MessageSquare, EyeOff,
    AlertTriangle, Camera, X
} from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { useCompany } from '../../contexts/CompanyContext';

const MobileComplaints = () => {
    const navigate = useNavigate();
    const { companies } = useCompany();
    const currentCompany = companies[0]; // Assuming collaborator context

    const [step, setStep] = useState(1);
    const [type, setType] = useState<'TEXTO' | 'VIDEO_LIBRAS' | 'ANONIMO' | null>(null);
    const [category, setCategory] = useState('');
    const [content, setContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [sending, setSending] = useState(false);

    // Check if enabled
    if (currentCompany && !currentCompany.systemSettings?.complaintsEnabled) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <AlertTriangle className="h-12 w-12 text-gray-300 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Funcionalidade Indisponível</h2>
                <p className="text-gray-500 mt-2">O Canal de Ética não está habilitado para sua empresa.</p>
                <button
                    onClick={() => navigate('/app')}
                    className="mt-6 text-blue-600 font-medium"
                >
                    Voltar ao Início
                </button>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!type || !category) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        if (type === 'VIDEO_LIBRAS' && !videoUrl) {
            toast.error('Adicione o link do vídeo');
            return;
        }

        if (type !== 'VIDEO_LIBRAS' && !content) {
            toast.error('Descreva o relato');
            return;
        }

        setSending(true);
        try {
            await api.post('/complaints', {
                companyId: currentCompany?.id,
                type,
                category,
                content: type === 'VIDEO_LIBRAS' ? undefined : content,
                videoUrl: type === 'VIDEO_LIBRAS' ? videoUrl : undefined,
                severity: 'MEDIO' // Default, will be validated by Master
            });

            toast.success('Relato enviado com sucesso! Seus dados estão seguros.');
            setTimeout(() => navigate('/app'), 2000);
        } catch (error) {
            console.error('Error sending complaint', error);
            toast.error('Erro ao enviar relato. Tente novamente.');
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-10 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
                    <ArrowLeft className="h-6 w-6" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">Canal de Ética</h1>
            </div>

            <div className="p-4 space-y-6">
                {/* Introduction */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-blue-900 text-sm">Ambiente Seguro</h3>
                            <p className="text-xs text-blue-700 mt-1">
                                Este é um canal seguro e confidencial. Seus relatos serão analisados por especialistas externos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step 1: Type Selection */}
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="font-bold text-gray-900">Como você prefere fazer seu relato?</h2>

                        <button
                            onClick={() => { setType('TEXTO'); setStep(2); }}
                            className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-98 transition-transform"
                        >
                            <div className="bg-orange-50 p-3 rounded-full">
                                <MessageSquare className="h-6 w-6 text-orange-600" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-900">Relato por Texto</span>
                                <span className="text-xs text-gray-500">Escreva o que aconteceu</span>
                            </div>
                        </button>

                        <button
                            onClick={() => { setType('VIDEO_LIBRAS'); setStep(2); }}
                            className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-98 transition-transform"
                        >
                            <div className="bg-blue-50 p-3 rounded-full">
                                <Video className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-900">Vídeo em Libras</span>
                                <span className="text-xs text-gray-500">Envie um vídeo sinalizando</span>
                            </div>
                        </button>

                        <button
                            onClick={() => { setType('ANONIMO'); setStep(2); }}
                            className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 active:scale-98 transition-transform"
                        >
                            <div className="bg-gray-100 p-3 rounded-full">
                                <EyeOff className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-900">Relato Anônimo</span>
                                <span className="text-xs text-gray-500">Sua identidade não será revelada</span>
                            </div>
                        </button>
                    </div>
                )}

                {/* Step 2: Form */}
                {step === 2 && (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Qual o assunto?</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Selecione...</option>
                                <option value="Assédio">Assédio Moral ou Sexual</option>
                                <option value="Discriminação">Discriminação / Preconceito</option>
                                <option value="Acessibilidade">Falta de Acessibilidade</option>
                                <option value="Conduta">Má Conduta / Ética</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>

                        {type === 'VIDEO_LIBRAS' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Link do Vídeo</label>
                                <div className="space-y-3">
                                    <input
                                        type="url"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="Cole o link do vídeo (Drive, Youtube, etc)"
                                        className="w-full p-3 bg-white border border-gray-300 rounded-xl"
                                        required
                                    />
                                    <p className="text-xs text-gray-500">
                                        Grave seu vídeo em Libras, suba em uma plataforma e cole o link aqui. Nossa equipe fará a tradução sigilosa.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">O que aconteceu?</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Descreva a situação com o máximo de detalhes possível..."
                                    className="w-full p-3 bg-white border border-gray-300 rounded-xl h-40 resize-none"
                                    required={type !== 'VIDEO_LIBRAS'}
                                />
                            </div>
                        )}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 active:scale-98 transition-transform disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {sending ? 'Enviando...' : (
                                    <>
                                        <Send className="h-5 w-5" />
                                        Enviar Relato Seguro
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                disabled={sending}
                                className="w-full py-4 text-gray-500 font-medium mt-2"
                            >
                                Voltar
                            </button>
                        </div>

                    </form>
                )}
            </div>
        </div>
    );
};

export default MobileComplaints;
