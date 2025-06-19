"use node";

import { EmailConfig } from "./types";

// Configuração principal de email
export const getEmailConfig = (): EmailConfig => {
  // Em produção, use variáveis de ambiente seguras
  const isDevelopment = process.env.NODE_ENV === "development";
  
  if (isDevelopment) {
    // Configuração para desenvolvimento usando Ethereal Email (teste)
    return {
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || "ethereal.user@ethereal.email",
        pass: process.env.EMAIL_PASS || "ethereal.password",
      },
      from: {
        name: "Tucano Noronha - Dev",
        email: process.env.EMAIL_FROM || "dev@tucanoronha.com",
      },
    };
  }
  
  // Configuração para produção
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
    from: {
      name: process.env.EMAIL_FROM_NAME || "Tucano Noronha",
      email: process.env.EMAIL_FROM || "noreply@tucanoronha.com",
    },
  };
};

// Emails importantes do sistema
export const SYSTEM_EMAILS = {
  ADMIN: process.env.ADMIN_EMAIL || "admin@tucanoronha.com",
  SUPPORT: process.env.SUPPORT_EMAIL || "suporte@tucanoronha.com",
  NO_REPLY: process.env.NO_REPLY_EMAIL || "noreply@tucanoronha.com",
  MASTER: process.env.MASTER_EMAIL || "master@tucanoronha.com",
} as const;

// Configurações específicas por tipo de email
export const EMAIL_SETTINGS = {
  booking_confirmation: {
    priority: "high" as const,
    replyTo: SYSTEM_EMAILS.SUPPORT,
  },
  booking_cancelled: {
    priority: "high" as const,
    replyTo: SYSTEM_EMAILS.SUPPORT,
  },
  booking_reminder: {
    priority: "normal" as const,
    replyTo: SYSTEM_EMAILS.SUPPORT,
  },
  package_request_received: {
    priority: "normal" as const,
    replyTo: SYSTEM_EMAILS.SUPPORT,
    cc: [SYSTEM_EMAILS.ADMIN],
  },
  package_request_status_update: {
    priority: "normal" as const,
    replyTo: SYSTEM_EMAILS.SUPPORT,
  },
  partner_new_booking: {
    priority: "high" as const,
    replyTo: SYSTEM_EMAILS.SUPPORT,
  },
  welcome_new_user: {
    priority: "normal" as const,
    replyTo: SYSTEM_EMAILS.SUPPORT,
  },
  new_partner_registration: {
    priority: "normal" as const,
    cc: [SYSTEM_EMAILS.ADMIN, SYSTEM_EMAILS.MASTER],
  },
  employee_invitation: {
    priority: "normal" as const,
    replyTo: SYSTEM_EMAILS.ADMIN,
  },
  support_message: {
    priority: "high" as const,
    cc: [SYSTEM_EMAILS.SUPPORT],
  },
} as const; 