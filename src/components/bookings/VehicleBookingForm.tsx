import { useState } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { useWhatsAppLink } from "@/lib/hooks/useSystemSettings";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  
  // Customer info state
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [pickupLocation, setPickupLocation] = useState("");
  const [notes, setNotes] = useState("");

  // Get current user
  const currentUser = useQuery(api.domains.users.queries.getCurrentUser);
  
  // Get WhatsApp link generator
  const { generateWhatsAppLink } = useWhatsAppLink();

  // Calculate total days and price
  const totalDays = startDate && endDate ? differenceInDays(endDate, startDate) + 1 : 0;
  const totalPrice = totalDays * pricePerDay;

  // Create booking mutation - using the correct one from bookings domain
  const createBooking = useMutation(api.domains.bookings.mutations.createVehicleBooking);

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      toast.error("Data inválida", {
        description: "Por favor, selecione as datas de retirada e devolução.",
      });
      return;
    }

    // Validate customer info
    if (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim()) {
      toast.error("Informações obrigatórias", {
        description: "Por favor, preencha nome, email e telefone.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerInfo.email)) {
      toast.error("Email inválido", {
        description: "Por favor, insira um email válido.",
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
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        customerInfo,
        pickupLocation: pickupLocation.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success("Reserva solicitada com sucesso!", {
        description: "Em breve entraremos em contato para confirmar sua reserva.",
      });

      // Redirect to confirmation page or user bookings
      // router.push("/reservas");
    } catch (error) {
      console.error("Erro ao criar reserva:", error);
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

      {/* Customer Information */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-medium text-lg">Informações do Solicitante</h3>
        
        <div className="space-y-2">
          <Label htmlFor="customer-name">Nome completo *</Label>
          <Input
            id="customer-name"
            type="text"
            placeholder="Seu nome completo"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customer-email">Email *</Label>
          <Input
            id="customer-email"
            type="email"
            placeholder="seu@email.com"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customer-phone">Telefone *</Label>
          <Input
            id="customer-phone"
            type="tel"
            placeholder="(11) 99999-9999"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickup-location">Local de retirada (opcional)</Label>
          <Input
            id="pickup-location"
            type="text"
            placeholder="Endereço ou ponto de referência"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="booking-notes">Observações (opcional)</Label>
          <Textarea
            id="booking-notes"
            placeholder="Alguma informação adicional sobre sua reserva..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
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
            const whatsappUrl = generateWhatsAppLink(message);
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
        disabled={
          isLoading || 
          !startDate || 
          !endDate || 
          !customerInfo.name.trim() || 
          !customerInfo.email.trim() || 
          !customerInfo.phone.trim()
        }
      >
        {isLoading ? "Processando..." : "Reservar agora"}
      </Button>
      <Toaster />
    </div>
  );
} 