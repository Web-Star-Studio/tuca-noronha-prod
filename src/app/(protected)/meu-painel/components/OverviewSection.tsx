"use client";

import React from 'react';
import { motion } from "framer-motion";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
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
import StatsOverviewCard from './StatsOverviewCard';
import NotificationsSection from './NotificationsSection';

const ReservationIcon = ({ type }: { type: string }) => {
  const IconComponent = getReservationIconType(type);
  return <IconComponent className="h-5 w-5 text-white" />;
};

const OverviewSection: React.FC<OverviewSectionProps> = ({ 
  reservations,
  stats
}) => {
  const router = useRouter();
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
        <Card className="bg-white shadow-sm border border-gray-200/50">
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
              onClick={() => router.push('/reservas/')}
            >
              Ver Todas
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {reservations.length > 0 ? (
              <div className="space-y-3">
                {reservations.slice(0, 4).map((reservation) => (
                  <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50/70 rounded-xl border border-gray-200/50 hover:bg-gray-100/70 transition-colors duration-200">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getReservationColor(reservation.type)} flex-shrink-0 shadow-sm`}>
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
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm mb-3">Você não possui reservas futuras</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => router.push('/reservas/')}
                >
                  Explorar opções
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Notifications - Using new NotificationsSection component */}
        <NotificationsSection compact maxItems={4} />
      </motion.div>
    </div>
  );
};

export default OverviewSection; 