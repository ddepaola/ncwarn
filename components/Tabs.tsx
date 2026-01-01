'use client';

import { useState } from 'react';
import clsx from 'clsx';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  children?: (activeTab: string) => React.ReactNode;
  className?: string;
}

export default function Tabs({
  tabs,
  defaultTab,
  onChange,
  children,
  className,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className={className}>
      <div className="border-b border-gray-200">
        <nav className="flex gap-4 -mb-px" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={clsx(
                    'ml-1 px-2 py-0.5 text-xs rounded-full',
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {children && (
        <div className="mt-4" role="tabpanel">
          {children(activeTab)}
        </div>
      )}
    </div>
  );
}
