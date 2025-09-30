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
        "flex flex-col gap-2 border-b border-slate-100 pb-4",
        variant !== 'default' ? "px-6 pt-6" : "px-4 pt-4"
      )}>
        <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              {Icon && <Icon className="h-4 w-4" />}
              <span className="uppercase tracking-wide">{title}</span>
            </div>
            {description && (
              <p className="text-sm text-slate-500 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {headerActions && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {headerActions}
            </div>
          )}
        </div>
      </div>
      
      <div className={cn(variant !== 'default' ? "px-6 py-6" : "px-4 py-4")}>{children}</div>
    </div>
  );
}
