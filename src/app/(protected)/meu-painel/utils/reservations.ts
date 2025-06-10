import { Utensils, BedDouble, Activity, ListChecks } from 'lucide-react';

export const getReservationIconType = (type: string) => {
  switch (type) {
    case 'restaurant':
      return Utensils;
    case 'accommodation':
      return BedDouble;
    case 'activity':
      return Activity;
    default:
      return ListChecks;
  }
};

export const getReservationColor = (type: string): string => {
  switch (type) {
    case 'restaurant':
      return 'bg-orange-500';
    case 'accommodation':
      return 'bg-blue-500';
    case 'activity':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

export const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'Confirmada';
    case 'pending':
      return 'Pendente';
    case 'cancelled':
      return 'Cancelada';
    default:
      return 'Desconhecido';
  }
}; 