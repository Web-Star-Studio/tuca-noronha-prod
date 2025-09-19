/**
 * Hook for handling booking payments with the Payment Service
 */

import { useState } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { toast } from 'sonner';
import { createCheckoutPreference } from '@/lib/payment-service';

interface BookingData {
  activityId?: string;
  eventId?: string;
  restaurantId?: string;
  vehicleId?: string;
  ticketId?: string;
  date: string;
  time?: string;
  participants?: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  specialRequests?: string;
  couponCode?: string;
  discountAmount?: number;
  finalAmount?: number;
}

interface UseBookingPaymentOptions {
  assetType: 'activity' | 'event' | 'restaurant' | 'vehicle';
  assetName: string;
  basePrice: number;
  onSuccess?: (bookingId: string, confirmationCode: string) => void;
  onError?: (error: Error) => void;
}

export function useBookingPayment(options: UseBookingPaymentOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  
  // Mutations based on asset type
  const createActivityBooking = useMutation(api.domains.bookings.mutations.createActivityBooking);
  const createEventBooking = useMutation(api.domains.bookings.mutations.createEventBooking);
  const createRestaurantBooking = useMutation(api.domains.bookings.mutations.createRestaurantReservation);
  const createVehicleBooking = useMutation(api.domains.bookings.mutations.createVehicleBooking);

  const processBookingWithPayment = async (bookingData: BookingData) => {
    setIsProcessing(true);

    try {
      // 1. Create the booking in Convex
      let booking: any;
      
      switch (options.assetType) {
        case 'activity':
          if (!bookingData.activityId) throw new Error('Activity ID required');
          booking = await createActivityBooking({
            activityId: bookingData.activityId,
            ticketId: bookingData.ticketId,
            date: bookingData.date,
            time: bookingData.time,
            participants: bookingData.participants || 1,
            customerInfo: bookingData.customerInfo,
            specialRequests: bookingData.specialRequests,
            couponCode: bookingData.couponCode,
            discountAmount: bookingData.discountAmount,
            finalAmount: bookingData.finalAmount || options.basePrice,
          });
          break;
          
        case 'event':
          if (!bookingData.eventId) throw new Error('Event ID required');
          booking = await createEventBooking({
            eventId: bookingData.eventId,
            ticketId: bookingData.ticketId,
            date: bookingData.date,
            participants: bookingData.participants || 1,
            customerInfo: bookingData.customerInfo,
            specialRequests: bookingData.specialRequests,
            couponCode: bookingData.couponCode,
            discountAmount: bookingData.discountAmount,
            finalAmount: bookingData.finalAmount || options.basePrice,
          });
          break;
          
        case 'restaurant':
          if (!bookingData.restaurantId) throw new Error('Restaurant ID required');
          booking = await createRestaurantBooking({
            restaurantId: bookingData.restaurantId,
            date: bookingData.date,
            time: bookingData.time || '',
            partySize: bookingData.participants || 1,
            customerInfo: bookingData.customerInfo,
            specialRequests: bookingData.specialRequests,
            couponCode: bookingData.couponCode,
            discountAmount: bookingData.discountAmount,
            finalAmount: bookingData.finalAmount || options.basePrice,
          });
          break;
          
        case 'vehicle':
          if (!bookingData.vehicleId) throw new Error('Vehicle ID required');
          booking = await createVehicleBooking({
            vehicleId: bookingData.vehicleId,
            pickupDate: bookingData.date,
            returnDate: bookingData.date, // You might want to add returnDate to BookingData
            customerInfo: bookingData.customerInfo,
            specialRequests: bookingData.specialRequests,
            couponCode: bookingData.couponCode,
            discountAmount: bookingData.discountAmount,
            finalAmount: bookingData.finalAmount || options.basePrice,
          });
          break;
          
        default:
          throw new Error('Invalid asset type');
      }

      setBookingId(booking.bookingId);
      
      toast.success('Reserva criada com sucesso!', {
        description: `Código de confirmação: ${booking.confirmationCode}`,
      });

      // 2. Create payment preference using the Payment Service
      console.log('🔄 Criando preferência de pagamento via Payment Service');
      
      const paymentResult = await createCheckoutPreference({
        bookingId: booking.bookingId,
        assetType: options.assetType,
        assetName: options.assetName,
        totalPrice: bookingData.finalAmount || options.basePrice,
        customerEmail: bookingData.customerInfo.email,
        customerName: bookingData.customerInfo.name,
        customerPhone: bookingData.customerInfo.phone,
        metadata: {
          confirmationCode: booking.confirmationCode,
          couponCode: bookingData.couponCode,
        }
      });

      if (!paymentResult.success || !paymentResult.checkoutUrl) {
        throw new Error('Falha ao criar preferência de pagamento');
      }

      toast.success('Redirecionando para pagamento...', {
        description: 'Você será levado para o checkout seguro do Mercado Pago.',
      });

      // 3. Redirect to Mercado Pago checkout
      setTimeout(() => {
        window.location.href = paymentResult.checkoutUrl;
      }, 1500);

      // Call success callback
      if (options.onSuccess) {
        options.onSuccess(booking.bookingId, booking.confirmationCode);
      }

      return booking;

    } catch (error) {
      console.error('💥 Erro no processo de reserva/pagamento:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      toast.error('Erro ao processar reserva', {
        description: errorMessage,
      });

      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(errorMessage));
      }
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processBookingWithPayment,
    isProcessing,
    bookingId,
  };
}
