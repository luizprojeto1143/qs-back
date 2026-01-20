import React from 'react';
import { Eye, Monitor, Type } from 'lucide-react';

interface AccessibilityControlsProps {
    focusMode: boolean;
    setFocusMode: (value: boolean) => void;
}

export const AccessibilityControls: React.FC<AccessibilityControlsProps> = ({ focusMode, setFocusMode }) => {
    return (
        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <button
                onClick={() => setFocusMode(!focusMode)}
                className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${focusMode
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 ring-2 ring-blue-500 ring-offset-1'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                title={focusMode ? "Sair do Modo Foco" : "Ativar Modo Foco"}
            >
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">Modo Foco</span>
            </button>

            {/* Expansível no futuro para mais controles globais */}
        </div>
    );
};
