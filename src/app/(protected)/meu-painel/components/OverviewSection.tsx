"use client";

import React from 'react';
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarDays, 
  Plus,
  Compass,
  Sparkles,
  User,
  HelpCircle,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonStyles, cardStyles } from "@/lib/ui-config";
import { OverviewSectionProps } from '../types/dashboard';
import { getReservationIconType, getReservationColor, getStatusVariant, getStatusLabel } from '../utils/reservations';
import NotificationItem from './NotificationItem';
import Link from "next/link";
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { toast } from 'sonner';

const ReservationIcon = ({ type }: { type: string }) => {
  const IconComponent = getReservationIconType(type);
  return <IconComponent className="h-5 w-5 text-white" />;
};

const OverviewSection: React.FC<OverviewSectionProps> = ({ 
  reservations, 
  notifications, 
  onMarkAsRead, 
  onSectionChange 
}) => {
  const seedTestData = useMutation(api.domains.bookings.mutations.seedTestReservations);

  const handleSeedTestData = async () => {
    try {
      const result = await seedTestData({ travelerEmail: "traveler@example.com" });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erro ao criar dados de teste: " + (error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="bg-white shadow-sm border-t-4 border-blue-500">
        <CardHeader>
          <CardTitle className="text-base md:text-lg text-blue-700">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6 pb-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            <Button 
              onClick={() => onSectionChange('reservas')} 
              variant="outline" 
              className="h-auto flex flex-col items-center justify-center py-3 md:py-4 px-2 gap-2 text-center border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 min-h-[80px] md:min-h-[90px]"
            >
              <CalendarDays className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
              <span className="text-xs md:text-sm font-medium leading-tight">Nova Reserva</span>
            </Button>
            
            <Link href="/meu-painel/guia">
              <Button 
                variant="outline" 
                className="h-auto flex flex-col items-center justify-center py-3 md:py-4 px-2 gap-2 text-center border-orange-200 bg-orange-50 hover:bg-orange-100 hover:text-orange-800 w-full min-h-[80px] md:min-h-[90px]"
              >
                <Compass className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                <span className="text-xs md:text-sm font-medium leading-tight">Guia Interativo</span>
              </Button>
            </Link>
            
            <Button 
              onClick={() => onSectionChange('recomendacoes')} 
              variant="outline" 
              className="h-auto flex flex-col items-center justify-center py-3 md:py-4 px-2 gap-2 text-center border-purple-200 bg-purple-50 hover:bg-purple-100 hover:text-purple-800 min-h-[80px] md:min-h-[90px]"
            >
              <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
              <span className="text-xs md:text-sm font-medium leading-tight">Recomendações</span>
            </Button>
            
            <Link href="/personalizacao">
              <Button 
                variant="outline" 
                className="h-auto flex flex-col items-center justify-center py-3 md:py-4 px-2 gap-2 text-center border-gradient-to-r from-blue-200 to-purple-200 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 min-h-[80px] md:min-h-[90px] relative overflow-hidden w-full"
              >
                <div className="absolute top-1 right-1">
                  <Sparkles className="h-3 w-3 text-purple-500 animate-pulse" />
                </div>
                <User className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                <span className="text-xs md:text-sm font-medium leading-tight text-purple-700">Preferências</span>
              </Button>
            </Link>
            
            <Button 
              onClick={() => onSectionChange('ajuda')} 
              variant="outline" 
              className="h-auto flex flex-col items-center justify-center py-3 md:py-4 px-2 gap-2 text-center border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 min-h-[80px] md:min-h-[90px] col-span-2 lg:col-span-1"
            >
              <HelpCircle className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
              <span className="text-xs md:text-sm font-medium leading-tight">Ajuda</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Latest Reservations Preview */}
      <Card className="bg-white shadow-sm border-l-4 border-indigo-500">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base md:text-lg text-indigo-700">
            Próximas Reservas {reservations.length > 0 && `(${reservations.length})`}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
            onClick={() => onSectionChange('reservas')}
          >
            Ver Todas
          </Button>
        </CardHeader>
        <CardContent>
          {reservations.length > 0 ? (
            <div className="space-y-3">
              {reservations.slice(0, 3).map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${getReservationColor(reservation.type)} flex-shrink-0`}>
                      <ReservationIcon type={reservation.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs md:text-sm truncate">{reservation.name}</p>
                      <p className="text-xs text-gray-600 truncate">{reservation.location}</p>
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(reservation.status)} className="text-xs ml-2 flex-shrink-0">
                    {getStatusLabel(reservation.status)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">Você não possui reservas futuras</p>
              <Button 
                variant="link" 
                className="mt-2 text-primary"
                onClick={() => onSectionChange('reservas')}
              >
                Explorar opções
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Notifications */}
      <Card className="bg-white shadow-sm border-r-4 border-blue-500">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center">
            <CardTitle className="text-base md:text-lg text-blue-700">Notificações</CardTitle>
            {notifications.filter(n => !n.read).length > 0 && (
              <Badge className="ml-2 bg-red-500">{notifications.filter(n => !n.read).length}</Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            onClick={() => {}}
          >
            Ver Todas
          </Button>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification}
                  onClick={() => onMarkAsRead(notification.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">Nenhuma notificação</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewSection; 