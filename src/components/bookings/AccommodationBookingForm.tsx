"use client"

import * as React from "react"
import { useState } from "react"
import { format, differenceInDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, Users, Check, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"  
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { DateRange } from "react-day-picker"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
import PaymentLinkCheckout from "@/components/payments/PaymentLinkCheckout"
import CouponValidator from "@/components/coupons/CouponValidator"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Id } from "@/../convex/_generated/dataModel";
import { useCustomerInfo } from "@/lib/hooks/useCustomerInfo";

export type AccommodationBookingFormProps = {
  accommodationId: Id<"accommodations">;
  accommodationName: string;
  pricePerNight: number;
  maxGuests: number;
  className?: string;
  onSubmit?: (data: {
    hotelId: Id<"accommodations">;
    hotelName: string;
    checkIn: Date;
    checkOut: Date;
    roomType: string;
    guests: number;
  }) => void;
}

export function AccommodationBookingForm({
  accommodationId,
  accommodationName,
  pricePerNight,
  maxGuests,
  className,
  onSubmit
}: AccommodationBookingFormProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  })
  const [guests, setGuests] = useState<number>(2)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  
  // Use the custom hook to get customer information
  const { customerInfo } = useCustomerInfo();
  const { user } = useCurrentUser();

  const createAccommodationBooking = useMutation(api.domains.bookings.mutations.createAccommodationBooking)
  
  // Formatar preço para moeda brasileira
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  // Calcular número de noites e preço total
  const calculateNights = () => {
    if (dateRange?.from && dateRange?.to) {
      return differenceInDays(dateRange.to, dateRange.from)
    }
    return 0
  }
  
  const nights = calculateNights()
  const totalPrice = pricePerNight * nights
  
  // Calculate final price with coupon
  const getFinalPrice = () => {
    return appliedCoupon ? appliedCoupon.finalAmount : totalPrice;
  };

  // Get discount amount
  const getDiscountAmount = () => {
    return appliedCoupon ? appliedCoupon.discountAmount : 0;
  };

  // Handle coupon application
  const handleCouponApplied = (coupon: any) => {
    setAppliedCoupon(coupon);
  };

  // Handle coupon removal
  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };
  
  const handlePaymentSuccess = () => {
    if (onSubmit) {
      onSubmit({
        hotelId: accommodationId,
        hotelName: accommodationName,
        checkIn: dateRange!.from!,
        checkOut: dateRange!.to!,
        roomType: "Standard",
        guests,
      })
    }

    toast.success("Reserva criada com sucesso!", {
      description: "Você será redirecionado para o pagamento.",
    })

    // Reset form
    setDateRange({ from: undefined, to: undefined })
    setGuests(2)
    setPaymentOpen(false)
    setCurrentBookingId(null)
  }

  const handleSubmit = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Selecione as datas de check-in e check-out")
      return
    }
    
    if (guests > maxGuests) {
      toast.error(`Número máximo de hóspedes: ${maxGuests}`)
      return
    }

    try {
      setIsSubmitting(true)

      // Create booking first (status: pending, paymentStatus: pending)
      const bookingId = await createAccommodationBooking({
        accommodationId,
        checkInDate: format(dateRange.from, "yyyy-MM-dd"),
        checkOutDate: format(dateRange.to, "yyyy-MM-dd"),
        guestCount: guests,
        customerInfo: {
          name: customerInfo.name || "Guest",
          email: customerInfo.email || "guest@example.com",
          phone: customerInfo.phone || "+5511999999999",
        },
        couponCode: appliedCoupon?.code,
        discountAmount: getDiscountAmount(),
        finalAmount: getFinalPrice(),
      })

      setCurrentBookingId(bookingId)
      setPaymentOpen(true)
    } catch (error: any) {
      console.error("Erro ao criar reserva:", error)
      toast.error(error.message || "Erro ao criar reserva")
    } finally {
      setIsSubmitting(false)
    }
  }

  const incrementGuests = () => {
    if (guests < maxGuests) {
      setGuests(guests + 1)
    }
  }

  const decrementGuests = () => {
    if (guests > 1) {
      setGuests(guests - 1)
    }
  }

  const isFormValid = dateRange?.from && dateRange?.to && guests >= 1 && guests <= maxGuests

  return (
    <div className={cn("rounded-xl overflow-hidden bg-white shadow-sm border border-gray-200", className)}>
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Reserve sua hospedagem</h3>
          <p className="text-sm text-gray-500 mt-1">Garanta seu lugar em {accommodationName}</p>
        </div>
        
        {/* Date range picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Período da estadia
          </label>
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
                      : "Selecionar datas"}
                  </span>
                </div>
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
        
        {/* Guest counter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Número de hóspedes (máx. {maxGuests})
          </label>
          <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="mr-3 h-5 w-5 text-blue-600" />
              <span className="font-medium">{guests} {guests === 1 ? "hóspede" : "hóspedes"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={decrementGuests}
                disabled={guests <= 1}
                className="h-8 w-8 p-0"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">{guests}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={incrementGuests}
                disabled={guests >= maxGuests}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Coupon Validation */}
        {nights > 0 && totalPrice > 0 && (
          <div className="pt-4 border-t">
            <CouponValidator
              userId={user?._id}
              assetType="accommodations"
              assetId={accommodationId}
              orderValue={totalPrice}
              onCouponApplied={handleCouponApplied}
              onCouponRemoved={handleCouponRemoved}
              showOrderSummary={false}
              placeholder="Digite o código do cupom"
            />
          </div>
        )}
        
        {/* Price summary */}
        {nights > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{formatCurrency(pricePerNight)} x {nights} {nights === 1 ? "noite" : "noites"}</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto ({appliedCoupon.code}):</span>
                  <span>- {formatCurrency(getDiscountAmount())}</span>
                </div>
              )}
              
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(getFinalPrice())}</span>
                </div>
              </div>
              
              {appliedCoupon && getDiscountAmount() > 0 && (
                <div className="text-center text-sm text-green-600 font-medium">
                  Você está economizando {formatCurrency(getDiscountAmount())}!
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-14 text-lg font-medium"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Criando reserva...
            </>
          ) : (
            <>
              <Check className="mr-2 h-5 w-5" />
              Criar reserva e pagar
            </>
          )}
        </Button>
        
        {!isFormValid && (dateRange?.from || dateRange?.to || guests !== 2) && (
          <p className="text-sm text-red-600 text-center">
            {!dateRange?.from || !dateRange?.to ? "Selecione as datas de check-in e check-out" :
             guests > maxGuests ? `Número máximo de hóspedes: ${maxGuests}` :
             guests < 1 ? "Selecione pelo menos 1 hóspede" : ""}
          </p>
        )}
      </div>

      {/* Payment dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="w-full max-w-md">
          <DialogTitle>Pagamento da Reserva</DialogTitle>
          <DialogDescription>
            Sua reserva foi criada! Clique abaixo para prosseguir com o pagamento seguro via Stripe.
          </DialogDescription>
          {currentBookingId && (
            <PaymentLinkCheckout
              bookingId={currentBookingId as any}
              assetType="accommodation"
              assetId={accommodationId}
              totalAmount={getFinalPrice()}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setPaymentOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
