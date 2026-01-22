import React from 'react';
import { Monitor, Type, ZoomIn, ZoomOut, Contrast } from 'lucide-react';

interface AccessibilityControlsProps {
    focusMode: boolean;
    setFocusMode: (value: boolean) => void;
    fontSize?: 'small' | 'medium' | 'large';
    setFontSize?: (value: 'small' | 'medium' | 'large') => void;
    highContrast?: boolean;
    setHighContrast?: (value: boolean) => void;
}

export const AccessibilityControls: React.FC<AccessibilityControlsProps> = ({
    focusMode,
    setFocusMode,
    fontSize = 'medium',
    setFontSize,
    highContrast = false,
    setHighContrast
}) => {
    const cycleFontSize = () => {
        if (!setFontSize) return;
        const sizes: ('small' | 'medium' | 'large')[] = ['small', 'medium', 'large'];
        const currentIndex = sizes.indexOf(fontSize);
        const nextIndex = (currentIndex + 1) % sizes.length;
        setFontSize(sizes[nextIndex]);
    };

    const fontSizeLabel = {
        small: 'A',
        medium: 'A+',
        large: 'A++'
    };

    return (
        <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            {/* Focus Mode */}
            <button
                onClick={() => setFocusMode(!focusMode)}
                className={`p-2 rounded-md transition-all flex items-center gap-1.5 text-sm font-medium ${focusMode
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-2 ring-blue-500 ring-offset-1'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                title={focusMode ? "Sair do Modo Foco" : "Ativar Modo Foco (oculta menu lateral)"}
                aria-pressed={focusMode}
            >
                <Monitor className="h-4 w-4" />
                <span className="hidden md:inline">Foco</span>
            </button>

            {/* Font Size Control */}
            {setFontSize && (
                <button
                    onClick={cycleFontSize}
                    className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-1.5 text-sm font-medium"
                    title={`Tamanho da fonte: ${fontSize === 'small' ? 'Pequeno' : fontSize === 'medium' ? 'Médio' : 'Grande'}`}
                    aria-label="Alterar tamanho da fonte"
                >
                    <Type className="h-4 w-4" />
                    <span className="font-bold text-xs">{fontSizeLabel[fontSize]}</span>
                </button>
            )}

            {/* High Contrast Toggle */}
            {setHighContrast && (
                <button
                    onClick={() => setHighContrast(!highContrast)}
                    className={`p-2 rounded-md transition-all flex items-center gap-1.5 text-sm font-medium ${highContrast
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 ring-2 ring-yellow-500 ring-offset-1'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    title={highContrast ? "Desativar Alto Contraste" : "Ativar Alto Contraste"}
                    aria-pressed={highContrast}
                >
                    <Contrast className="h-4 w-4" />
                    <span className="hidden lg:inline">Contraste</span>
                </button>
            )}
        </div>
    );
};
