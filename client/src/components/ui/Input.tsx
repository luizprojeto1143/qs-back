import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    helperText?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    helperText,
    className = '',
    id,
    ...props
}) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
            block w-full rounded-xl border transition-all duration-200
            ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
            ${error
                            ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50'
                            : 'border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-300'
                        }
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
            {helperText && !error && (
                <p className="text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
};

export default Input;
