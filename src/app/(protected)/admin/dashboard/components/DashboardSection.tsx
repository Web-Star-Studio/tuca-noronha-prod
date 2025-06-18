import React from 'react';
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered';
}

export function DashboardSection({
  title,
  description,
  icon: Icon,
  children,
  className,
  headerActions,
  variant = 'default'
}: DashboardSectionProps) {
  const getVariantStyles = () => {
    const variants = {
      default: "bg-white",
      elevated: "bg-white rounded-xl border border-gray-200/50 shadow-sm",
      bordered: "bg-white rounded-xl border border-gray-200/50"
    };
    return variants[variant];
  };

  return (
    <div className={cn(getVariantStyles(), className)}>
      <div className={cn(
        "flex items-center justify-between mb-6",
        variant !== 'default' && "p-6 pb-4"
      )}>
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {description && (
              <p className="text-gray-500 text-sm mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {headerActions && (
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        )}
      </div>
      
      <div className={cn(variant !== 'default' && "px-6 pb-6")}>
        {children}
      </div>
    </div>
  );
} 