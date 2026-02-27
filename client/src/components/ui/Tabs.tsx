import React, { useState } from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
    badge?: string | number;
}

interface TabsProps {
    tabs: Tab[];
    defaultTab?: string;
    onChange?: (tabId: string) => void;
    className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
    tabs,
    defaultTab,
    onChange,
    className = '',
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        onChange?.(tabId);
    };

    const activeContent = tabs.find(tab => tab.id === activeTab)?.content;

    return (
        <div className={className}>
            {/* Tab Header */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`
              relative flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap
              transition-all duration-200
              ${activeTab === tab.id
                                ? 'text-blue-600'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }
            `}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.badge !== undefined && (
                            <span className={`
                px-2 py-0.5 text-xs rounded-full font-semibold
                ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
              `}>
                                {tab.badge}
                            </span>
                        )}
                        {/* Active Indicator */}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="py-6">
                {activeContent}
            </div>
        </div>
    );
};

export default Tabs;
