"use client";

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Gift, Bell, Circle, Dot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ui } from "@/lib/ui-config";
import { toast } from "sonner";
import { NotificationItemProps } from '../types/dashboard';

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onClick 
}) => {
  const { title, description, date, read, type } = notification;
  const [isRead, setIsRead] = useState(read);

  const getIconByType = () => {
    const iconMap = {
      success: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
      promotion: { icon: Gift, color: "text-purple-500", bg: "bg-purple-50" },
      default: { icon: Bell, color: "text-blue-500", bg: "bg-blue-50" },
    };

    const { icon: IconComponent, color, bg } = iconMap[type] || iconMap.default;
    return (
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center border border-white/80 shadow-sm`}>
        <IconComponent className={`h-5 w-5 ${color}`} />
      </div>
    );
  };

  const handleReadToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRead(!isRead);
    toast.success(`Notificação marcada como ${!isRead ? 'lida' : 'não lida'}`);
  };

  const getNotificationStyle = () => {
    if (isRead) {
      return "bg-gray-50/70 hover:bg-gray-100/70 border-gray-200/50";
    }
    
    const typeStyles = {
      success: "bg-emerald-50/50 hover:bg-emerald-50 border-l-emerald-400",
      promotion: "bg-purple-50/50 hover:bg-purple-50 border-l-purple-400",
      default: "bg-blue-50/50 hover:bg-blue-50 border-l-blue-400",
    };

    return typeStyles[type] || typeStyles.default;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`relative p-4 rounded-xl border border-l-2 transition-all duration-200 cursor-pointer group ${getNotificationStyle()}`}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          {getIconByType()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h4 className={`text-sm font-medium leading-tight ${
              !isRead ? "text-gray-900" : "text-gray-600"
            }`}>
              {title}
            </h4>
            
            <div className="flex items-center gap-2 ml-3">
              {!isRead && (
                <Dot className="w-4 h-4 text-blue-500 fill-blue-500" />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 rounded-full hover:bg-white/80"
                onClick={handleReadToggle}
                aria-label={isRead ? "Marcar como não lida" : "Marcar como lida"}
              >
                <Circle className={`h-3 w-3 ${
                  !isRead 
                    ? 'fill-blue-500 stroke-blue-500' 
                    : 'stroke-gray-400 hover:stroke-blue-500'
                }`} />
              </Button>
            </div>
          </div>
          
          <p className={`text-sm leading-relaxed mb-3 ${
            !isRead ? "text-gray-700" : "text-gray-500"
          }`}>
            {description}
          </p>
          
          <div className="flex items-center justify-between">
            <time className="text-xs text-gray-400" dateTime={date.toISOString()}>
              {format(date, "dd/MM 'às' HH:mm", { locale: ptBR })}
            </time>
            
            {!isRead && (
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Nova
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationItem; 