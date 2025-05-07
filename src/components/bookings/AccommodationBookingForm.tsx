"use client"

import * as React from "react"
import { useState } from "react"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, Users, Bed, Check, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"  
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { DateRange } from "react-day-picker"

const roomTypes = [
  { id: "standard", name: "Standard", maxGuests: 2, pricePerNight: 250 },
  { id: "deluxe", name: "Deluxe", maxGuests: 3, pricePerNight: 350 },
  { id: "suite", name: "Suite", maxGuests: 4, pricePerNight: 500 },
  { id: "family", name: "Família", maxGuests: 6, pricePerNight: 650 },
]

export type AccommodationBookingFormProps = {
  hotelId?: string
  hotelName?: string
  className?: string
  onBookingSubmit?: (booking: {
    hotelId?: string
    hotelName?: string
    checkIn: Date
    checkOut: Date
    roomType: string
    guests: number
  }) => void
}

export function AccommodationBookingForm({
  hotelId,
  hotelName = "Hotel & Resort",
  className,
  onBookingSubmit
}: AccommodationBookingFormProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  })
  const [roomType, setRoomType] = useState<string>("")
  const [guests, setGuests] = useState<number>(2)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Formatar preço para moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Obter o quarto selecionado
  const selectedRoom = roomTypes.find(room => room.id === roomType)
  
  // Calcular número de noites e preço total
  const calculateNights = () => {
    if (dateRange?.from && dateRange?.to) {
      return differenceInDays(dateRange.to, dateRange.from)
    }
    return 0
  }
  
  const nights = calculateNights()
  const totalPrice = selectedRoom ? selectedRoom.pricePerNight * nights : 0
  
  const handleSubmit = async () => {
    if (!dateRange?.from || !dateRange?.to || !roomType) return
    
    setIsSubmitting(true)
    
    try {
      // Simular um atraso de rede
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (onBookingSubmit) {
        onBookingSubmit({
          hotelId,
          hotelName,
          checkIn: dateRange.from,
          checkOut: dateRange.to,
          roomType,
          guests
        })
      }
      
      // Feedback de sucesso
      toast.success("Reserva de hospedagem confirmada", {
        description: `Sua reserva para ${guests} ${guests === 1 ? "hóspede" : "hóspedes"} foi confirmada de ${format(dateRange.from, "PPP", { locale: ptBR })} a ${format(dateRange.to, "PPP", { locale: ptBR })}.`,
        className: "bg-green-500 text-white"
      })
      
      // Resetar formulário
      setDateRange({ from: undefined, to: undefined })
      setRoomType("")
      setGuests(2)
    } catch {
      toast.error("Erro ao reservar", {
        description: "Não foi possível completar sua reserva de hospedagem. Por favor, tente novamente.",
        className: "bg-red-500 text-white"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const incrementGuests = () => {
    if (roomType && guests < (selectedRoom?.maxGuests || 2)) {
      setGuests(guests + 1)
    }
  }

  const decrementGuests = () => {
    if (guests > 1) {
      setGuests(guests - 1)
    }
  }

  return (
    <div className={cn("rounded-xl overflow-hidden bg-blue-50 shadow-sm border border-gray-100", className)}>
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Reserve sua hospedagem</h3>
          <p className="text-sm text-gray-500 mt-1">Garanta seu lugar em {hotelName}</p>
        </div>
        
        {/* Date range picker */}
        <div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between bg-white border-gray-200 hover:bg-gray-50 h-14 px-4"
              >
                <div className="flex items-center">
                  <CalendarIcon className="mr-3 h-5 w-5 text-blue-600" />
                  <span className={cn(!dateRange?.from && "text-gray-400")}>
                    {dateRange?.from && dateRange?.to 
                      ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}` 
                      : "Período"}
                  </span>
                </div>
                <span className="text-sm text-gray-400">
                  {!dateRange?.from && "Selecionar"}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0 border-none" side="bottom">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                initialFocus
                numberOfMonths={2}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return date < today
                }}
                locale={ptBR}
                className="rounded-md bg-white border-none"
              />
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Room type selector */}
        <div>
          <Select 
            value={roomType} 
            onValueChange={(value) => {
              setRoomType(value)
              // Reset guests to default when changing room type
              setGuests(1)
            }}
          >
            <SelectTrigger 
              className="w-full justify-between bg-white border-gray-200 hover:bg-gray-50 h-14 px-4"
            >
              <div className="flex items-center">
                <Bed className="mr-3 h-5 w-5 text-blue-600" />
                <span className={cn(!roomType && "text-gray-400")}>
                  {roomType 
                    ? roomTypes.find(room => room.id === roomType)?.name 
                    : "Tipo de quarto"}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                {!roomType && "Selecionar"}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-white border-none">
              {roomTypes.map((room) => (
                <SelectItem 
                  key={room.id} 
                  value={room.id}
                  className="text-gray-900 hover:bg-blue-100 font-semibold hover:text-gray-900"
                >
                  <div className="flex justify-between w-full">
                    <span>{room.name}</span>
                    <span className="text-sm text-gray-500">
                      {formatCurrency(room.pricePerNight)}/noite
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Guest count selector */}
        <div>
          <div className="flex items-center justify-between border border-gray-200 rounded-md h-14 px-4 bg-white hover:bg-gray-50">
            <div className="flex items-center">
              <Users className="mr-3 h-5 w-5 text-blue-600" />
              <span className="text-gray-900">Hóspedes</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-full border-gray-200"
                onClick={decrementGuests}
                disabled={guests <= 1 || !roomType}
              >
                <Minus className="h-4 w-4" />
                <span className="sr-only">Diminuir</span>
              </Button>
              <span className="w-5 text-center font-medium">{guests}</span>
              <Button
                type="button"
                variant="outline" 
                size="icon" 
                className="h-8 w-8 rounded-full border-gray-200"
                onClick={incrementGuests}
                disabled={!roomType || (selectedRoom && guests >= selectedRoom.maxGuests)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Aumentar</span>
              </Button>
            </div>
          </div>
          {roomType && (
            <p className="text-xs text-gray-500 mt-1">
              Max. {selectedRoom?.maxGuests} pessoas para {selectedRoom?.name}
            </p>
          )}
        </div>
        
        {/* Price calculation */}
        {roomType && dateRange?.from && dateRange?.to && (
          <div className="mt-2 p-4 bg-white rounded-md border border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-700">
                <span>{selectedRoom?.name}</span>
                <span className="font-medium">{formatCurrency(selectedRoom?.pricePerNight || 0)}/noite</span>
              </div>
              <div className="flex justify-between text-sm text-gray-700">
                <span>Período</span>
                <span>{nights} {nights === 1 ? "noite" : "noites"}</span>
              </div>
              <div className="pt-2 border-t border-gray-200" />
              <div className="flex justify-between font-medium text-blue-800">
                <span>Total estimado</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <p className="text-xs text-gray-500">
                *O valor não inclui taxas extras ou serviços adicionais
              </p>
            </div>
          </div>
        )}
        
        <Button 
          type="button"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 font-medium"
          disabled={!dateRange?.from || !dateRange?.to || !roomType || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <title>Ícone de carregamento</title>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Verificar disponibilidade
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
