import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface DashboardPageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColorClassName?: string;
  iconBgClassName?: string;
  children?: React.ReactNode; // For action buttons
}

export function DashboardPageHeader({
  title,
  description,
  icon: Icon,
  iconColorClassName = 'text-blue-600',
  iconBgClassName = 'bg-blue-50',
  children,
}: DashboardPageHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 ${iconBgClassName} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-6 w-6 ${iconColorClassName}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {title}
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        {children && (
          <div className="flex items-center gap-3">
            {children}
          </div>
        )}
      </div>
    </div>
  );
} 