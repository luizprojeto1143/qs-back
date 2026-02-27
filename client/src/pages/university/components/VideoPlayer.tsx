import React from 'react';

interface VideoPlayerProps {
    url: string;
    title: string;
    onEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, onEnded }) => {
    // Helper para extrair ID do YouTube
    const getYouTubeEmbedUrl = (url: string) => {
        try {
            let videoId = '';
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1]?.split('?')[0];
            } else if (url.includes('watch?v=')) {
                videoId = url.split('watch?v=')[1]?.split('&')[0];
            } else if (url.includes('embed/')) {
                videoId = url.split('embed/')[1]?.split('?')[0];
            }

            if (!videoId) return null; // Retorna null para usar o fallback de vídeo genérico se falhar

            // Adiciona rel=0 (videos relacionados do mesmo canal apenas) e enablejsapi=1 para controle futuro
            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
        } catch {
            return null;
        }
    };

    const embedUrl = getYouTubeEmbedUrl(url);

    if (embedUrl) {
        return (
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative group">
                <iframe
                    src={embedUrl}
                    title={`Vídeo da aula: ${title}`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                // Nota: onEnded via iframe requer API do YouTube (window.YT) ou mensagens postMessage. 
                // Para V1, mantemos simples.
                />
            </div>
        );
    }

    // Fallback para MP4 direto ou outros formatos
    return (
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg relative group flex items-center justify-center">
            {url.endsWith('.mp4') || url.includes('cloudinary') ? (
                <video
                    src={url}
                    controls
                    className="w-full h-full"
                    onEnded={onEnded}
                >
                    Seu navegador não suporta o elemento de vídeo.
                </video>
            ) : (
                <div className="text-white text-center p-4">
                    <p className="mb-2">Formato de vídeo não reconhecido.</p>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">
                        Abrir vídeo externamente
                    </a>
                </div>
            )}
        </div>
    );
};
