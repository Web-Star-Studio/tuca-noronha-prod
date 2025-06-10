export type NotificationType = 'success' | 'info' | 'promotion';

export interface Notification {
  id: string;
  title: string;
  description: string;
  date: Date;
  read: boolean;
  type: NotificationType;
}

export interface Reservation {
  id: string;
  type: string;
  name: string;
  date?: Date;
  checkIn?: Date;
  checkOut?: Date;
  guests: number;
  status: string;
  location: string;
  imageUrl: string;
}

export interface RecommendationItem {
  id: string;
  type: string;
  name: string;
  description: string;
  imageUrl: string;
  rating: number;
  tags: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ReservationsSectionProps {
  reservations: Reservation[];
  getReservationColor: (type: string) => string;
  getStatusVariant: (status: string) => "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  getStatusLabel: (status: string) => string;
  onNewReservation: () => void;
  onViewDetails: (reservationId: string) => void;
  onCancelReservation: (reservationId: string) => void;
}

export interface OverviewSectionProps {
  reservations: Reservation[];
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onSectionChange: (section: string) => void;
}

export interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  color: string;
  bgColor: string;
  children?: React.ReactNode;
}

export interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

export interface RecommendationCardProps {
  item: RecommendationItem;
} 