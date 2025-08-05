"use client";

import React, { useState, useMemo } from 'react';
import { motion } from "framer-motion";
import { format, isValid } from "date-fns";
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
import { ReservationsSectionProps } from '../types/dashboard';
import { getReservationIconType } from '../utils/reservations';
import { VoucherDownloadButton } from '@/components/vouchers';

const ReservationIcon = ({ type }: { type: string }) => {
  const IconComponent = getReservationIconType(type);
  return <IconComponent className="h-5 w-5 text-white" />;
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
  // Estados para controlar os filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filtrar reservas baseado nos filtros selecionados
  const filteredReservations = useMemo(() => {
    let filtered = reservations;

    // Filtrar por status
    if (statusFilter !== 'all') {
      if (statusFilter === 'confirmed') {
        filtered = filtered.filter(r => ['confirmed', 'in_progress', 'completed'].includes(r.status));
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(r => ['pending', 'payment_pending', 'awaiting_confirmation', 'draft'].includes(r.status));
      } else if (statusFilter === 'canceled') {
        filtered = filtered.filter(r => r.status === 'canceled');
      }
    }

    // Filtrar por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter);
    }

    return filtered;
  }, [reservations, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Suas Reservas</h2>
          <p className="text-gray-600 text-sm mt-1">
            {filteredReservations.length} {filteredReservations.length === 1 ? 'reserva encontrada' : 'reservas encontradas'}
          </p>
        </div>
        <Button
          onClick={onNewReservation}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Reserva
        </Button>
      </div>

      {filteredReservations.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filtros e Ações */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm border border-gray-200 sticky top-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Por Status</h4>
                  <div className="space-y-1">
                    <button 
                      onClick={() => setStatusFilter('all')}
                      className={`w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                        statusFilter === 'all' ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-600">Todas</span>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        {reservations.length}
                      </Badge>
                    </button>
                    <button 
                      onClick={() => setStatusFilter('confirmed')}
                      className={`w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                        statusFilter === 'confirmed' ? 'bg-green-50 border-green-200' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-600">Confirmadas</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-600">
                        {reservations.filter(r => ['confirmed', 'in_progress', 'completed'].includes(r.status)).length}
                      </Badge>
                    </button>
                    <button 
                      onClick={() => setStatusFilter('pending')}
                      className={`w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                        statusFilter === 'pending' ? 'bg-yellow-50 border-yellow-200' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-600">Pendentes</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-600">
                        {reservations.filter(r => ['pending', 'payment_pending', 'awaiting_confirmation', 'draft'].includes(r.status)).length}
                      </Badge>
                    </button>
                    <button 
                      onClick={() => setStatusFilter('canceled')}
                      className={`w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                        statusFilter === 'canceled' ? 'bg-red-50 border-red-200' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-600">Canceladas</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-600">
                        {reservations.filter(r => r.status === 'canceled').length}
                      </Badge>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Por Tipo</h4>
                  <div className="space-y-1">
                    <button 
                      onClick={() => setTypeFilter('all')}
                      className={`w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                        typeFilter === 'all' ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-600">Todos</span>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                        {reservations.length}
                      </Badge>
                    </button>
                    <button 
                      onClick={() => setTypeFilter('activity')}
                      className={`w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                        typeFilter === 'activity' ? 'bg-purple-50 border-purple-200' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-600">Atividades</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-600">
                        {reservations.filter(r => r.type === 'activity').length}
                      </Badge>
                    </button>
                    <button 
                      onClick={() => setTypeFilter('restaurant')}
                      className={`w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                        typeFilter === 'restaurant' ? 'bg-orange-50 border-orange-200' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-600">Restaurantes</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-600">
                        {reservations.filter(r => r.type === 'restaurant').length}
                      </Badge>
                    </button>
                    <button 
                      onClick={() => setTypeFilter('vehicle')}
                      className={`w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                        typeFilter === 'vehicle' ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-600">Veículos</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-600">
                        {reservations.filter(r => r.type === 'vehicle').length}
                      </Badge>
                    </button>
                    <button 
                      onClick={() => setTypeFilter('event')}
                      className={`w-full flex items-center justify-between p-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                        typeFilter === 'event' ? 'bg-green-50 border-green-200' : ''
                      }`}
                    >
                      <span className="text-sm text-gray-600">Eventos</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-600">
                        {reservations.filter(r => r.type === 'event').length}
                      </Badge>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Lista de Reservas */}
          <div className="lg:col-span-3">
            <div className="grid gap-4">
              {filteredReservations.map((reservation) => {
                const reservationDate = reservation.date ? new Date(reservation.date) : null;

                return (
                <motion.div 
                  key={reservation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <CardContent className="p-5">
                      <div className="flex flex-col md:flex-row items-start gap-4">
                        {/* Icon */}
                        <div className={`p-3 rounded-xl ${getReservationColor(reservation.type)} flex-shrink-0`}>
                          <ReservationIcon type={reservation.type} />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 w-full">
                          <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 mb-1">{reservation.name}</h3>
                              <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span className="truncate">{reservation.location}</span>
                              </div>
                            </div>
                            <Badge variant={getStatusVariant(reservation.status)} className="mt-2 sm:mt-0 flex-shrink-0">
                              {getStatusLabel(reservation.status)}
                            </Badge>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                            <div className="flex items-center">
                              <CalendarDays className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                              {reservation.type === 'accommodation' ? (
                                <span>
                                  {reservation.checkIn && format(new Date(reservation.checkIn), "dd MMM", { locale: ptBR })} - {reservation.checkOut && format(new Date(reservation.checkOut), "dd MMM", { locale: ptBR })}
                                </span>
                              ) : (
                                <span>{reservationDate && isValid(reservationDate) ? format(reservationDate, "dd MMM, yyyy", { locale: ptBR }) : "Data não disponível"}</span>
                              )}
                            </div>

                            {reservation.type === 'restaurant' && reservationDate && isValid(reservationDate) && (
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                                <span>{format(reservationDate, "HH:mm", { locale: ptBR })}</span>
                              </div>
                            )}

                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0" />
                              <span>{reservation.guests} {reservation.guests === 1 ? 'pessoa' : 'pessoas'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    {/* Actions */}
                    <CardFooter className="bg-gray-50 border-t border-gray-100 px-5 py-3">
                      <div className="flex justify-end w-full gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onViewDetails(reservation.id)} 
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          Detalhes
                        </Button>
                        
                        {/* Voucher button - show only for confirmed bookings with confirmation code */}
                        {(reservation.status === 'confirmed' || reservation.status === 'completed') && reservation.confirmationCode && (
                          <VoucherDownloadButton
                            bookingId={reservation.id}
                            bookingType={reservation.type as any}
                            variant="ghost"
                            size="sm"
                            showIcon={true}
                            showLabel={true}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          />
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onCancelReservation(reservation.id)} 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={reservation.status === 'canceled' || reservation.status === 'completed'}
                        >
                          {reservation.status === 'canceled' ? 'Cancelada' : 
                           reservation.status === 'completed' ? 'Finalizada' : 
                           'Cancelar'}
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              )})}
            </div>
          </div>
        </div>
      ) : (
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-gray-400" />
            </div>
            {reservations.length === 0 ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sem reservas ativas</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Você não possui nenhuma reserva no momento. Que tal explorar algumas opções?
                </p>
                <Button 
                  onClick={onNewReservation}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                >
                  Explorar e Reservar
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma reserva encontrada</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Não foram encontradas reservas com os filtros selecionados. Tente ajustar os filtros ou criar uma nova reserva.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => {
                      setStatusFilter('all');
                      setTypeFilter('all');
                    }}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Limpar Filtros
                  </Button>
                  <Button 
                    onClick={onNewReservation}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                  >
                    Nova Reserva
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReservationsSection; 