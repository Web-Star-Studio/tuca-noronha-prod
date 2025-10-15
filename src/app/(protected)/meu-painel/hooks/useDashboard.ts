import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Reservation } from '../types/dashboard';

export function useDashboard() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('overview');

  // Use real reservation data from Convex
  const activityBookings = useQuery(api.domains.bookings.queries.getUserActivityBookings, { paginationOpts: { numItems: 100, cursor: null } });
  const eventBookings = useQuery(api.domains.bookings.queries.getUserEventBookings, { paginationOpts: { numItems: 100, cursor: null } });
  const restaurantReservations = useQuery(api.domains.bookings.queries.getUserRestaurantReservations, { paginationOpts: { numItems: 100, cursor: null } });
  const vehicleBookings = useQuery(api.domains.bookings.queries.getUserVehicleBookings, { paginationOpts: { numItems: 100, cursor: null } });
  const adminReservations = useQuery(api.domains.adminReservations.queries.getUserAdminReservations, { paginationOpts: { numItems: 100, cursor: null } });
  
  // Use real notifications from Convex
  const notificationsResult = useQuery(api.domains.notifications.queries.getUserNotifications, {
    limit: 10,
    includeRead: true,
  });

  // Get unread notification count
  const unreadCount = useQuery(api.domains.notifications.queries.getUnreadNotificationCount, {});

  // Get user stats
  const userStats = useQuery(api.domains.bookings.queries.getUserStats, {});

  // Mutations for notification management
  const markAsReadMutation = useMutation(api.domains.notifications.mutations.markAsRead);
  
  // Mutation for booking cancellation
  const cancelBookingMutation = useMutation(api.domains.bookings.mutations.cancelBooking);

  const handleNewReservation = () => {
    router.push('/');
    toast.success("Redirecionando para explorar opções...");
  };

  const handleViewReservationDetails = (reservationId: string) => {
    router.push(`/reservas/${reservationId}`);
  };

  // Transform and combine all reservations
  const reservations = useMemo(() => {
    const allReservations: Reservation[] = [];

    // Add regular activity bookings
    activityBookings?.page.forEach(b => allReservations.push({
      id: b._id,
      type: 'activity',
      name: b.activityTitle,
      date: new Date(b.date),
      guests: b.participants,
      status: b.status,
      location: 'Local a ser definido', // Placeholder
      imageUrl: b.activityImageUrl,
      confirmationCode: b.confirmationCode,
    }));

    // Add regular event bookings
    eventBookings?.page.forEach(b => allReservations.push({
      id: b._id,
      type: 'event',
      name: b.eventTitle,
      date: new Date(b.eventDate),
      guests: b.quantity,
      status: b.status,
      location: b.eventLocation,
      imageUrl: b.eventImageUrl,
      confirmationCode: b.confirmationCode,
    }));

    // Add regular restaurant reservations
    restaurantReservations?.page.forEach(r => allReservations.push({
      id: r._id,
      type: 'restaurant',
      name: r.restaurantName,
      date: new Date(`${r.date}T${r.time}`),
      guests: r.partySize,
      status: r.status,
      location: r.restaurantAddress,
      imageUrl: r.restaurantImageUrl,
      confirmationCode: r.confirmationCode,
    }));

    // Add regular vehicle bookings
    vehicleBookings?.page.forEach(b => allReservations.push({
      id: b._id,
      type: 'vehicle',
      name: `${b.vehicleBrand} ${b.vehicleModel}`,
      checkIn: new Date(b.startDate),
      checkOut: new Date(b.endDate),
      guests: 1, // Placeholder
      status: b.status,
      location: b.pickupLocation,
      imageUrl: b.vehicleImageUrl,
      confirmationCode: b.confirmationCode,
    }));

    // Add admin-created reservations
    adminReservations?.page.forEach(r => {
      const reservationType = r.assetType === 'activities' ? 'activity' :
                             r.assetType === 'events' ? 'event' :
                             r.assetType === 'restaurants' ? 'restaurant' :
                             r.assetType === 'accommodations' ? 'accommodation' :
                             r.assetType === 'vehicles' ? 'vehicle' : r.assetType;
      
      allReservations.push({
        id: r._id,
        type: reservationType,
        name: r.assetName,
        date: new Date(r.date),
        guests: r.guests,
        status: r.status,
        location: r.assetLocation,
        imageUrl: r.assetImageUrl,
        confirmationCode: r.confirmationCode,
        isAdminCreated: true,
        paymentStatus: r.paymentStatus,
        paymentDueDate: r.paymentDueDate,
      });
    });

    return allReservations.sort((a, b) => {
      const dateA = a.date || a.checkIn || 0;
      const dateB = b.date || b.checkIn || 0;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [activityBookings, eventBookings, restaurantReservations, vehicleBookings, adminReservations]);

  // Handle loading state
  const isLoadingReservations = 
    activityBookings === undefined ||
    eventBookings === undefined ||
    restaurantReservations === undefined ||
    vehicleBookings === undefined ||
    adminReservations === undefined;

  const handleCancelReservation = async (reservationId: string) => {
    try {
      // Find the reservation to get its type
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        toast.error("Reserva não encontrada");
        return;
      }

      // Admin reservations cannot be cancelled by users
      if (reservation.isAdminCreated) {
        toast.error("Esta reserva foi criada por um administrador e não pode ser cancelada diretamente. Entre em contato com o suporte.");
        return;
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        `Tem certeza que deseja cancelar a reserva "${reservation.name}"?\n\nEsta ação não pode ser desfeita.`
      );

      if (!confirmed) {
        return;
      }

      // Call the generic cancellation function
      await cancelBookingMutation({
        reservationId,
        reservationType: reservation.type as any,
        reason: "Cancelado pelo cliente",
      });

      toast.success("Reserva cancelada com sucesso!");
      
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      toast.error(`Erro ao cancelar reserva: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await markAsReadMutation({ notificationId: id as any });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  return {
    activeSection,
    setActiveSection,
    notifications: notificationsResult?.map(notification => ({
      id: notification._id,
      title: notification.title,
      description: notification.message,
      date: new Date(notification.createdAt),
      read: notification.isRead,
      type: notification.type.includes('success') || notification.type.includes('confirmed') ? 'success' as const :
            notification.type.includes('promotion') || notification.type.includes('offer') ? 'promotion' as const :
            'info' as const,
      relatedId: notification.relatedId,
      relatedType: notification.relatedType,
      data: notification.data,
    })) || [],
    isLoadingNotifications: notificationsResult === undefined,
    unreadNotificationsCount: unreadCount || 0,
    onMarkAsRead: markNotificationAsRead,
    handleNewReservation,
    handleViewReservationDetails,
    handleCancelReservation,
    reservations,
    isLoadingReservations,
    stats: userStats ? {
      totalReservations: userStats.totalReservations,
      activeReservations: 0,
      totalSpent: 0,
      favoriteLocations: [],
      completedTrips: 0,
    } : {
      totalReservations: 0,
      activeReservations: 0,
      totalSpent: 0,
      favoriteLocations: [],
      completedTrips: 0,
    },
    isLoadingStats: userStats === undefined,
  };
}

// Hook para detectar media queries
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia(query);
      if (media.matches !== matches) {
        setMatches(media.matches);
      }
      const listener = () => setMatches(media.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [matches, query]);

  return matches;
}; 
