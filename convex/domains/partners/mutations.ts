import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

// Criar um novo partner (chamado após criação no Stripe)
export const createPartner = internalMutation({
  args: {
    userId: v.id("users"),
    stripeAccountId: v.string(),
    country: v.string(),
    businessType: v.optional(v.string()),
    businessName: v.optional(v.string()),
    defaultFeePercentage: v.number(),
  },
  returns: v.id("partners"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Verificar se já existe um partner para este usuário
    const existingPartner = await ctx.db
      .query("partners")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
      
    if (existingPartner) {
      throw new Error("Partner já existe para este usuário");
    }
    
    // Criar o partner
    const partnerId = await ctx.db.insert("partners", {
      userId: args.userId,
      stripeAccountId: args.stripeAccountId,
      onboardingStatus: "pending",
      feePercentage: args.defaultFeePercentage,
      isActive: false, // Ativo apenas após onboarding completo
      capabilities: {
        cardPayments: false,
        transfers: false,
      },
      metadata: {
        country: args.country,
        businessType: args.businessType,
        businessName: args.businessName,
      },
      createdAt: now,
      updatedAt: now,
    });
    
    // Criar registro inicial de taxa
    await ctx.db.insert("partnerFees", {
      partnerId,
      feePercentage: args.defaultFeePercentage,
      effectiveDate: now,
      createdBy: args.userId,
      reason: "Taxa inicial padrão",
    });
    
    return partnerId;
  },
});

// Atualizar status do onboarding
export const updateOnboardingStatus = internalMutation({
  args: {
    stripeAccountId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("rejected")
    ),
    capabilities: v.optional(v.object({
      cardPayments: v.boolean(),
      transfers: v.boolean(),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const partner = await ctx.db
      .query("partners")
      .withIndex("by_stripeAccountId", (q) => q.eq("stripeAccountId", args.stripeAccountId))
      .unique();
      
    if (!partner) {
      throw new Error("Partner não encontrado");
    }
    
    const updates: any = {
      onboardingStatus: args.status,
      updatedAt: Date.now(),
    };
    
    // Ativar partner se onboarding estiver completo
    if (args.status === "completed") {
      updates.isActive = true;
    }
    
    // Atualizar capabilities se fornecidas
    if (args.capabilities) {
      updates.capabilities = args.capabilities;
    }
    
    await ctx.db.patch(partner._id, updates);
    return null;
  },
});

// Atualizar taxa do partner (apenas admin master)
export const updatePartnerFee = mutation({
  args: {
    partnerId: v.id("partners"),
    feePercentage: v.number(),
    reason: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Verificar se o usuário é admin master
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autorizado");
    }
    
    // Validar porcentagem
    if (args.feePercentage < 0 || args.feePercentage > 100) {
      throw new Error("Taxa deve estar entre 0% e 100%");
    }
    
    const partner = await ctx.db.get(args.partnerId);
    if (!partner) {
      throw new Error("Partner não encontrado");
    }
    
    const userId = identity.subject as Id<"users">;
    const now = Date.now();
    
    // Criar registro de alteração de taxa
    await ctx.db.insert("partnerFees", {
      partnerId: args.partnerId,
      feePercentage: args.feePercentage,
      effectiveDate: now,
      createdBy: userId,
      reason: args.reason || "Alteração manual",
      previousFee: partner.feePercentage,
    });
    
    // Atualizar taxa no partner
    await ctx.db.patch(args.partnerId, {
      feePercentage: args.feePercentage,
      updatedAt: now,
    });
    
    return null;
  },
});

// Registrar transação de partner
export const recordPartnerTransaction = internalMutation({
  args: {
    partnerId: v.id("partners"),
    bookingId: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("vehicle"),
      v.literal("accommodation"),
      v.literal("package")
    ),
    stripePaymentIntentId: v.string(),
    stripeTransferId: v.optional(v.string()),
    amount: v.number(),
    platformFee: v.number(),
    partnerAmount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    metadata: v.any(),
  },
  returns: v.id("partnerTransactions"),
  handler: async (ctx, args) => {
    const transactionId = await ctx.db.insert("partnerTransactions", {
      ...args,
      createdAt: Date.now(),
    });
    
    return transactionId;
  },
});

/**
 * Create a partner transaction record
 * Called when a payment is processed
 */
export const createPartnerTransaction = internalMutation({
  args: {
    partnerId: v.id("partners"),
    bookingId: v.string(),
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("vehicle"),
      v.literal("accommodation"),
      v.literal("package")
    ),
    stripePaymentIntentId: v.string(),
    stripeTransferId: v.optional(v.string()),
    amount: v.number(), // in cents
    platformFee: v.number(), // in cents
    partnerAmount: v.number(), // in cents
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Create the transaction record
    const transactionId = await ctx.db.insert("partnerTransactions", {
      partnerId: args.partnerId,
      bookingId: args.bookingId,
      bookingType: args.bookingType,
      stripePaymentIntentId: args.stripePaymentIntentId,
      stripeTransferId: args.stripeTransferId,
      amount: args.amount,
      platformFee: args.platformFee,
      partnerAmount: args.partnerAmount,
      currency: args.currency,
      status: args.status,
      metadata: args.metadata || {},
      createdAt: Date.now(),
    });

    return transactionId;
  },
});

/**
 * Update partner transaction status
 * Called when payment status changes
 */
export const updatePartnerTransactionStatus = internalMutation({
  args: {
    stripePaymentIntentId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    stripeTransferId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find the transaction by payment intent ID
    const transaction = await ctx.db
      .query("partnerTransactions")
      .withIndex("by_stripePaymentIntentId", (q) => 
        q.eq("stripePaymentIntentId", args.stripePaymentIntentId)
      )
      .first();

    if (!transaction) {
      throw new Error("Partner transaction not found");
    }

    // Update the transaction
    await ctx.db.patch(transaction._id, {
      status: args.status,
      stripeTransferId: args.stripeTransferId || transaction.stripeTransferId,
    });

    return transaction._id;
  },
});

// Ativar/Desativar partner
export const togglePartnerActive = mutation({
  args: {
    partnerId: v.id("partners"),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // TODO: Verificar se o usuário é admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Não autorizado");
    }
    
    await ctx.db.patch(args.partnerId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });
    
    return null;
  },
}); 

/**
 * Handle partner transaction error
 * Reverses transaction and updates status
 */
export const handlePartnerTransactionError = internalMutation({
  args: {
    transactionId: v.id("partnerTransactions"),
    error: v.string(),
    shouldReverse: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Update transaction status to failed
    await ctx.db.patch(args.transactionId, {
      status: "failed",
      metadata: {
        ...transaction.metadata,
        error: args.error,
        failedAt: Date.now(),
      },
    });

    // Create notification for partner about failed transaction
    await ctx.db.insert("notifications", {
      userId: (await ctx.db.get(transaction.partnerId))?.userId!,
      type: "transaction_failed",
      title: "Falha na Transação",
      message: `Houve um erro ao processar a transação da reserva ${transaction.bookingId}. Motivo: ${args.error}`,
      relatedId: args.transactionId,
      relatedType: "partner_transaction",
      isRead: false,
      data: {
        bookingType: transaction.bookingType,
        // Store error in message since data doesn't support arbitrary fields
      },
      createdAt: Date.now(),
    });

    return args.transactionId;
  },
});

/**
 * Process partner transaction refund
 * Updates transaction when a refund is processed
 */
export const processPartnerTransactionRefund = internalMutation({
  args: {
    stripePaymentIntentId: v.string(),
    refundAmount: v.number(), // in cents
    refundId: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the original transaction
    const transaction = await ctx.db
      .query("partnerTransactions")
      .withIndex("by_stripePaymentIntentId", (q) =>
        q.eq("stripePaymentIntentId", args.stripePaymentIntentId)
      )
      .first();

    if (!transaction) {
      console.error("Partner transaction not found for refund:", args.stripePaymentIntentId);
      return null;
    }

    // Calculate proportional refund amounts
    const refundPercentage = args.refundAmount / transaction.amount;
    const platformFeeRefund = Math.floor(transaction.platformFee * refundPercentage);
    const partnerRefund = Math.floor(transaction.partnerAmount * refundPercentage);

    // Update transaction status to refunded
    await ctx.db.patch(transaction._id, {
      status: "refunded",
      metadata: {
        ...transaction.metadata,
        refundId: args.refundId,
        refundAmount: args.refundAmount,
        refundReason: args.reason,
        refundedAt: Date.now(),
        platformFeeRefund,
        partnerRefund,
      },
    });

    // Get partner info for notification
    const partner = await ctx.db.get(transaction.partnerId);
    if (!partner) {
      console.error("Partner not found for transaction:", transaction.partnerId);
      return transaction._id;
    }

    // Create notification for partner about refund
    await ctx.db.insert("notifications", {
      userId: partner.userId,
      type: "transaction_refunded",
      title: "Transação Estornada",
      message: `A transação da reserva ${transaction.bookingId} foi estornada. Valor: R$ ${(partnerRefund / 100).toFixed(2)}`,
      relatedId: transaction._id,
      relatedType: "partner_transaction",
      isRead: false,
      data: {
        bookingType: transaction.bookingType,
        // Refund details are in the message
      },
      createdAt: Date.now(),
    });

    return transaction._id;
  },
});

/**
 * Create notification for new partner transaction
 * Called when a payment is successfully captured
 */
export const notifyPartnerNewTransaction = internalMutation({
  args: {
    transactionId: v.id("partnerTransactions"),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const partner = await ctx.db.get(transaction.partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    // Get booking details for the notification
    let bookingName = "Reserva";
    let customerName = "Cliente";
    
    // Try to get booking details based on type
    const bookingTables = {
      activity: "activityBookings",
      event: "eventBookings", 
      vehicle: "vehicleBookings",
      accommodation: "accommodationBookings",
      package: "packageBookings",
    };

    const tableName = bookingTables[transaction.bookingType as keyof typeof bookingTables];
    if (tableName) {
      const booking = await ctx.db
        .query(tableName as any)
        .filter((q) => q.eq(q.field("_id"), transaction.bookingId))
        .first();
      
      if (booking) {
        customerName = booking.customerInfo?.name || booking.customerName || "Cliente";
        
        // Get asset name based on type
        switch (transaction.bookingType) {
          case "activity":
            const activity = await ctx.db.get((booking as any).activityId);
            bookingName = (activity as any)?.title || "Atividade";
            break;
          case "event":
            const event = await ctx.db.get((booking as any).eventId);
            bookingName = (event as any)?.title || "Evento";
            break;
          case "vehicle":
            const vehicle = await ctx.db.get((booking as any).vehicleId);
            bookingName = `${(vehicle as any)?.brand} ${(vehicle as any)?.model}` || "Veículo";
            break;
          case "accommodation":
            const accommodation = await ctx.db.get((booking as any).accommodationId);
            bookingName = (accommodation as any)?.name || "Hospedagem";
            break;
        }
      }
    }

    // Create notification
    await ctx.db.insert("notifications", {
      userId: partner.userId,
      type: "new_transaction",
      title: "Nova Transação Recebida! 💰",
      message: `Pagamento de ${customerName} para ${bookingName} foi processado. Valor líquido: R$ ${(transaction.partnerAmount / 100).toFixed(2)}`,
      relatedId: args.transactionId,
      relatedType: "partner_transaction",
      isRead: false,
      data: {
        bookingType: transaction.bookingType,
        assetName: bookingName,
      },
      createdAt: Date.now(),
    });

    return args.transactionId;
  },
}); 