import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    hover = false,
    padding = 'md',
    onClick,
}) => {
    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
    };

    return (
        <div
            onClick={onClick}
            className={`
        bg-white rounded-2xl shadow-sm border border-gray-100
        ${hover ? 'hover:shadow-lg hover:border-gray-200 transition-all duration-300 cursor-pointer transform hover:-translate-y-1' : ''}
        ${paddings[padding]}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
};

interface CardHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
        {children}
    </div>
);

interface CardTitleProps {
    children: React.ReactNode;
    className?: string;
    icon?: React.ReactNode;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '', icon }) => (
    <div className={`flex items-center gap-3 ${className}`}>
        {icon && (
            <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-blue-600">
                {icon}
            </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900">{children}</h3>
    </div>
);

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => (
    <div className={className}>{children}</div>
);

interface CardFooterProps {
    children: React.ReactNode;
    className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => (
    <div className={`flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100 ${className}`}>
        {children}
    </div>
);

export default Card;
