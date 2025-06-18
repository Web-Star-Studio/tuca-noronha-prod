import React from 'react';
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actions: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'outline' | 'secondary';
    badge?: number;
  }>;
  className?: string;
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  actions,
  className
}: ActionCardProps) {
  return (
    <div className={cn(
      "p-5 rounded-xl border border-gray-200/50 bg-white hover:bg-gray-50/50 transition-all duration-200",
      className
    )}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {actions.map((action, index) => {
          const ButtonComponent = (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              className="flex items-center gap-2"
              onClick={action.onClick}
            >
              {action.label}
              {action.badge && action.badge > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1.5 text-xs">
                  {action.badge > 99 ? '99+' : action.badge}
                </Badge>
              )}
            </Button>
          );

          if (action.href) {
            return (
              <Link key={index} href={action.href}>
                {ButtonComponent}
              </Link>
            );
          }

          return ButtonComponent;
        })}
      </div>
    </div>
  );
} 