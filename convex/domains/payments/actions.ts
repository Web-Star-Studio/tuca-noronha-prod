import { action } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import { getCurrentUserConvexId, getCurrentUserRole } from "../rbac/utils";

const MP_BASE_URL = "https://api.mercadopago.com";

/**
 * Create payment preference and update proposal in one action
 */
export const createPaymentPreferenceWithUpdate = action({
  args: v.object({
    proposalId: v.id("packageProposals"),
    items: v.array(v.object({
      id: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      category_id: v.optional(v.string()),
      quantity: v.number(),
      currency_id: v.string(),
      unit_price: v.number(),
    })),
    payer: v.optional(v.object({
      name: v.optional(v.string()),
      surname: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.object({
        area_code: v.string(),
        number: v.string(),
      })),
      identification: v.optional(v.object({
        type: v.string(),
        number: v.string(),
      })),
      address: v.optional(v.object({
        street_name: v.optional(v.string()),
        street_number: v.optional(v.number()),
        zip_code: v.optional(v.string()),
      })),
    })),
    back_urls: v.optional(v.object({
      success: v.string(),
      failure: v.string(),
      pending: v.string(),
    })),
    auto_return: v.optional(v.string()),
    external_reference: v.optional(v.string()),
    notification_url: v.optional(v.string()),
    statement_descriptor: v.optional(v.string()),
  }),
  returns: v.object({
    success: v.boolean(),
    preferenceId: v.optional(v.string()),
    initPoint: v.optional(v.string()),
    sandboxInitPoint: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get proposal
    const proposal = await ctx.runQuery(internal.domains.packageProposals.queries.internalGetProposal, {
      id: args.proposalId,
    });

    if (!proposal) {
      return {
        success: false,
        error: "Proposta não encontrada",
      };
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        success: false,
        error: "Token de acesso do Mercado Pago não configurado",
      };
    }

    try {
      // Mercado Pago requires HTTPS URLs, not localhost
      // Replace localhost URLs with production URL
      const productionUrl = "https://tucanoronha.com.br";
      const siteUrl = process.env.SITE_URL || productionUrl;
      
      const replaceLocalhost = (url: string): string => {
        // Replace localhost/127.0.0.1 URLs with production URL
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          const urlObj = new URL(url);
          return `${productionUrl}${urlObj.pathname}${urlObj.search}`;
        }
        return url;
      };
      
      console.log("[MP] SITE_URL:", siteUrl);
      
      const backUrls = args.back_urls || {
        success: replaceLocalhost(`${siteUrl}/pagamento/sucesso`),
        failure: replaceLocalhost(`${siteUrl}/pagamento/erro`),
        pending: replaceLocalhost(`${siteUrl}/pagamento/pendente`),
      };

      console.log("[MP] Back URLs:", backUrls);

      // Validate back_urls
      if (!backUrls.success) {
        return {
          success: false,
          error: "back_urls.success é obrigatório",
        };
      }

      const preferenceData = {
        items: args.items,
        payer: args.payer,
        statement_descriptor: args.statement_descriptor || "TUCA NORONHA",
        back_urls: backUrls,
        auto_return: "approved",
        external_reference: args.external_reference || args.proposalId,
        notification_url: args.notification_url || `${siteUrl}/api/webhooks/mercadopago`,
        payment_methods: {
          installments: 12,
        },
      };
      
      console.log("[MP] Preference data:", JSON.stringify(preferenceData, null, 2));

      const response = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `${args.proposalId}-${Date.now()}`,
        },
        body: JSON.stringify(preferenceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("MP API Error:", errorData);
        return {
          success: false,
          error: `Erro da API do Mercado Pago: ${errorData.message || response.statusText}`,
        };
      }

      const data = await response.json();
      
      console.log(`Payment preference created for proposal: ${args.proposalId}`);
      console.log(`Preference ID: ${data.id}`);
      console.log(`Init Point: ${data.init_point}`);
      
      return {
        success: true,
        preferenceId: data.id,
        initPoint: data.init_point,
        sandboxInitPoint: data.sandbox_init_point,
      };
    } catch (error) {
      console.error("Error creating MP preference:", error);
      return {
        success: false,
        error: `Erro ao criar preferência: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});

/**
 * Create Mercado Pago payment preference
 */
export const createMPPreference = action({
  args: v.object({
    proposalId: v.id("packageProposals"),
    items: v.array(v.object({
      id: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      category_id: v.optional(v.string()),
      quantity: v.number(),
      currency_id: v.string(),
      unit_price: v.number(),
    })),
    payer: v.optional(v.object({
      name: v.optional(v.string()),
      surname: v.optional(v.string()),
      email: v.optional(v.string()),
      phone: v.optional(v.object({
        area_code: v.string(),
        number: v.string(),
      })),
      identification: v.optional(v.object({
        type: v.string(),
        number: v.string(),
      })),
      address: v.optional(v.object({
        street_name: v.optional(v.string()),
        street_number: v.optional(v.number()),
        zip_code: v.optional(v.string()),
      })),
    })),
    back_urls: v.optional(v.object({
      success: v.string(),
      failure: v.string(),
      pending: v.string(),
    })),
    auto_return: v.optional(v.string()),
    external_reference: v.optional(v.string()),
    notification_url: v.optional(v.string()),
    statement_descriptor: v.optional(v.string()),
  }),
  returns: v.object({
    success: v.boolean(),
    preferenceId: v.optional(v.string()),
    initPoint: v.optional(v.string()),
    sandboxInitPoint: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        success: false,
        error: "Token de acesso do Mercado Pago não configurado",
      };
    }

    try {
      // Mercado Pago requires HTTPS URLs, not localhost
      const productionUrl = "https://tucanoronha.com.br";
      const siteUrl = process.env.SITE_URL || productionUrl;
      
      const replaceLocalhost = (url: string): string => {
        if (url.includes('localhost') || url.includes('127.0.0.1')) {
          const urlObj = new URL(url);
          return `${productionUrl}${urlObj.pathname}${urlObj.search}`;
        }
        return url;
      };
      
      const backUrls = args.back_urls || {
        success: replaceLocalhost(`${siteUrl}/pagamento/sucesso`),
        failure: replaceLocalhost(`${siteUrl}/pagamento/erro`),
        pending: replaceLocalhost(`${siteUrl}/pagamento/pendente`),
      };

      // Validate back_urls
      if (!backUrls.success) {
        return {
          success: false,
          error: "back_urls.success é obrigatório",
        };
      }

      const preferenceData = {
        items: args.items,
        payer: args.payer,
        statement_descriptor: args.statement_descriptor || "TUCA NORONHA",
        back_urls: backUrls,
        auto_return: "approved",
        external_reference: args.external_reference || args.proposalId,
        notification_url: args.notification_url || `${siteUrl}/api/webhooks/mercadopago`,
        payment_methods: {
          installments: 12,
        },
      };

      const response = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `${args.proposalId}-${Date.now()}`,
        },
        body: JSON.stringify(preferenceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("MP API Error:", errorData);
        return {
          success: false,
          error: `Erro da API do Mercado Pago: ${errorData.message || response.statusText}`,
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        preferenceId: data.id,
        initPoint: data.init_point,
        sandboxInitPoint: data.sandbox_init_point,
      };
    } catch (error) {
      console.error("Error creating MP preference:", error);
      return {
        success: false,
        error: `Erro ao criar preferência: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});

/**
 * Process Mercado Pago webhook
 */
export const processMPWebhook = action({
  args: v.object({
    webhookData: v.object({
      id: v.number(),
      live_mode: v.boolean(),
      type: v.string(),
      date_created: v.string(),
      application_id: v.number(),
      user_id: v.number(),
      version: v.number(),
      api_version: v.string(),
      action: v.string(),
      data: v.object({
        id: v.string(),
      }),
    }),
  }),
  returns: v.object({
    success: v.boolean(),
    paymentData: v.optional(v.object({
      id: v.string(),
      preferenceId: v.optional(v.string()),
      status: v.string(),
      status_detail: v.optional(v.string()),
      transaction_amount: v.optional(v.number()),
      payment_method_id: v.optional(v.string()),
      payment_type_id: v.optional(v.string()),
      date_approved: v.optional(v.string()),
      date_created: v.optional(v.string()),
    })),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        success: false,
        error: "Token de acesso do Mercado Pago não configurado",
      };
    }

    try {
      const { webhookData } = args;
      
      // Only process payment notifications
      if (webhookData.type !== "payment") {
        return {
          success: true,
          error: "Tipo de webhook não suportado",
        };
      }

      // Get payment details from MP API
      const response = await fetch(`${MP_BASE_URL}/v1/payments/${webhookData.data.id}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("MP API Error:", errorData);
        return {
          success: false,
          error: `Erro da API do Mercado Pago: ${errorData.message || response.statusText}`,
        };
      }

      const paymentData = await response.json();
      
      return {
        success: true,
        paymentData: {
          id: paymentData.id.toString(),
          preferenceId: paymentData.additional_info?.preference_id,
          status: paymentData.status,
          status_detail: paymentData.status_detail,
          transaction_amount: paymentData.transaction_amount,
          payment_method_id: paymentData.payment_method_id,
          payment_type_id: paymentData.payment_type_id,
          date_approved: paymentData.date_approved,
          date_created: paymentData.date_created,
        },
      };
    } catch (error) {
      console.error("Error processing MP webhook:", error);
      return {
        success: false,
        error: `Erro ao processar webhook: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});

/**
 * Get payment details from Mercado Pago
 */
export const getPaymentDetails = action({
  args: v.object({
    paymentId: v.string(),
  }),
  returns: v.object({
    success: v.boolean(),
    paymentData: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        success: false,
        error: "Token de acesso do Mercado Pago não configurado",
      };
    }

    try {
      const response = await fetch(`${MP_BASE_URL}/v1/payments/${args.paymentId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: `Erro da API do Mercado Pago: ${errorData.message || response.statusText}`,
        };
      }

      const paymentData = await response.json();
      
      return {
        success: true,
        paymentData,
      };
    } catch (error) {
      console.error("Error getting payment details:", error);
      return {
        success: false,
        error: `Erro ao buscar detalhes do pagamento: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});

/**
 * Refund a payment (full or partial)
 */
export const refundPayment = action({
  args: v.object({
    paymentId: v.string(),
    amount: v.optional(v.number()), // If not provided, full refund
  }),
  returns: v.object({
    success: v.boolean(),
    refundId: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        success: false,
        error: "Token de acesso do Mercado Pago não configurado",
      };
    }

    try {
      const body = args.amount ? { amount: args.amount } : {};
      
      const response = await fetch(`${MP_BASE_URL}/v1/payments/${args.paymentId}/refunds`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("MP Refund Error:", errorData);
        return {
          success: false,
          error: `Erro ao processar reembolso: ${errorData.message || response.statusText}`,
        };
      }

      const refundData = await response.json();
      
      return {
        success: true,
        refundId: refundData.id.toString(),
      };
    } catch (error) {
      console.error("Error processing refund:", error);
      return {
        success: false,
        error: `Erro ao processar reembolso: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});

/**
 * Cancel a payment (only for pending/in_process payments)
 */
export const cancelPayment = action({
  args: v.object({
    paymentId: v.string(),
  }),
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        success: false,
        error: "Token de acesso do Mercado Pago não configurado",
      };
    }

    try {
      const response = await fetch(`${MP_BASE_URL}/v1/payments/${args.paymentId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("MP Cancellation Error:", errorData);
        return {
          success: false,
          error: `Erro ao cancelar pagamento: ${errorData.message || response.statusText}`,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error cancelling payment:", error);
      return {
        success: false,
        error: `Erro ao cancelar pagamento: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});

/**
 * Get chargeback details
 */
export const getChargebackDetails = action({
  args: v.object({
    chargebackId: v.string(),
  }),
  returns: v.object({
    success: v.boolean(),
    chargebackData: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return {
        success: false,
        error: "Token de acesso do Mercado Pago não configurado",
      };
    }

    try {
      const response = await fetch(`${MP_BASE_URL}/v1/chargebacks/${args.chargebackId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: `Erro ao buscar chargeback: ${errorData.message || response.statusText}`,
        };
      }

      const chargebackData = await response.json();
      
      return {
        success: true,
        chargebackData,
      };
    } catch (error) {
      console.error("Error getting chargeback details:", error);
      return {
        success: false,
        error: `Erro ao buscar chargeback: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      };
    }
  },
});
