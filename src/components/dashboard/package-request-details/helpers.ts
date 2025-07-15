import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return "N/A";
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string | number | undefined) => {
  if (!dateString) return "Data não definida";
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "Data inválida" : date.toLocaleDateString('pt-BR');
};

export const formatDateTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent": return "bg-red-100 text-red-800 border-red-200";
    case "high": return "bg-orange-100 text-orange-800 border-orange-200";
    case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low": return "bg-green-100 text-green-800 border-green-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "urgent": return "Urgente";
    case "high": return "Alta";
    case "medium": return "Média";
    case "low": return "Baixa";
    default: return priority;
  }
}; 