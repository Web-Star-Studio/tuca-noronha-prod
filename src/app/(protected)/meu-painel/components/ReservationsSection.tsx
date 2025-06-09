"use client";

import React from 'react';
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Clock, MapPin, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cardStyles, buttonStyles } from "@/lib/ui-config";
import { ReservationsSectionProps } from '../types/dashboard';
import { getReservationIconType } from '../utils/reservations';

const ReservationIcon = ({ type }: { type: string }) => {
  const IconComponent = getReservationIconType(type);
  return <IconComponent className="h-5 w-5 text-white" />;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const ReservationsSection: React.FC<ReservationsSectionProps> = ({
  reservations,
  getReservationColor,
  getStatusVariant,
  getStatusLabel,
  onNewReservation,
  onViewDetails,
  onCancelReservation
}) => {
  return (
    <motion.div
      className={`${cardStyles.content.default} space-y-6 p-4 sm:p-6 bg-white rounded-xl shadow-lg`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-semibold text-gray-800">Suas Reservas</h2>
        <Button
          className={`${buttonStyles.variant.default} shadow-md hover:shadow-lg transition-shadow w-full sm:w-auto`}
          onClick={onNewReservation}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Reserva
        </Button>
      </div>

      {reservations.length > 0 ? (
        <motion.div className="grid gap-6" variants={containerVariants}>
          {reservations.map((reservation) => (
            <motion.div key={reservation.id} variants={itemVariants}>
              <Card className={`${cardStyles.base} ${cardStyles.hover.lift} overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 rounded-lg`}>
                <CardContent className={`${cardStyles.content.default} !pt-5 !pb-4 px-5`}>
                  <div className="flex flex-col md:flex-row items-start gap-4">
                    <div className={`p-3 rounded-lg ${getReservationColor(reservation.type)} flex-shrink-0 self-center md:self-start`}>
                      <ReservationIcon type={reservation.type} />
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-1">
                        <h3 className="font-semibold text-lg text-gray-800">{reservation.name}</h3>
                        <Badge variant={getStatusVariant(reservation.status)} className="mt-1 sm:mt-0 self-start sm:self-center whitespace-nowrap shadow-sm">
                          {getStatusLabel(reservation.status)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                          {reservation.type === 'accommodation' ? (
                            <span>
                              {reservation.checkIn && format(reservation.checkIn, "dd MMM", { locale: ptBR })} - {reservation.checkOut && format(reservation.checkOut, "dd MMM", { locale: ptBR })}
                            </span>
                          ) : (
                            <span>{reservation.date && format(reservation.date, "dd MMM, yyyy", { locale: ptBR })}</span>
                          )}
                        </div>

                        {reservation.type === 'restaurant' && reservation.date && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                            <span>{format(reservation.date, "HH:mm", { locale: ptBR })}</span>
                          </div>
                        )}

                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                          <span>{reservation.guests} {reservation.guests === 1 ? 'pessoa' : 'pessoas'}</span>
                        </div>

                        <div className="flex items-center col-span-1 sm:col-span-2">
                          <MapPin className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                          <span className="truncate">{reservation.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className={`${cardStyles.footer.default} bg-slate-50 border-t px-5 py-3`}>
                  <div className="flex justify-end w-full gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(reservation.id)} className="text-primary hover:bg-primary/10 font-medium">
                      Detalhes
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onCancelReservation(reservation.id)} className="text-red-600 hover:text-red-700 hover:bg-red-500/10 font-medium">
                      Cancelar
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="text-center py-16 bg-slate-50 rounded-lg shadow-sm border border-slate-200"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 150 }}
        >
          <CalendarDays className="h-16 w-16 mx-auto text-slate-400 mb-5" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Sem reservas ativas</h3>
          <p className="text-slate-500 mb-6 max-w-xs mx-auto">Você não possui nenhuma reserva no momento. Que tal explorar algumas opções?</p>
          <Button className={`${buttonStyles.variant.default} shadow-md hover:shadow-lg transition-shadow`} onClick={onNewReservation}>
             Explorar e Reservar
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ReservationsSection; 