"use node";

import { internalAction, action } from "../../_generated/server";
import { v } from "convex/values";
import { internal } from "../../_generated/api";
import {
  createPaymentValidator,
  capturePaymentValidator,
  cancelPaymentValidator,
  refundPaymentValidator,
  processWebhookValidator,
  createCheckoutPreferenceForBookingValidator,
} from "./types";
import { mpFetch } from "./utils";

/**
 * Create a Checkout Preference (Checkout Pro)
 */
export const createCheckoutPreference = internalAction({
  args: {
    bookingId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("package"),
    ),
    title: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    currency: v.optional(v.string()),
    metadata: v.optional(v.object({
      assetId: v.optional(v.string()),
      userId: v.optional(v.string()),
      bookingId: v.optional(v.string()),
    })),
    backUrls: v.optional(v.object({
      success: v.string(),
      pending: v.string(),
      failure: v.string(),
    })),
    notificationUrl: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    id: v.optional(v.string()),
    initPoint: v.optional(v.string()),
    sandboxInitPoint: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const body: any = {
        items: [
          {
            title: args.title,
            quantity: args.quantity,
            currency_id: args.currency || "BRL",
            unit_price: args.unitPrice,
          },
        ],
        metadata: {
          bookingId: args.bookingId,
          assetType: args.assetType,
          ...(args.metadata || {}),
        },
        // Configurações para facilitar testes
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 1, // Força parcelamento em 1x para simplificar
        },
        // Configurar para não solicitar login/cadastro desnecessário
        purpose: "wallet_purchase",
      };
      if (args.backUrls) body.back_urls = args.backUrls;
      if (args.notificationUrl) body.notification_url = args.notificationUrl;

      const pref = await mpFetch<any>("/checkout/preferences", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Store preference id on booking
      await ctx.runMutation(internal.domains.mercadoPago.mutations.updateBookingMpInfo, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        mpPreferenceId: String(pref.id),
        paymentStatus: "pending",
      });

      return {
        success: true,
        id: String(pref.id),
        initPoint: pref.init_point,
        sandboxInitPoint: pref.sandbox_init_point,
      };
    } catch (error) {
      console.error("Failed to create MP preference:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Client-callable: Create a Checkout Preference for a booking
 * Mirrors Stripe's createCheckoutSession behavior
 */
export const createCheckoutPreferenceForBooking = action({
  args: createCheckoutPreferenceForBookingValidator,
  returns: v.object({
    preferenceId: v.string(),
    preferenceUrl: v.string(),
    initPoint: v.optional(v.string()),
    sandboxInitPoint: v.optional(v.string()),
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // 1) Fetch booking + asset info (provider-agnostic)
      const booking = await ctx.runQuery(internal.domains.bookings.checkout.getBookingForCheckout, {
        bookingId: args.bookingId,
        assetType: args.assetType,
      });

      if (!booking) {
        throw new Error("Booking not found");
      }

      // 2) Determine pricing
      const originalAmount = args.originalAmount ?? booking.totalPrice;
      const finalAmount = args.finalAmount ?? booking.totalPrice;
      const discountAmount = args.discountAmount ?? 0;
      const _hasCoupon = Boolean(args.couponCode && discountAmount > 0);

      // 3) Build URLs
      const successUrl = args.successUrl;
      const cancelUrl = args.cancelUrl;
      const siteUrl = (process.env.CONVEX_SITE_URL || "").replace(/\/$/, "");
      const notificationUrl = siteUrl ? `${siteUrl}/mercadopago/webhook` : undefined;

      // 4) Create preference via internal action
      const pref = await ctx.runAction(internal.domains.mercadoPago.actions.createCheckoutPreference, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        title: booking.assetName,
        quantity: 1,
        unitPrice: finalAmount,
        currency: args.currency || "BRL",
        metadata: {
          assetId: String(booking.assetId),
          userId: String(booking.userId),
          bookingId: String(args.bookingId),
        },
        backUrls: {
          success: successUrl,
          pending: successUrl,
          failure: cancelUrl,
        },
        notificationUrl,
      });

      if (!pref.success || !pref.id) {
        throw new Error(pref.error || "Failed to create Mercado Pago preference");
      }

      // Always prioritize sandboxInitPoint if available (for test credentials)
      // If only initPoint is available, use it (for production credentials)
      const preferredUrl = pref.sandboxInitPoint || pref.initPoint;

      return {
        success: true,
        preferenceId: pref.id,
        preferenceUrl: preferredUrl || "",
        initPoint: pref.initPoint,
        sandboxInitPoint: pref.sandboxInitPoint,
      };
    } catch (error) {
      console.error("Failed to create MP checkout preference for booking:", error);
      return {
        success: false,
        preferenceId: "",
        preferenceUrl: "",
        error: error instanceof Error ? error.message : "Unknown error",
      } as any;
    }
  },
});

/**
 * Create a direct card payment using token (Bricks)
 */
export const createPayment = internalAction({
  args: createPaymentValidator,
  returns: v.object({
    success: v.boolean(),
    paymentId: v.optional(v.union(v.string(), v.number())),
    status: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      const body: any = {
        token: args.token,
        transaction_amount: args.transactionAmount,
        payment_method_id: args.paymentMethodId,
        installments: args.installments,
        payer: args.payer,
        binary_mode: false,
        capture: false, // Autorização apenas - captura manual quando admin confirmar
        metadata: {
          bookingId: args.bookingId,
          assetType: args.assetType,
          ...(args.metadata || {}),
        },
      };

      if (args.currency) body.currency_id = args.currency;

      const payment = await mpFetch<any>("/v1/payments", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Update booking payment status
      await ctx.runMutation(internal.domains.mercadoPago.mutations.updateBookingPaymentStatus, {
        bookingId: args.bookingId,
        paymentStatus: payment.status,
        paymentId: String(payment.id),
        receiptUrl: payment.receipt_url || undefined,
      });

      // Store MP paymentId
      await ctx.runMutation(internal.domains.mercadoPago.mutations.updateBookingMpInfo, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        mpPaymentId: String(payment.id),
      });

      return {
        success: true,
        paymentId: payment.id,
        status: payment.status,
      };
    } catch (error) {
      console.error("Failed to create MP payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

/**
 * Capture an authorized payment
 */
export const capturePayment = internalAction({
  args: capturePaymentValidator,
  returns: v.object({ success: v.boolean(), status: v.optional(v.string()), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    try {
      // Capturar o valor total autorizado (sem especificar amount para capturar tudo)
      const body: any = { capture: true };
      if (args.amount) {
        body.transaction_amount = args.amount;
      }
      
      const res = await mpFetch<any>(`/v1/payments/${args.paymentId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      return { success: true, status: res.status };
    } catch (error) {
      console.error("Failed to capture MP payment:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

/**
 * Cancel a payment (authorized)
 */
export const cancelPayment = internalAction({
  args: cancelPaymentValidator,
  returns: v.object({ success: v.boolean(), status: v.optional(v.string()), error: v.optional(v.string()) }),
  handler: async (_ctx, args) => {
    try {
      const res = await mpFetch<any>(`/v1/payments/${args.paymentId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" }),
      });
      return { success: true, status: res.status };
    } catch (error) {
      console.error("Failed to cancel MP payment:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

/**
 * Create a refund for a payment
 */
export const createRefund = internalAction({
  args: refundPaymentValidator,
  returns: v.object({ success: v.boolean(), refundId: v.optional(v.union(v.string(), v.number())), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    try {
      const res = await mpFetch<any>(`/v1/payments/${args.paymentId}/refunds`, {
        method: "POST",
        body: JSON.stringify({ amount: args.amount, reason: args.reason }),
      });

      await ctx.runMutation(internal.domains.mercadoPago.mutations.addRefundToBooking, {
        bookingId: String(res.metadata?.bookingId || ""),
        refundId: res.id,
        amount: res.amount || args.amount || 0,
        reason: args.reason,
        status: res.status || "succeeded",
      });

      return { success: true, refundId: res.id };
    } catch (error) {
      console.error("Failed to create MP refund:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});

/**
 * Alias for createRefund to maintain consistency with naming
 */
export const refundPayment = createRefund;

/**
 * Process Mercado Pago webhook events
 */
/**
 * Approve a booking and capture payment (if needed)
 * Public action that can be called by partners/employees
 */
export const approveBookingAndCapturePayment = action({
  args: {
    bookingId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("package")
    ),
    partnerNotes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // First, get the booking to find the payment info
    const tables = [
      "activityBookings",
      "eventBookings",
      "restaurantReservations",
      "vehicleBookings",
      "packageBookings"
    ];

    let booking: any;
    for (const tableName of tables) {
      booking = await ctx.runQuery(internal.domains.bookings.queries.getBookingByIdInternal, {
        bookingId: args.bookingId,
        tableName: tableName,
      });
      if (booking) break;
    }

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    try {
      let finalPaymentStatus = booking.paymentStatus;

      // Capturar pagamento Mercado Pago autorizado
      if (booking.mpPaymentId) {
        // Verificar se é um pagamento que precisa de captura (autorizado)
        if (booking.paymentStatus === "authorized" || booking.paymentStatus === "pending") {
          console.log(`Capturing MP payment ${booking.mpPaymentId} for booking ${args.bookingId}`);
          
          const captureResult = await ctx.runAction(internal.domains.mercadoPago.actions.capturePayment, {
            paymentId: booking.mpPaymentId,
          });

          if (!captureResult.success) {
            console.error(`Failed to capture payment ${booking.mpPaymentId}:`, captureResult.error);
            return { success: false, error: `Falha ao capturar pagamento: ${captureResult.error}` };
          }
          
          finalPaymentStatus = "paid";
          console.log(`Payment ${booking.mpPaymentId} captured successfully`);
        } else if (booking.paymentStatus === "paid") {
          // Pagamento já foi capturado anteriormente
          finalPaymentStatus = "paid";
        } else {
          return { success: false, error: `Status de pagamento inválido para captura: ${booking.paymentStatus}` };
        }
      }

      // Atualizar status da reserva para confirmado APENAS após captura bem-sucedida
      await ctx.runMutation(internal.domains.bookings.mutations.updateBookingStatusInternal, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        status: "confirmed",
        paymentStatus: finalPaymentStatus,
        partnerNotes: args.partnerNotes,
      });

      // Generate voucher for confirmed booking
      try {
        await ctx.runMutation(internal.domains.vouchers.mutations.generateVoucherInternal, {
          bookingId: args.bookingId,
          bookingType: args.assetType,
        });
      } catch (voucherError) {
        console.error("Failed to generate voucher:", voucherError);
      }

      // Send confirmation email
      try {
        await ctx.runAction(internal.domains.email.actions.sendBookingConfirmationEmail, {
          bookingId: args.bookingId,
          bookingType: args.assetType,
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }

      return { success: true };
    } catch (error) {
      console.error("Error approving booking:", error);
      return { success: false, error: "Failed to approve booking" };
    }
  },
});

/**
 * Reject a booking and cancel payment
 * Public action that can be called by partners/employees
 */
export const rejectBookingAndCancelPayment = action({
  args: {
    bookingId: v.string(),
    assetType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
      v.literal("package")
    ),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    // First, get the booking to find the payment info
    const tables = [
      "activityBookings",
      "eventBookings",
      "restaurantReservations",
      "vehicleBookings",
      "packageBookings"
    ];

    let booking: any;
    for (const tableName of tables) {
      booking = await ctx.runQuery(internal.domains.bookings.queries.getBookingByIdInternal, {
        bookingId: args.bookingId,
        tableName: tableName,
      });
      if (booking) break;
    }

    if (!booking) {
      return { success: false, error: "Booking not found" };
    }

    try {
      // Processar cancelamento/estorno do pagamento Mercado Pago
      if (booking.mpPaymentId) {
        if (booking.paymentStatus === "authorized" || booking.paymentStatus === "pending") {
          // Cancelar pagamento autorizado (libera valor no cartão sem cobrança)
          console.log(`Canceling authorized payment ${booking.mpPaymentId} for booking ${args.bookingId}`);
          
          const cancelResult = await ctx.runAction(internal.domains.mercadoPago.actions.cancelPayment, {
            paymentId: booking.mpPaymentId,
          });

          if (!cancelResult.success) {
            console.error("Failed to cancel authorized payment:", cancelResult.error);
          } else {
            console.log(`Authorized payment ${booking.mpPaymentId} cancelled successfully`);
          }
        } else if (booking.paymentStatus === "paid" || booking.paymentStatus === "succeeded") {
          // Refund the payment
          const refundResult = await ctx.runAction(internal.domains.mercadoPago.actions.refundPayment, {
            paymentId: booking.mpPaymentId,
          });

          if (!refundResult.success) {
            console.error("Failed to refund payment:", refundResult.error);
          }
        }
      }

      // Update booking status to canceled
      await ctx.runMutation(internal.domains.bookings.mutations.updateBookingStatusInternal, {
        bookingId: args.bookingId,
        assetType: args.assetType,
        status: "canceled",
        paymentStatus: "refunded",
        partnerNotes: args.reason,
      });

      // Send cancellation email
      try {
        await ctx.runAction(internal.domains.email.actions.sendBookingCancelledEmail, {
          bookingId: args.bookingId,
          bookingType: args.assetType,
          reason: args.reason,
        });
      } catch (emailError) {
        console.error("Failed to send cancellation email:", emailError);
      }

      return { success: true };
    } catch (error) {
      console.error("Error rejecting booking:", error);
      return { success: false, error: "Failed to reject booking" };
    }
  },
});

export const processWebhookEvent = internalAction({
  args: processWebhookValidator,
  returns: v.object({ success: v.boolean(), processed: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    try {
      const eventId = args.id != null ? String(args.id) : undefined;

      if (eventId == null) {
        return { success: false, processed: false, error: "Missing event id" };
      }

      // Idempotency check
      const existing = await ctx.runQuery(internal.domains.mercadoPago.queries.getWebhookEvent, {
        mpEventId: eventId!,
      });
      if (existing && existing.processed) {
        return { success: true, processed: true };
      }

      // Store event minimally
      await ctx.runMutation(internal.domains.mercadoPago.mutations.storeWebhookEvent, {
        mpEventId: eventId!,
        type: args.type,
        action: args.action,
        eventData: args.data || {},
      });

      // If payment notification, fetch full payment
      if ((args.type === "payment" || args.action?.startsWith("payment.")) && args.data && (args as any).data.id) {
        const paymentId = (args as any).data.id;
        
        // Handle test payments gracefully
        let payment: any = null;
        try {
          payment = await mpFetch<any>(`/v1/payments/${paymentId}`);
        } catch (error) {
          console.warn(`Payment ${paymentId} not found (likely test payment):`, error instanceof Error ? error.message : String(error));
          // For test payments or non-existent payments, still mark webhook as processed
          return { success: true, processed: true };
        }

        const bookingId = payment.metadata?.bookingId;
        const assetType = payment.metadata?.assetType as any;
        const assetId = payment.metadata?.assetId ? String(payment.metadata.assetId) : undefined;

        if (bookingId) {
          await ctx.runMutation(internal.domains.mercadoPago.mutations.updateBookingPaymentStatus, {
            bookingId: String(bookingId),
            paymentStatus: payment.status,
            paymentId: String(payment.id),
            receiptUrl: payment.receipt_url || undefined,
          });

          if (assetType) {
            await ctx.runMutation(internal.domains.mercadoPago.mutations.updateBookingMpInfo, {
              bookingId: String(bookingId),
              assetType,
              mpPaymentId: String(payment.id),
            });
          }

          // Enrich stored webhook event with relations for easier querying
          await ctx.runMutation(internal.domains.mercadoPago.mutations.updateWebhookEventRelations, {
            mpEventId: String(eventId),
            relatedBookingId: String(bookingId),
            relatedAssetType: assetType ? String(assetType) : undefined,
            relatedAssetId: assetId,
          });
        }
      }

      await ctx.runMutation(internal.domains.mercadoPago.mutations.markWebhookEventProcessed, {
        mpEventId: eventId!,
      });

      return { success: true, processed: true };
    } catch (error) {
      console.error("Failed to process MP webhook:", error);
      if ((args as any).id != null) {
        await ctx.runMutation(internal.domains.mercadoPago.mutations.addWebhookEventError, {
          mpEventId: String((args as any).id),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
      return { success: false, processed: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});
