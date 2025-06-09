import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { mockNotifications } from '../data/mockData';
import { Notification } from '../types/dashboard';

export const useDashboard = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  // Fetch real reservations data from Convex
  const reservationsData = useQuery(api.domains.bookings.queries.getUserReservations);
  
  // Fetch user statistics
  const userStats = useQuery(api.domains.bookings.queries.getUserStats);

  const handleNewReservation = () => {
    toast.success("Redirecionando para nova reserva...");
  };

  const handleViewReservationDetails = (reservationId: string) => {
    toast.info(`Visualizando detalhes da reserva ${reservationId}`);
  };

  const handleCancelReservation = (reservationId: string) => {
    toast.error(`Cancelando reserva ${reservationId}`);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Transform Convex data to match the expected format
  const transformedReservations = reservationsData?.map(reservation => ({
    id: reservation.id,
    type: reservation.type,
    name: reservation.name,
    date: reservation.date ? new Date(reservation.date) : undefined,
    checkIn: reservation.checkIn ? new Date(reservation.checkIn) : undefined,
    checkOut: reservation.checkOut ? new Date(reservation.checkOut) : undefined,
    guests: reservation.guests,
    status: reservation.status,
    location: reservation.location,
    imageUrl: reservation.imageUrl,
  })) || [];

  return {
    activeSection,
    setActiveSection,
    notifications,
    unreadNotifications,
    markNotificationAsRead,
    handleNewReservation,
    handleViewReservationDetails,
    handleCancelReservation,
    reservations: transformedReservations,
    stats: userStats,
    isLoading: reservationsData === undefined || userStats === undefined,
  };
};

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