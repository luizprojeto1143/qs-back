import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    path: string;
    active: boolean;
    onClick?: () => void;
    className?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
    icon: Icon,
    label,
    path,
    active,
    onClick,
    className
}) => {
    const navigate = useNavigate();
    return (
        <button
            onClick={() => {
                navigate(path);
                if (onClick) onClick();
            }}
            className={`
        w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${active
                    ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-900/50'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                } ${className || ''}`}
        >
            <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
            <span>{label}</span>
        </button>
    );
};
