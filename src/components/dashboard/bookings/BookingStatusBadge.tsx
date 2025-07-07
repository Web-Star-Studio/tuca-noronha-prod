"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Timer,
  UserCheck,
  Play,
  Check,
  Ban
} from "lucide-react";

interface BookingStatusBadgeProps {
  status: string;
  paymentStatus?: string;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "default" | "lg";
}

const statusConfig = {
  // Initial states
  draft: {
    label: "Rascunho",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: Clock,
    description: "Reserva iniciada mas pagamento não processado"
  },
  payment_pending: {
    label: "Pagamento Pendente",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    icon: CreditCard,
    description: "Cliente está realizando o pagamento"
  },
  awaiting_confirmation: {
    label: "Aguardando Confirmação",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: UserCheck,
    description: "Pagamento concluído, aguardando confirmação do parceiro"
  },
  
  // Active states
  confirmed: {
    label: "Confirmada",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: CheckCircle,
    description: "Reserva confirmada pelo parceiro"
  },
  in_progress: {
    label: "Em Andamento",
    color: "bg-indigo-100 text-indigo-700 border-indigo-300",
    icon: Play,
    description: "Atividade/serviço em andamento"
  },
  
  // Final states
  completed: {
    label: "Concluída",
    color: "bg-green-200 text-green-800 border-green-400",
    icon: Check,
    description: "Reserva concluída com sucesso"
  },
  canceled: {
    label: "Cancelada",
    color: "bg-red-100 text-red-700 border-red-300",
    icon: XCircle,
    description: "Reserva cancelada"
  },
  no_show: {
    label: "Não Compareceu",
    color: "bg-orange-100 text-orange-700 border-orange-300",
    icon: AlertCircle,
    description: "Cliente não compareceu"
  },
  expired: {
    label: "Expirada",
    color: "bg-gray-200 text-gray-600 border-gray-400",
    icon: Timer,
    description: "Reserva expirada por falta de pagamento"
  },
};

const paymentStatusConfig = {
  not_required: {
    label: "Não Requerido",
    color: "bg-gray-100 text-gray-600",
  },
  pending: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700",
  },
  processing: {
    label: "Processando",
    color: "bg-blue-100 text-blue-700",
  },
  requires_capture: {
    label: "Aguardando Captura",
    color: "bg-orange-100 text-orange-700",
  },
  awaiting_payment_method: {
    label: "Aguardando PIX/Boleto",
    color: "bg-orange-100 text-orange-700",
  },
  paid: {
    label: "Pago",
    color: "bg-green-100 text-green-700",
  },
  partially_paid: {
    label: "Parcialmente Pago",
    color: "bg-yellow-100 text-yellow-700",
  },
  failed: {
    label: "Falhou",
    color: "bg-red-100 text-red-700",
  },
  refunded: {
    label: "Reembolsado",
    color: "bg-purple-100 text-purple-700",
  },
  partially_refunded: {
    label: "Parcialmente Reembolsado",
    color: "bg-purple-100 text-purple-700",
  },
  canceled: {
    label: "Cancelado",
    color: "bg-gray-200 text-gray-600",
  },
};

export function BookingStatusBadge({ 
  status, 
  paymentStatus,
  className,
  showIcon = true,
  size = "default"
}: BookingStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: AlertCircle,
    description: "Status desconhecido"
  };

  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Badge 
        variant="outline"
        className={cn(
          config.color,
          sizeClasses[size],
          "font-medium flex items-center gap-1.5 border"
        )}
        title={config.description}
      >
        {showIcon && <Icon className={iconSizes[size]} />}
        {config.label}
      </Badge>
      
      {paymentStatus && (
        <Badge 
          variant="outline"
          className={cn(
            paymentStatusConfig[paymentStatus as keyof typeof paymentStatusConfig]?.color || "bg-gray-100 text-gray-600",
            "text-xs px-2 py-0.5 font-normal"
          )}
        >
          💳 {paymentStatusConfig[paymentStatus as keyof typeof paymentStatusConfig]?.label || paymentStatus}
        </Badge>
      )}
    </div>
  );
}

// Helper component for showing urgency indicators
export function BookingUrgencyIndicator({ 
  urgencyLevel,
  actionMessage 
}: { 
  urgencyLevel: string;
  actionMessage?: string;
}) {
  const urgencyConfig = {
    high: {
      color: "text-red-600",
      bgColor: "bg-red-50",
      icon: AlertCircle,
      pulse: true
    },
    medium: {
      color: "text-yellow-600", 
      bgColor: "bg-yellow-50",
      icon: Clock,
      pulse: false
    },
    low: {
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      icon: null,
      pulse: false
    }
  };

  const config = urgencyConfig[urgencyLevel as keyof typeof urgencyConfig];
  if (!config || urgencyLevel === "low") return null;

  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-md text-sm",
      config.bgColor,
      config.color
    )}>
      {Icon && (
        <Icon className={cn(
          "h-4 w-4",
          config.pulse && "animate-pulse"
        )} />
      )}
      <span className="font-medium">{actionMessage}</span>
    </div>
  );
} 