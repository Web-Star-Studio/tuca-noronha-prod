import { Utensils, Activity, ListChecks } from 'lucide-react';

export const getReservationIconType = (type: string) => {
  switch (type) {
    case 'restaurant':
      return Utensils;
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
    case 'activity':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

export const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" => {
  switch (status) {
    // Status antigos (compatibilidade)
    case 'confirmed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'destructive';
    
    // Novos status
    case 'draft':
      return 'secondary';
    case 'payment_pending':
      return 'warning';
    case 'awaiting_confirmation':
      return 'warning';
    case 'in_progress':
      return 'success';
    case 'completed':
      return 'success';
    case 'canceled':
      return 'destructive';
    case 'no_show':
      return 'destructive';
    case 'expired':
      return 'destructive';
    
    default:
      return 'secondary';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    // Status antigos (compatibilidade)
    case 'confirmed':
      return 'Confirmada';
    case 'pending':
      return 'Pendente';
    case 'cancelled':
      return 'Cancelada';
    
    // Novos status
    case 'draft':
      return 'Rascunho';
    case 'payment_pending':
      return 'Aguardando Pagamento';
    case 'awaiting_confirmation':
      return 'Aguardando Confirmação';
    case 'in_progress':
      return 'Em Andamento';
    case 'completed':
      return 'Concluída';
    case 'canceled':
      return 'Cancelada';
    case 'no_show':
      return 'Não Compareceu';
    case 'expired':
      return 'Expirada';
    
    default:
      return 'Desconhecido';
  }
}; 