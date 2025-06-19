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
    const variants = {
      default: {
        container: "bg-white hover:bg-gray-50/80",
        icon: "bg-gray-50 text-gray-600",
        value: "text-gray-900",
        title: "text-gray-600"
      },
      success: {
        container: "bg-emerald-50/50 hover:bg-emerald-50",
        icon: "bg-emerald-100 text-emerald-600",
        value: "text-emerald-900",
        title: "text-emerald-700"
      },
      warning: {
        container: "bg-orange-50/50 hover:bg-orange-50",
        icon: "bg-orange-100 text-orange-600",
        value: "text-orange-900",
        title: "text-orange-700"
      },
      danger: {
        container: "bg-red-50/50 hover:bg-red-50",
        icon: "bg-red-100 text-red-600",
        value: "text-red-900",
        title: "text-red-700"
      },
      info: {
        container: "bg-blue-50/50 hover:bg-blue-50",
        icon: "bg-blue-100 text-blue-600",
        value: "text-blue-900",
        title: "text-blue-700"
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
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-medium px-2 py-1 rounded-full",
            trend.isPositive 
              ? "bg-emerald-100 text-emerald-700" 
              : "bg-red-100 text-red-700"
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