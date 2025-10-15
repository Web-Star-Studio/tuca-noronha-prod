import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardPageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColorClassName?: string;
  iconBgClassName?: string;
  iconAction?: () => void; // Optional click action for the icon
  children?: React.ReactNode; // For action buttons
}

export function DashboardPageHeader({
  title,
  description,
  icon: Icon,
  iconColorClassName = 'text-blue-600',
  iconBgClassName = 'bg-blue-50',
  iconAction,
  children,
}: DashboardPageHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-start gap-4 sm:items-center">
          {iconAction ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={iconAction}
              className={`w-12 h-12 ${iconBgClassName} rounded-xl hover:scale-105 hover:shadow-md transition-all duration-200 flex items-center justify-center flex-shrink-0 cursor-pointer`}
              title="Voltar"
            >
              <Icon className={`h-6 w-6 ${iconColorClassName}`} />
            </Button>
          ) : (
            <div className={`w-12 h-12 ${iconBgClassName} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-6 w-6 ${iconColorClassName}`} />
            </div>
          )}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {children}
          </div>
        )}
      </div>
    </div>
  );
} 
