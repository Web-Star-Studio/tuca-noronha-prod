"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Plus, Minus, MapPin, ChefHat, Calendar as CalendarIcon } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { useCustomerInfo } from "@/lib/hooks/useCustomerInfo";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { cardStyles, buttonStyles, formStyles, badgeStyles } from "@/lib/ui-config";

interface RestaurantReservationFormProps {
  restaurantId: Id<"restaurants">;
  restaurant: {
    name: string;
    address: {
      street: string;
      neighborhood: string;
      city: string;
    };
    maximumPartySize: number;
    acceptsReservations: boolean;
    operatingHours?: {
      [key: string]: {
        open: string;
        close: string;
        isClosed: boolean;
      };
    };
  };
  onReservationSuccess?: (reservation: { confirmationCode: string }) => void;
  className?: string;
}

export function RestaurantReservationForm({
  restaurantId,
  restaurant,
  onReservationSuccess,
  className,
}: RestaurantReservationFormProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>("");
  const [partySize, setPartySize] = useState(2);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use the custom hook to get customer information
  const { customerInfo, setCustomerInfo } = useCustomerInfo();

  const createReservation = useMutation(api.domains.bookings.mutations.createRestaurantReservation);
  
  // Get WhatsApp link generator
  // const { generateWhatsAppLink } = useWhatsAppLink(); // This line is removed as per the new_code

  // Get available times based on restaurant hours and selected date
  const getAvailableTimes = () => {
    if (!date) return [];
    
    // If no operating hours are provided, return default dinner hours
    if (!restaurant.operatingHours) {
      const times: string[] = [];
      // Default hours: 18:00 to 22:00 (6 PM to 10 PM)
      for (let hour = 18; hour < 22; hour++) {
        times.push(`${hour.toString().padStart(2, "0")}:00`);
        times.push(`${hour.toString().padStart(2, "0")}:30`);
      }
      return times;
    }
    
    const dayName = format(date, "EEEE", { locale: ptBR });
    const dayNameEn = {
      "segunda-feira": "Monday",
      "terça-feira": "Tuesday", 
      "quarta-feira": "Wednesday",
      "quinta-feira": "Thursday",
      "sexta-feira": "Friday",
      "sábado": "Saturday",
      "domingo": "Sunday",
    }[dayName] || "Monday";

    const hours = restaurant.operatingHours[dayNameEn];
    
    if (!hours || hours.isClosed) {
      return [];
    }

    // Generate time slots based on restaurant hours
    const times: string[] = [];
    const [start, end] = hours.open.split("-");
    const startHour = parseInt(start.split(":")[0]);
    const endHour = parseInt(end.split(":")[0]);
    
    for (let hour = startHour; hour < endHour; hour++) {
      times.push(`${hour.toString().padStart(2, "0")}:00`);
      times.push(`${hour.toString().padStart(2, "0")}:30`);
    }

    return times;
  };

  const availableTimes = getAvailableTimes();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !time) {
      toast.error("Selecione data e horário");
      return;
    }

    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error("Preencha todas as informações de contato");
      return;
    }

    if (!restaurant.acceptsReservations) {
      toast.error("Este restaurante não aceita reservas");
      return;
    }

    if (availableTimes.length === 0) {
      toast.error("Restaurante fechado nesta data");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createReservation({
        restaurantId,
        date: format(date, "yyyy-MM-dd"),
        time,
        partySize,
        customerInfo,
        specialRequests: specialRequests || undefined,
      });

      toast.success("Reserva realizada com sucesso!", {
        description: `Código de confirmação: ${result.confirmationCode}`,
      });

      if (onReservationSuccess) {
        onReservationSuccess(result);
      }

      // Reset form
      setDate(undefined);
      setTime("");
      setPartySize(2);
      setCustomerInfo({ name: "", email: "", phone: "" });
      setSpecialRequests("");
    } catch {
      toast.error("Erro ao fazer reserva", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementGuests = () => {
    if (partySize < restaurant.maximumPartySize) {
      setPartySize(partySize + 1);
    }
  };

  const decrementGuests = () => {
    if (partySize > 1) {
      setPartySize(partySize - 1);
    }
  };

  const isRestaurantClosed = date && availableTimes.length === 0;

  return (
    <div className={cn(cardStyles.base, cardStyles.hover.default, className)}>
      <form onSubmit={handleSubmit} className={cardStyles.content.default}>
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <ChefHat className="mr-2 h-5 w-5 text-blue-600" />
              Faça sua reserva
            </h3>
            <p className="text-sm text-gray-500 mt-1">{restaurant.name}</p>
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <MapPin className="mr-1 h-3 w-3" />
              {restaurant.address.neighborhood}, {restaurant.address.city}
            </div>
          </div>

          {!restaurant.acceptsReservations && (
            <div className={cn(badgeStyles.base, badgeStyles.variant.warning, "w-full justify-center")}>
              Este restaurante não aceita reservas
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Data da reserva</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    formStyles.input.base,
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Horário</Label>
            {isRestaurantClosed ? (
              <div className={cn(badgeStyles.base, badgeStyles.variant.danger, "w-full justify-center")}>
                Restaurante fechado neste dia
              </div>
            ) : (
              <Select value={time} onValueChange={setTime} disabled={!date || availableTimes.length === 0}>
                <SelectTrigger className={formStyles.select.base}>
                  <SelectValue placeholder="Selecione um horário" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimes.map((timeOption) => (
                    <SelectItem key={timeOption} value={timeOption}>
                      {timeOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Party Size */}
          <div className="space-y-2">
            <Label htmlFor="partySize">Número de pessoas</Label>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrementGuests}
                disabled={partySize <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center w-12 h-10 border rounded-md">
                <span className="text-sm font-medium">{partySize}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={incrementGuests}
                disabled={partySize >= restaurant.maximumPartySize}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Máximo {restaurant.maximumPartySize} pessoas
            </p>
          </div>

          {/* Customer Information */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-900">Informações de contato</h4>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                className={formStyles.input.base}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                className={formStyles.input.base}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                className={formStyles.input.base}
                placeholder="(81) 99999-9999"
                required
              />
            </div>
          </div>

          {/* Special Requests */}
          <div className="space-y-2">
            <Label htmlFor="requests">Solicitações especiais (opcional)</Label>
            <Textarea
              id="requests"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className={formStyles.textarea.base}
              placeholder="Aniversário, alergia alimentar, preferência de mesa..."
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className={cn(buttonStyles.variant.default, "w-full")}
            disabled={isSubmitting || !date || !time || !restaurant.acceptsReservations || isRestaurantClosed}
          >
            {isSubmitting ? (
              "Processando..."
            ) : !restaurant.acceptsReservations ? (
              "Reservas não disponíveis"
            ) : isRestaurantClosed ? (
              "Fechado neste dia"
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Confirmar reserva
              </>
            )}
          </Button>

          {restaurant.acceptsReservations && (
            <p className="text-xs text-center text-gray-500">
              Você receberá uma confirmação por email em breve
            </p>
          )}
        </div>
      </form>
    </div>
  );
}