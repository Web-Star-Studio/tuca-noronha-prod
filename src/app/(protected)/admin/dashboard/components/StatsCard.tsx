import React from 'react';
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className
}: StatsCardProps) {
  const getVariantStyles = () => {
    const base = {
      container: "bg-white hover:bg-slate-50",
      icon: "bg-slate-100 text-slate-500",
      value: "text-slate-900",
      title: "text-slate-500"
    };

    const variants = {
      default: base,
      success: {
        ...base,
        icon: "bg-emerald-50 text-emerald-600",
        title: "text-emerald-600"
      },
      warning: {
        ...base,
        icon: "bg-amber-50 text-amber-600",
        title: "text-amber-600"
      },
      danger: {
        ...base,
        icon: "bg-rose-50 text-rose-600",
        title: "text-rose-600"
      },
      info: {
        ...base,
        icon: "bg-blue-50 text-blue-600",
        title: "text-blue-600"
      }
    };

    return variants[variant];
  };

  const styles = getVariantStyles();

  return (
    <div 
      className={cn(
        "p-4 rounded-xl border border-gray-200/50 transition-all duration-200",
        styles.container,
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.isPositive 
              ? "bg-emerald-50 text-emerald-700" 
              : "bg-rose-50 text-rose-700"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <div className={cn("text-2xl font-bold", styles.value)}>
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </div>
        
        <div className={cn("text-sm font-medium", styles.title)}>
          {title}
        </div>
        
        {subtitle && (
          <div className="text-xs text-gray-500">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
} 
