import { useState } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface VehicleBookingFormProps {
  vehicleId: Id<"vehicles">;
  pricePerDay: number;
}

export function VehicleBookingForm({ vehicleId, pricePerDay }: VehicleBookingFormProps) {
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(addDays(new Date(), 3));
  const [isLoading, setIsLoading] = useState(false);

  // Get current user
  const currentUser = useQuery(api.domains.users.queries.getCurrentUser);

  // Calculate total days and price
  const totalDays = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const totalPrice = totalDays * pricePerDay;

  // Create booking mutation
  const createBooking = useMutation(api.domains.vehicles.mutations.createVehicleBooking);

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      toast.error("Data inválida", {
        description: "Por favor, selecione as datas de retirada e devolução.",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (!currentUser) {
        toast.error("Usuário não autenticado", {
          description: "Por favor, faça login para realizar uma reserva.",
        });
        return;
      }
      
      await createBooking({
        vehicleId,
        userId: currentUser._id,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        totalPrice,
        status: "pending",
      });

      toast.success("Reserva solicitada com sucesso!", {
        description: "Em breve entraremos em contato para confirmar sua reserva.",
      });

      // Redirect to confirmation page or user bookings
      // router.push("/reservas");
    } catch (error) {
      toast.error("Erro ao fazer reserva", {
        description: "Ocorreu um erro ao processar sua reserva. Por favor, tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pickup-date">Data de retirada</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="pickup-date"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? (
                format(startDate, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="return-date">Data de devolução</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="return-date"
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? (
                format(endDate, "PPP", { locale: ptBR })
              ) : (
                <span>Selecione uma data</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
              disabled={(date) => date < (startDate || new Date())}
            />
          </PopoverContent>
        </Popover>
      </div>

      {startDate && endDate && (
        <div className="bg-gray-50 p-3 rounded-md mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>R$ {pricePerDay.toFixed(2)} x {totalDays} {totalDays === 1 ? "dia" : "dias"}</span>
            <span>R$ {totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>R$ {totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Contact via WhatsApp */}
      <div className="flex items-center justify-center pt-2 border-t mt-4">
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center gap-2 text-green-600 border-green-300 hover:bg-green-50"
          onClick={() => {
            const message = "Olá! Gostaria de tirar dúvidas sobre aluguel de veículos. Vocês podem me ajudar?";
            const whatsappUrl = `https://wa.me/5581999999999?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
          }}
        >
          <MessageCircle className="h-4 w-4" />
          Tirar dúvidas pelo WhatsApp
        </Button>
      </div>

      <Button 
        className="w-full mt-4" 
        onClick={handleBooking}
        disabled={isLoading || !startDate || !endDate}
      >
        {isLoading ? "Processando..." : "Reservar agora"}
      </Button>
      <Toaster />
    </div>
  );
} 