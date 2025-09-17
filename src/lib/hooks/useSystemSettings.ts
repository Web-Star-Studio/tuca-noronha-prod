import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export interface SystemSettings {
  whatsapp: {
    adminNumber: string;
    businessName: string;
  };
  support: {
    email: string;
    phone: string;
  };
  business: {
    companyName: string;
    address: any;
  };
  ui: {
    primaryColor: string;
    footerText: string;
  };
}

/**
 * Hook para acessar configurações públicas do sistema
 * Estas configurações são acessíveis por todos os usuários
 */
export function useSystemSettings() {
  const settings = useQuery(api.domains.systemSettings.queries.getPublicSettings);
  
  return {
    settings,
    isLoading: settings === undefined,
    whatsappNumber: settings?.whatsapp?.adminNumber || "+5581979097547",
    businessName: settings?.whatsapp?.businessName || "Tuca Noronha Turismo",
    supportEmail: settings?.support?.email || "atendimentotucanoronha@gmail.com",
    supportPhone: settings?.support?.phone || "+5581979097547",
    companyName: settings?.business?.companyName || "Tuca Noronha Turismo",
    primaryColor: settings?.ui?.primaryColor || "#0066CC",
    footerText: settings?.ui?.footerText || "© 2025 Tuca Noronha Turismo. Todos os direitos reservados. Desenvolvido por Web Star Studio.",
  };
}

/**
 * Hook para gerar link do WhatsApp com configurações do sistema
 */
export function useWhatsAppLink() {
  const { whatsappNumber, businessName } = useSystemSettings();
  
  const generateWhatsAppLink = (message?: string, customNumber?: string) => {
    const number = customNumber || whatsappNumber;
    const cleanNumber = number.replace(/\D/g, ''); // Remove caracteres não numéricos
    const defaultMessage = `Olá! Gostaria de saber mais sobre os serviços da ${businessName}. Vocês podem me ajudar?`;
    const finalMessage = message || defaultMessage;
    
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(finalMessage)}`;
  };
  
  return {
    generateWhatsAppLink,
    whatsappNumber,
    businessName,
  };
} 