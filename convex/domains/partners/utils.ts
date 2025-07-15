import { ApplicationFeeCalculation } from "./types";

/**
 * Calcula os valores de uma transação com taxa de aplicação
 * @param totalAmount - Valor total em centavos
 * @param feePercentage - Porcentagem da taxa (0-100)
 * @returns Objeto com os valores calculados
 */
export function calculateApplicationFee(
  totalAmount: number,
  feePercentage: number
): ApplicationFeeCalculation {
  // Validar inputs
  if (totalAmount < 0) {
    throw new Error("Valor total não pode ser negativo");
  }
  
  if (feePercentage < 0 || feePercentage > 100) {
    throw new Error("Taxa deve estar entre 0% e 100%");
  }
  
  // Calcular taxa da plataforma
  const platformFee = Math.floor(totalAmount * (feePercentage / 100));
  
  // Estimar taxa do Stripe (2.9% + 29 centavos)
  const stripeFee = Math.floor(totalAmount * 0.029) + 29;
  
  // O partner recebe o total menos a taxa da plataforma
  // O Stripe deduz suas taxas automaticamente do valor do partner
  const partnerAmount = totalAmount - platformFee;
  
  return {
    totalAmount,
    feePercentage,
    platformFee,
    partnerAmount,
    stripeFee,
  };
}

/**
 * Formata valor em centavos para moeda BRL
 * @param cents - Valor em centavos
 * @returns String formatada em BRL
 */
export function formatCentsToBRL(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Valida se um usuário pode ser um partner
 * @param userRole - Role do usuário
 * @returns boolean
 */
export function canBePartner(userRole?: string): boolean {
  const allowedRoles = ["partner", "admin"];
  return userRole ? allowedRoles.includes(userRole) : false;
}

/**
 * Determina o status do onboarding baseado nos dados da conta Stripe
 * @param account - Dados da conta do Stripe
 * @returns Status do onboarding
 */
export function determineOnboardingStatus(account: {
  details_submitted?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
}): "pending" | "in_progress" | "completed" {
  if (account.charges_enabled && account.payouts_enabled) {
    return "completed";
  } else if (account.details_submitted) {
    return "in_progress";
  }
  return "pending";
}

/**
 * Eventos do Stripe Connect que devemos escutar
 */
export const STRIPE_CONNECT_WEBHOOK_EVENTS = [
  "account.updated",
  "account.application.deauthorized",
  "account.application.authorized",
  "payment_intent.succeeded", // Para Direct Charges
  "application_fee.created",
  "application_fee.refunded",
  "transfer.created",
  "transfer.updated",
  "transfer.failed",
  "payout.created",
  "payout.updated",
  "payout.failed",
  "payout.paid",
] as const;

/**
 * Verifica se um evento é um evento do Stripe Connect
 * @param eventType - Tipo do evento
 * @returns boolean
 */
export function isConnectEvent(eventType: string): boolean {
  return STRIPE_CONNECT_WEBHOOK_EVENTS.includes(eventType as any);
} 