"use client";

import { useState } from "react";

import { CheckCircle, Calendar, Users, Utensils, Ticket, Download, Share2, Mail, Phone, Copy,  } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {  } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { cardStyles, badgeStyles } from "@/lib/ui-config";

interface BookingConfirmationProps {
  confirmationCode: string;
  bookingType: "activity" | "event" | "restaurant";
  className?: string;
}

export function BookingConfirmation({
  confirmationCode,
  bookingType,
  className,
}: BookingConfirmationProps) {
  const [searchCode, setSearchCode] = useState(confirmationCode || "");

  // Fetch booking details
  const booking = useQuery(
    searchCode ? api.domains.bookings.queries.getBookingByConfirmationCode : undefined,
    searchCode ? { confirmationCode: searchCode, type: bookingType } : undefined
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado para a área de transferência");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Erro ao copiar");
    }
  };

  const shareBooking = async () => {
    if (navigator.share && booking) {
      try {
        await navigator.share({
          title: "Confirmação de Reserva",
          text: `Reserva confirmada! Código: ${confirmationCode}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Share API failed, falling back to copy:", error);
        // Fallback to copy link
        copyToClipboard(window.location.href);
      }
    } else {
      copyToClipboard(window.location.href);
    }
  };

  if (!booking) {
    return (
      <div className={cn(cardStyles.base, className)}>
        <div className={cardStyles.content.default}>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Ticket className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Buscar Reserva
              </h3>
              <p className="text-gray-600">
                Digite o código de confirmação para ver os detalhes
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search-code">Código de confirmação</Label>
              <div className="flex gap-2">
                <Input
                  id="search-code"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  placeholder="Ex: TN123ABC"
                  className="text-center"
                />
                <Button 
                  onClick={() => setSearchCode(searchCode)}
                  disabled={!searchCode}
                >
                  Buscar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderBookingDetails = () => {
    if (booking.type === "activity") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {booking.booking.activityTitle}
              </h2>
              <p className="text-gray-600">Atividade reservada</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>{booking.booking.date}</span>
                {booking.booking.time && <span>às {booking.booking.time}</span>}
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-4 h-4" />
                <span>{booking.booking.participants} participantes</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-semibold">
                  R$ {booking.booking.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">Contato</h4>
                <div className="text-sm text-gray-600">
                  <p>{booking.booking.customerInfo.name}</p>
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{booking.booking.customerInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{booking.booking.customerInfo.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (booking.type === "event") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {booking.booking.eventTitle}
              </h2>
              <p className="text-gray-600">Ingresso confirmado</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>{booking.booking.eventDate} às {booking.booking.eventTime}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Ticket className="w-4 h-4" />
                <span>{booking.booking.quantity} ingressos</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <span className="font-semibold">
                  R$ {booking.booking.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">Comprador</h4>
                <div className="text-sm text-gray-600">
                  <p>{booking.booking.customerInfo.name}</p>
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{booking.booking.customerInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{booking.booking.customerInfo.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (booking.type === "restaurant") {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Utensils className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {booking.booking.restaurantName}
              </h2>
              <p className="text-gray-600">Mesa reservada</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>{booking.booking.date} às {booking.booking.time}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Users className="w-4 h-4" />
                <span>{booking.booking.partySize} pessoas</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">Responsável</h4>
                <div className="text-sm text-gray-600">
                  <p>{booking.booking.name}</p>
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{booking.booking.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{booking.booking.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={cn(cardStyles.base, className)}>
      <div className={cardStyles.content.spacious}>
        {/* Success Header */}
        <div className="text-center space-y-4 mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reserva Confirmada!
            </h1>
            <p className="text-gray-600">
              Sua reserva foi processada com sucesso
            </p>
          </div>
        </div>

        {/* Confirmation Code */}
        <div className="bg-gray-50 p-4 rounded-lg text-center mb-6">
          <div className="text-sm text-gray-600 mb-1">Código de confirmação</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-gray-900 tracking-wider">
              {booking.booking.confirmationCode}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(booking.booking.confirmationCode)}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Booking Details */}
        {renderBookingDetails()}

        {/* Status Badge */}
        <div className="flex justify-center mt-6">
          <div className={cn(badgeStyles.base, badgeStyles.variant.success)}>
            <CheckCircle className="w-4 h-4 mr-1" />
            {booking.booking.status === "pending" ? "Aguardando confirmação" : "Confirmado"}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            variant="outline" 
            className="flex-1 flex items-center gap-2"
            onClick={shareBooking}
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 flex items-center gap-2"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4" />
            Imprimir
          </Button>
        </div>

        {/* Important Information */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Informações importantes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Guarde este código de confirmação para futuras consultas</li>
            <li>• Você receberá um email de confirmação em breve</li>
            <li>• Para alterações ou cancelamentos, entre em contato conosco</li>
            <li>• Chegue com 15 minutos de antecedência</li>
          </ul>
        </div>
      </div>
    </div>
  );
}