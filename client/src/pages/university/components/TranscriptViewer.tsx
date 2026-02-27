import React, { useState } from 'react';
import { Type, ZoomIn, ZoomOut, Moon, Sun } from 'lucide-react';

interface TranscriptViewerProps {
    text?: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ text }) => {
    const [fontSize, setFontSize] = useState(16);
    const [highContrast, setHighContrast] = useState(false);

    const handleZoomIn = () => setFontSize(prev => Math.min(prev + 2, 24));
    const handleZoomOut = () => setFontSize(prev => Math.max(prev - 2, 12));

    return (
        <div className={`rounded-xl p-6 shadow-sm transition-colors duration-300 ${highContrast ? 'bg-black text-yellow-400 ring-2 ring-yellow-400' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Transcrição
                </h3>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setHighContrast(!highContrast)}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Alto Contraste"
                    >
                        {highContrast ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-600 mx-1" />
                    <button
                        onClick={handleZoomOut}
                        disabled={fontSize <= 12}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        title="Diminuir Fonte"
                    >
                        <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-xs font-mono w-4 text-center">{fontSize}</span>
                    <button
                        onClick={handleZoomIn}
                        disabled={fontSize >= 24}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        title="Aumentar Fonte"
                    >
                        <ZoomIn className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div
                className="prose dark:prose-invert max-w-none whitespace-pre-wrap transition-all duration-200 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600"
                style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
            >
                {text ? (
                    text
                ) : (
                    <div className="text-center py-8 opacity-70 italic">
                        <p>[Transcrição automática indisponível no momento]</p>
                        <p className="text-sm mt-2">Estamos processando o conteúdo para acessibilidade.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
