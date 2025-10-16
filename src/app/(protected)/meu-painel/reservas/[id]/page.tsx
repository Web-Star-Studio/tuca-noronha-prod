"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { BookingDetails } from "@/components/bookings/BookingDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Id } from "../../../../../../convex/_generated/dataModel";

export default function BookingDetailsPage() {
  const params = useParams();
  const bookingId = params.id as string;

  // Try to fetch from different booking types
  const activityBooking = useQuery(
    api.domains.bookings.queries.getActivityBookingById,
    bookingId ? { bookingId: bookingId as Id<"activityBookings"> } : "skip"
  );

  const eventBooking = useQuery(
    api.domains.bookings.queries.getEventBookingById,
    bookingId && !activityBooking ? { bookingId: bookingId as Id<"eventBookings"> } : "skip"
  );

  const vehicleBooking = useQuery(
    api.domains.vehicles.queries.getVehicleBookingById,
    bookingId && !activityBooking && !eventBooking ? { bookingId: bookingId as Id<"vehicleBookings"> } : "skip"
  );

  const restaurantReservation = useQuery(
    api.domains.bookings.queries.getRestaurantReservationById,
    bookingId && !activityBooking && !eventBooking && !vehicleBooking ? { reservationId: bookingId as Id<"restaurantReservations"> } : "skip"
  );

  // Determine which booking we found and its type
  const booking = activityBooking || eventBooking || vehicleBooking || restaurantReservation;
  const bookingType = activityBooking ? "activity" : 
                      eventBooking ? "event" : 
                      vehicleBooking ? "vehicle" : 
                      restaurantReservation ? "restaurant" : null;

  // Get asset details if available
  const activity = useQuery(
    api.domains.activities.queries.getActivityById,
    activityBooking ? { id: activityBooking.activityId } : "skip"
  );

  const event = useQuery(
    api.domains.events.queries.getEventById,
    eventBooking ? { id: eventBooking.eventId } : "skip"
  );

  const vehicle = useQuery(
    api.domains.vehicles.queries.getVehicleById,
    vehicleBooking ? { id: vehicleBooking.vehicleId } : "skip"
  );

  const restaurant = useQuery(
    api.domains.restaurants.queries.getRestaurantById,
    restaurantReservation ? { id: restaurantReservation.restaurantId } : "skip"
  );

  const assetDetails = activity || event || vehicle || restaurant;

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/meu-painel">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (booking === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link href="/meu-painel">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-900 mb-2">
              Reserva não encontrada
            </h2>
            <p className="text-red-700 mb-4">
              A reserva solicitada não existe ou você não tem permissão para visualizá-la.
            </p>
            <Link href="/meu-painel">
              <Button>Voltar ao Painel</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/meu-painel">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Painel
          </Button>
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Detalhes da Reserva</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe o status e gerencie sua reserva
          </p>
        </div>

        {bookingType && (
          <BookingDetails
            booking={booking}
            bookingType={bookingType}
            assetDetails={assetDetails}
          />
        )}
      </div>
    </div>
  );
}
