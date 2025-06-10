"use client";

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Gift, Bell, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transitionEffects, buttonStyles } from "@/lib/ui-config";
import { toast } from "sonner";
import { NotificationItemProps } from '../types/dashboard';

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onClick 
}) => {
  const { title, description, date, read, type } = notification;
  const [isRead, setIsRead] = useState(read);

  const getIconByType = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'promotion':
        return <Gift className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColorByType = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'promotion':
        return 'bg-purple-50 border-l-4 border-purple-500';
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  const handleReadToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRead(!isRead);
    toast.success(`Notificação marcada como ${!isRead ? 'lida' : 'não lida'}`);
  };

  return (
    <motion.div
      className={`p-4 ${!isRead ? getColorByType() : 'border-l-4 border-transparent'} ${transitionEffects.appear.fadeIn} hover:bg-gray-50 transition-colors duration-200 cursor-pointer`}
      whileHover={{ backgroundColor: '#F8FAFC' }}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          {getIconByType()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
              {title}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {format(date, "dd/MM HH:mm", { locale: ptBR })}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 rounded-full ${!isRead ? buttonStyles.variant.soft : 'text-gray-400'}`}
                onClick={handleReadToggle}
                aria-label={isRead ? "Marcar como não lida" : "Marcar como lida"}
              >
                <Circle className={`h-3 w-3 ${!isRead ? 'fill-primary stroke-primary' : 'stroke-gray-400'}`} />
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {description}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {format(date, "'Recebido em' dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationItem; 