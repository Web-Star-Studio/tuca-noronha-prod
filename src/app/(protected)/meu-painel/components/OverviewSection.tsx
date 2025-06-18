"use client";

import React from 'react';
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarDays, 
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OverviewSectionProps } from '../types/dashboard';
import { getReservationIconType, getReservationColor, getStatusVariant, getStatusLabel } from '../utils/reservations';
import NotificationItem from './NotificationItem';
import StatsOverviewCard from './StatsOverviewCard';

const ReservationIcon = ({ type }: { type: string }) => {
  const IconComponent = getReservationIconType(type);
  return <IconComponent className="h-5 w-5 text-white" />;
};

const OverviewSection: React.FC<OverviewSectionProps> = ({ 
  reservations, 
  notifications, 
  onMarkAsRead, 
  onSectionChange,
  stats
}) => {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StatsOverviewCard stats={stats} />
      </motion.div>
      
      {/* Main Content Grid - Reservations & Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Latest Reservations */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Próximas Reservas {reservations.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-1">({reservations.length})</span>
              )}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => onSectionChange('reservas')}
            >
              Ver Todas
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {reservations.length > 0 ? (
              <div className="space-y-3">
                {reservations.slice(0, 4).map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getReservationColor(reservation.type)} flex-shrink-0`}>
                        <ReservationIcon type={reservation.type} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-gray-900 truncate">{reservation.name}</p>
                        <p className="text-xs text-gray-500 truncate">{reservation.location}</p>
                      </div>
                    </div>
                    <Badge variant={getStatusVariant(reservation.status)} className="text-xs ml-2 flex-shrink-0">
                      {getStatusLabel(reservation.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm mb-3">Você não possui reservas futuras</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => onSectionChange('reservas')}
                >
                  Explorar opções
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Notifications */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-gray-900">Notificações</CardTitle>
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-1">
                  {notifications.filter(n => !n.read).length}
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => {}}
            >
              Ver Todas
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.slice(0, 4).map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification}
                    onClick={() => onMarkAsRead(notification.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">Nenhuma notificação</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OverviewSection; 