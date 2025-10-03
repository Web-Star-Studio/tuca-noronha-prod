"use node";

import { v } from "convex/values";
import { action, internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { sendQuickEmail } from "./service";
import type { 
  BookingConfirmationEmailData, 
  BookingCancelledEmailData,
  PackageRequestReceivedEmailData,
  PartnerNewBookingEmailData,
  WelcomeNewUserEmailData,
  SupportMessageEmailData,
  VoucherEmailData
} from "./types";
import { EmailService, emailService } from "./service";

/**
 * Enviar email de confirmação de reserva para o cliente
 */
export const sendBookingConfirmationEmail = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    assetName: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"), 
      v.literal("restaurant"),
      v.literal("vehicle"),
      
    ),
    confirmationCode: v.string(),
    bookingDate: v.string(),
    totalPrice: v.optional(v.number()),
    partnerName: v.optional(v.string()),
    partnerEmail: v.optional(v.string()),
    bookingDetails: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    messageId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const emailData: BookingConfirmationEmailData = {
        type: "booking_confirmation",
        to: args.customerEmail,
        subject: `Solicitação de Reserva Recebida - ${args.assetName} - Código: ${args.confirmationCode}`,
        customerName: args.customerName,
        assetName: args.assetName,
        bookingType: args.bookingType,
        confirmationCode: args.confirmationCode,
        bookingDate: args.bookingDate,
        totalPrice: args.totalPrice,
        partnerName: args.partnerName,
        partnerEmail: args.partnerEmail,
        bookingDetails: args.bookingDetails,
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: result.type,
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to send booking confirmation email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Enviar email de cancelamento de reserva para o cliente
 */
export const sendBookingCancelledEmail = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    assetName: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"), 
      v.literal("restaurant"),
      v.literal("vehicle"),
      
    ),
    confirmationCode: v.string(),
    reason: v.optional(v.string()),
    refundAmount: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const emailData: BookingCancelledEmailData = {
        type: "booking_cancelled",
        to: args.customerEmail,
        subject: `Reserva Cancelada - ${args.assetName} - Código: ${args.confirmationCode}`,
        customerName: args.customerName,
        assetName: args.assetName,
        bookingType: args.bookingType,
        confirmationCode: args.confirmationCode,
        reason: args.reason,
        refundAmount: args.refundAmount,
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: result.type,
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to send booking cancelled email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Enviar email de nova reserva para o parceiro
 */
export const sendPartnerNewBookingEmail = internalAction({
  args: {
    partnerEmail: v.string(),
    partnerName: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    assetName: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"), 
      v.literal("restaurant"),
      v.literal("vehicle"),
      
    ),
    confirmationCode: v.string(),
    bookingDate: v.string(),
    totalPrice: v.optional(v.number()),
    bookingDetails: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const emailData: PartnerNewBookingEmailData = {
        type: "partner_new_booking",
        to: args.partnerEmail,
        subject: `Nova Reserva Recebida - ${args.assetName} - ${args.customerName}`,
        partnerName: args.partnerName,
        customerName: args.customerName,
        assetName: args.assetName,
        bookingType: args.bookingType,
        confirmationCode: args.confirmationCode,
        bookingDate: args.bookingDate,
        totalPrice: args.totalPrice,
        customerContact: {
          email: args.customerEmail,
          phone: args.customerPhone,
        },
        bookingDetails: args.bookingDetails,
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: result.type,
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to send partner new booking email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Enviar email de confirmação de solicitação de pacote
 */
export const sendPackageRequestReceivedEmail = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    requestNumber: v.string(),
    duration: v.number(),
    guests: v.number(),
    budget: v.number(),
    destination: v.string(),
    requestDetails: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const emailData: PackageRequestReceivedEmailData = {
        type: "package_request_received",
        to: args.customerEmail,
        subject: `Solicitação de Pacote Recebida - #${args.requestNumber}`,
        customerName: args.customerName,
        requestNumber: args.requestNumber,
        duration: args.duration,
        guests: args.guests,
        budget: args.budget,
        destination: args.destination,
        requestDetails: args.requestDetails,
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: result.type,
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to send package request received email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Notificar master sobre nova solicitação de pacote
 */
export const notifyMasterNewPackageRequest = internalAction({
  args: {
    customerName: v.string(),
    customerEmail: v.string(),
    requestNumber: v.string(),
    duration: v.number(),
    guests: v.number(),
    budget: v.number(),
    destination: v.string(),
    requestDetails: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Buscar email do master nas variáveis de ambiente ou usar padrão
      const masterEmail = process.env.MASTER_EMAIL || "master@tucanoronha.com";
      
      const emailData: PackageRequestReceivedEmailData = {
        type: "package_request_received",
        to: masterEmail,
        subject: `[MASTER] Nova Solicitação de Pacote - #${args.requestNumber} - ${args.customerName}`,
        customerName: args.customerName,
        requestNumber: args.requestNumber,
        duration: args.duration,
        guests: args.guests,
        budget: args.budget,
        destination: args.destination,
        requestDetails: {
          ...args.requestDetails,
          customerEmail: args.customerEmail,
          isForMaster: true,
        },
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: result.type,
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to notify master about new package request:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Enviar email de boas-vindas para novos usuários
 */
export const sendWelcomeEmail = internalAction({
  args: {
    userEmail: v.string(),
    userName: v.string(),
    userRole: v.union(
      v.literal("traveler"),
      v.literal("partner"),
      v.literal("employee"),
      v.literal("master")
    ),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const emailData: WelcomeNewUserEmailData = {
        type: "welcome_new_user",
        to: args.userEmail,
        subject: `Bem-vindo ao Tuca Noronha, ${args.userName}! 🏝️`,
        userName: args.userName,
        userEmail: args.userEmail,
        userRole: args.userRole,
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: result.type,
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Enviar notificação de mensagem de suporte
 */
export const sendSupportNotificationEmail = internalAction({
  args: {
    customerName: v.string(),
    customerEmail: v.string(),
    messageSubject: v.string(),
    messageContent: v.string(),
    category: v.string(),
    isUrgent: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const supportEmail = process.env.SUPPORT_EMAIL || "suporte@tucanoronha.com";
      
      const emailData: SupportMessageEmailData = {
        type: "support_message",
        to: supportEmail,
        subject: `${args.isUrgent ? '[URGENTE] ' : ''}Nova Mensagem de Suporte - ${args.messageSubject}`,
        customerName: args.customerName,
        customerEmail: args.customerEmail,
        messageSubject: args.messageSubject,
        messageContent: args.messageContent,
        category: args.category,
        isUrgent: args.isUrgent,
        priority: args.isUrgent ? "high" : "normal",
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: result.type,
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to send support notification email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Enviar email com voucher pronto
 */
export const sendVoucherEmail = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    assetName: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("package")
    ),
    confirmationCode: v.string(),
    voucherNumber: v.string(),
    bookingDate: v.optional(v.string()),
    totalPrice: v.optional(v.number()),
    partnerName: v.optional(v.string()),
    bookingDetails: v.any(),
    attachPDF: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      let attachments: any[] = [];

      // If PDF attachment is requested, generate and attach PDF
      if (args.attachPDF) {
        try {
          // Generate PDF for the voucher
          const pdfResult = await ctx.runAction(internal.domains.vouchers.actions.generateVoucherPDF, {
            voucherNumber: args.voucherNumber,
          });

          if (pdfResult.success && pdfResult.storageId) {
            // Get PDF from storage
            const pdfBlob = await ctx.storage.get(pdfResult.storageId);
            if (pdfBlob) {
              const pdfBuffer = await pdfBlob.arrayBuffer();
              attachments.push({
                filename: `voucher-${args.voucherNumber}.pdf`,
                content: Buffer.from(pdfBuffer),
                contentType: 'application/pdf',
              });
            }
          }
        } catch (pdfError) {
          console.error("Error generating PDF for email:", pdfError);
          // Continue with email without PDF attachment
        }
      }

      const emailData: VoucherEmailData = {
        type: "voucher_ready",
        to: args.customerEmail,
        subject: `Seu Voucher Está Pronto - ${args.voucherNumber}`,
        customerName: args.customerName,
        assetName: args.assetName,
        bookingType: args.bookingType,
        confirmationCode: args.confirmationCode,
        voucherNumber: args.voucherNumber,
        bookingDate: args.bookingDate,
        totalPrice: args.totalPrice,
        partnerName: args.partnerName,
        bookingDetails: args.bookingDetails,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: result.type,
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      // Update voucher email tracking fields
      if (result.status === "sent") {
        try {
          await ctx.runMutation(internal.domains.vouchers.mutations.recordVoucherEmailSent, {
            voucherNumber: args.voucherNumber,
            emailAddress: args.customerEmail,
          });
        } catch (emailUpdateError) {
          console.error("Failed to update voucher email tracking:", emailUpdateError);
        }
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to send voucher email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Enviar email com proposta de pacote
 */
export const sendPackageProposalEmail = internalAction({
  args: {
    to: v.string(),
    customerName: v.string(),
    proposalTitle: v.string(),
    proposalNumber: v.string(),
    totalPrice: v.number(),
    currency: v.string(),
    validUntil: v.string(),
    adminName: v.string(),
    adminEmail: v.optional(v.string()),
    customMessage: v.optional(v.string()),
    proposalUrl: v.string(),
    attachments: v.optional(v.array(v.any())),
    templateId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const emailData = {
        type: "package_proposal_sent" as const,
        to: args.to,
        subject: `Nova Proposta de Pacote - ${args.proposalTitle}`,
        customerName: args.customerName,
        proposalTitle: args.proposalTitle,
        proposalNumber: args.proposalNumber,
        totalPrice: args.totalPrice,
        currency: args.currency,
        validUntil: args.validUntil,
        adminName: args.adminName,
        adminEmail: args.adminEmail,
        customMessage: args.customMessage,
        proposalUrl: args.proposalUrl,
        attachments: args.attachments,
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: "package_proposal_sent",
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to send package proposal email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Enviar email quando admin inicia reserva de voos
 */
export const sendPackageFlightBookingStartedEmail = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    proposalNumber: v.string(),
    proposalTitle: v.string(),
    message: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const emailData = {
        type: "package_flight_booking_started" as const,
        to: args.customerEmail,
        subject: `Reserva de Voos Iniciada - ${args.proposalTitle}`,
        customerName: args.customerName,
        proposalNumber: args.proposalNumber,
        proposalTitle: args.proposalTitle,
        message: args.message,
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: "package_flight_booking_started",
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to send flight booking started email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Enviar email quando voos são confirmados
 */
export const sendPackageFlightsConfirmedEmail = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    proposalNumber: v.string(),
    proposalTitle: v.string(),
    flightDetails: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const emailData = {
        type: "package_flights_confirmed" as const,
        to: args.customerEmail,
        subject: `Voos Confirmados - ${args.proposalTitle}`,
        customerName: args.customerName,
        proposalNumber: args.proposalNumber,
        proposalTitle: args.proposalTitle,
        flightDetails: args.flightDetails,
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: "package_flights_confirmed",
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to send flights confirmed email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Enviar email quando documentos estão prontos
 */
export const sendPackageDocumentsReadyEmail = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    proposalNumber: v.string(),
    proposalTitle: v.string(),
    documentCount: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const emailData = {
        type: "package_documents_ready" as const,
        to: args.customerEmail,
        subject: `Documentos Prontos - ${args.proposalTitle}`,
        customerName: args.customerName,
        proposalNumber: args.proposalNumber,
        proposalTitle: args.proposalTitle,
        documentCount: args.documentCount,
      };

      const result = await sendQuickEmail(emailData);
      
      // Salvar log no banco de dados
      if (result.id) {
        await ctx.runMutation(internal.domains.email.mutations.logEmail, {
          type: "package_documents_ready",
          to: result.to,
          subject: result.subject,
          status: result.status,
          error: result.error,
          sentAt: result.sentAt,
        });
      }

      return {
        success: result.status === "sent",
        error: result.error,
      };
    } catch (error) {
      console.error("Failed to send documents ready email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Ação para testar o serviço de email
 */
export const testEmailService = action({
  args: {
    testEmail: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const emailData: WelcomeNewUserEmailData = {
        type: "welcome_new_user",
        to: args.testEmail,
        subject: "Teste do Sistema de Email - Tuca Noronha",
        userName: "Usuário Teste",
        userEmail: args.testEmail,
        userRole: "traveler",
      };

      const result = await sendQuickEmail(emailData);
      
      return {
        success: result.status === "sent",
        message: result.status === "sent" 
          ? "Email de teste enviado com sucesso!" 
          : `Falha ao enviar email: ${result.error}`,
      };
    } catch (error) {
      console.error("Failed to send test email:", error);
      return {
        success: false,
        message: `Erro no teste: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
}); 

/**
 * Send admin reservation payment link email
 */
export const sendAdminReservationPaymentLinkEmail = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    assetName: v.string(),
    confirmationCode: v.string(),
    totalAmount: v.number(),
    paymentLinkUrl: v.string(),
    paymentDueDate: v.string(),
    adminName: v.string(),
  },
  handler: async (ctx, args) => {
    const service = emailService;
    
    const template = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #1e3a5f; font-size: 32px; margin: 0;">Pagamento Pendente</h1>
          <p style="color: #64748b; font-size: 18px; margin-top: 10px;">Sua reserva está aguardando pagamento</p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 30px;">
          <h2 style="color: #1e3a5f; font-size: 24px; margin-top: 0;">Olá, ${args.customerName}!</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Sua reserva foi criada com sucesso pelo nosso administrador <strong>${args.adminName}</strong>.
            Para garantir sua reserva, por favor realize o pagamento até <strong>${new Date(args.paymentDueDate).toLocaleDateString('pt-BR')}</strong>.
          </p>
          
          <div style="background: #fff; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e3a5f; font-size: 18px; margin-top: 0;">Detalhes da Reserva:</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <strong style="color: #64748b;">Serviço:</strong> 
                <span style="color: #1e3a5f;">${args.assetName}</span>
              </li>
              <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <strong style="color: #64748b;">Código de Confirmação:</strong> 
                <span style="color: #1e3a5f; font-family: monospace;">${args.confirmationCode}</span>
              </li>
              <li style="padding: 8px 0;">
                <strong style="color: #64748b;">Valor Total:</strong> 
                <span style="color: #059669; font-size: 20px; font-weight: bold;">R$ ${args.totalAmount.toFixed(2)}</span>
              </li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${args.paymentLinkUrl}" 
               style="display: inline-block; background: #059669; color: white; padding: 16px 40px; 
                      border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px;">
              Pagar Agora
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">
            Ou copie e cole este link no seu navegador:<br>
            <span style="color: #3b82f6; word-break: break-all;">${args.paymentLinkUrl}</span>
          </p>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <p style="color: #856404; margin: 0;">
            <strong>⚠️ Importante:</strong> O link de pagamento expira em 3 dias. 
            Após este prazo, será necessário solicitar um novo link.
          </p>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 14px;">
          <p>Dúvidas? Entre em contato conosco respondendo este email.</p>
          <p style="margin-top: 20px;">© ${new Date().getFullYear()} Turismo Noronha. Todos os direitos reservados.</p>
        </div>
      </div>
    `;

    const result = await service.sendEmail({
      to: args.customerEmail,
      subject: `Pagamento Pendente - Reserva ${args.confirmationCode}`,
      html: template,
      type: "admin_reservation_payment_link" as any,
      logData: {
        type: "admin_reservation_payment_link" as any,
        userId: undefined,
        metadata: {
          confirmationCode: args.confirmationCode,
          assetName: args.assetName,
          totalAmount: args.totalAmount,
          paymentDueDate: args.paymentDueDate,
        },
      },
    } as any);

    // Log the email
    await ctx.runMutation(internal.domains.email.mutations.createEmailLog, {
      to: args.customerEmail,
      subject: `Pagamento Pendente - Reserva ${args.confirmationCode}`,
      type: "admin_reservation_payment_link",
      status: result.status === "sent" ? "sent" : "failed",
      error: result.error,
      messageId: (result as any).messageId,
      metadata: {
        confirmationCode: args.confirmationCode,
        assetName: args.assetName,
        totalAmount: args.totalAmount,
      },
    });

    return result;
  },
});

/**
 * Enviar email de confirmação de reserva usando bookingId
 * Esta função busca os dados da reserva e envia o email de confirmação
 * Deve ser chamada APENAS após aprovação do admin master
 */
export const sendBookingConfirmationEmailById = internalAction({
  args: {
    bookingId: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("package")
    ),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      console.log(`[EMAIL] Sending confirmation email for booking ${args.bookingId} (${args.bookingType}) - ADMIN APPROVED`);
      
      // Buscar dados da reserva para obter informações do cliente e asset
      const tables = [
        "activityBookings",
        "eventBookings", 
        "restaurantReservations",
        "vehicleBookings",
        "packageBookings"
      ];

      let booking: any = null;
      for (const tableName of tables) {
        try {
          booking = await ctx.runQuery(internal.domains.bookings.queries.getBookingByIdInternal, {
            bookingId: args.bookingId,
            tableName: tableName,
          });
          if (booking) {
            console.log(`[EMAIL] Found booking in table: ${tableName}`);
            break;
          }
        } catch (error) {
          // Continue tentando outras tabelas
        }
      }

      if (!booking) {
        console.error(`[EMAIL] Booking ${args.bookingId} not found in any table`);
        return { success: false, error: "Booking not found" };
      }

      // Buscar dados do cliente
      const customer = await ctx.runQuery(internal.domains.users.queries.getUserById, {
        userId: booking.userId,
      });

      if (!customer) {
        console.error(`[EMAIL] Customer not found for booking ${args.bookingId}`);
        return { success: false, error: "Customer not found" };
      }

      // Buscar dados do asset (atividade, evento, etc.)
      let assetName = "Reserva";
      let partnerName = "";
      let partnerEmail = "";

      try {
        // Determinar que tipo de asset buscar baseado no bookingType
        if (args.bookingType === "activity" && booking.activityId) {
          const activity = await ctx.runQuery(internal.domains.activities.queries.getActivityById, {
            activityId: booking.activityId,
          });
          assetName = activity?.title || "Atividade";
          if (activity?.partnerId) {
            const partner = await ctx.runQuery(internal.domains.users.queries.getUserById, {
              userId: activity.partnerId,
            });
            partnerName = partner?.name || "";
            partnerEmail = partner?.email || "";
          }
        } else if (args.bookingType === "event" && booking.eventId) {
          const event = await ctx.runQuery(internal.domains.events.queries.getEventById, {
            eventId: booking.eventId,
          });
          assetName = event?.title || "Evento";
          if (event?.partnerId) {
            const partner = await ctx.runQuery(internal.domains.users.queries.getUserById, {
              userId: event.partnerId,
            });
            partnerName = partner?.name || "";
            partnerEmail = partner?.email || "";
          }
        } else if (args.bookingType === "restaurant" && booking.restaurantId) {
          const restaurant = await ctx.runQuery(internal.domains.restaurants.queries.getRestaurantById, {
            restaurantId: booking.restaurantId,
          });
          assetName = restaurant?.name || "Restaurante";
          if (restaurant?.partnerId) {
            const partner = await ctx.runQuery(internal.domains.users.queries.getUserById, {
              userId: restaurant.partnerId,
            });
            partnerName = partner?.name || "";
            partnerEmail = partner?.email || "";
          }
        } else if (args.bookingType === "vehicle" && booking.vehicleId) {
          const vehicle = await ctx.runQuery(internal.domains.vehicles.queries.getVehicleById, {
            vehicleId: booking.vehicleId,
          });
          assetName = vehicle?.name || "Veículo";
          if (vehicle?.partnerId) {
            const partner = await ctx.runQuery(internal.domains.users.queries.getUserById, {
              userId: vehicle.partnerId,
            });
            partnerName = partner?.name || "";
            partnerEmail = partner?.email || "";
          }
        }
      } catch (assetError) {
        console.warn(`[EMAIL] Could not fetch asset details: ${assetError}`);
      }

      // Preparar dados para o email de confirmação
      const bookingDate = booking.date || booking.checkInDate || booking.startDate || new Date().toISOString();
      
      console.log(`[EMAIL] Sending confirmation email to ${customer.email} for ${assetName}`);

      // Chamar a função original de envio de email
      return await ctx.runAction(internal.domains.email.actions.sendBookingConfirmationEmail, {
        customerEmail: customer.email,
        customerName: customer.name || "Cliente",
        assetName: assetName,
        bookingType: args.bookingType,
        confirmationCode: booking.confirmationCode,
        bookingDate: bookingDate,
        totalPrice: booking.totalAmount,
        partnerName: partnerName,
        partnerEmail: partnerEmail,
        bookingDetails: {
          participants: booking.participants || booking.guestCount || booking.quantity || booking.partySize || 1,
          date: bookingDate,
          specialRequests: booking.specialRequests || booking.notes || booking.comments,
        },
      });

    } catch (error) {
      console.error(`[EMAIL] Failed to send confirmation email for booking ${args.bookingId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
}); 