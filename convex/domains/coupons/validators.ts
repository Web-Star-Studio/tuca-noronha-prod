import { v } from "convex/values";

// Validador para dados de cupom
export const couponValidator = v.object({
  code: v.string(),
  name: v.string(),
  description: v.string(),
  discountType: v.union(v.literal("percentage"), v.literal("fixed_amount")),
  discountValue: v.number(),
  maxDiscountAmount: v.optional(v.number()),
  minimumOrderValue: v.optional(v.number()),
  maximumOrderValue: v.optional(v.number()),
  usageLimit: v.optional(v.number()),
  userUsageLimit: v.optional(v.number()),
  validFrom: v.number(),
  validUntil: v.number(),
  type: v.union(
    v.literal("public"),
    v.literal("private"),
    v.literal("first_purchase"),
    v.literal("returning_customer")
  ),
  applicableAssets: v.array(v.object({
    assetType: v.union(
      v.literal("activities"),
      v.literal("events"),
      v.literal("restaurants"),
      v.literal("vehicles"),
      v.literal("accommodations"),
      v.literal("packages")
    ),
    assetId: v.string(),
    isActive: v.boolean(),
  })),
  globalApplication: v.object({
    isGlobal: v.boolean(),
    assetTypes: v.array(v.string()),
  }),
  allowedUsers: v.array(v.id("users")),
  isActive: v.boolean(),
  isPubliclyVisible: v.boolean(),
  stackable: v.boolean(),
  autoApply: v.boolean(),
  notifyOnExpiration: v.boolean(),
});

// Validador para filtros de listagem
export const couponFiltersValidator = v.object({
  partnerId: v.optional(v.id("users")),
  organizationId: v.optional(v.id("partnerOrganizations")),
  isActive: v.optional(v.boolean()),
  type: v.optional(v.string()),
  assetType: v.optional(v.string()),
  validFrom: v.optional(v.number()),
  validUntil: v.optional(v.number()),
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
});

// Validador para aplicação de cupom
export const applyCouponValidator = v.object({
  couponCode: v.string(),
  userId: v.id("users"),
  bookingId: v.string(),
  bookingType: v.union(
    v.literal("activity"),
    v.literal("event"),
    v.literal("restaurant"),
    v.literal("vehicle"),
    v.literal("accommodation"),
    v.literal("package")
  ),
  originalAmount: v.number(),
  assetType: v.optional(v.string()),
  assetId: v.optional(v.string()),
});

// Validador para elegibilidade de cupom
export const couponEligibilityValidator = v.object({
  couponId: v.id("coupons"),
  userId: v.optional(v.id("users")),
  assetType: v.optional(v.string()),
  assetId: v.optional(v.string()),
  orderValue: v.optional(v.number()),
});

// Validador para relatório de uso
export const usageReportValidator = v.object({
  partnerId: v.optional(v.id("users")),
  organizationId: v.optional(v.id("partnerOrganizations")),
  startDate: v.number(),
  endDate: v.number(),
  groupBy: v.optional(v.union(
    v.literal("day"),
    v.literal("week"),
    v.literal("month")
  )),
  includeRefunded: v.optional(v.boolean()),
});

// Validações de negócio
export const validateCouponCode = (code: string): { isValid: boolean; error?: string } => {
  if (!code || code.trim().length === 0) {
    return { isValid: false, error: "Código do cupom é obrigatório" };
  }

  if (code.length < 3) {
    return { isValid: false, error: "Código deve ter pelo menos 3 caracteres" };
  }

  if (code.length > 20) {
    return { isValid: false, error: "Código deve ter no máximo 20 caracteres" };
  }

  // Apenas letras, números e hífen
  const codeRegex = /^[A-Z0-9-]+$/;
  if (!codeRegex.test(code.toUpperCase())) {
    return { isValid: false, error: "Código deve conter apenas letras, números e hífen" };
  }

  return { isValid: true };
};

export const validateDiscountValue = (
  discountType: "percentage" | "fixed_amount",
  discountValue: number,
  maxDiscountAmount?: number
): { isValid: boolean; error?: string } => {
  if (discountValue <= 0) {
    return { isValid: false, error: "Valor do desconto deve ser maior que zero" };
  }

  if (discountType === "percentage") {
    if (discountValue > 100) {
      return { isValid: false, error: "Desconto percentual não pode ser maior que 100%" };
    }

    if (maxDiscountAmount && maxDiscountAmount <= 0) {
      return { isValid: false, error: "Valor máximo de desconto deve ser maior que zero" };
    }
  }

  return { isValid: true };
};

export const validateDateRange = (
  validFrom: number,
  validUntil: number
): { isValid: boolean; error?: string } => {
  const now = Date.now();

  if (validFrom >= validUntil) {
    return { isValid: false, error: "Data de início deve ser anterior à data de fim" };
  }

  if (validUntil <= now) {
    return { isValid: false, error: "Data de fim deve ser no futuro" };
  }

  // Não permitir período muito longo (ex: mais de 2 anos)
  const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;
  if (validUntil - validFrom > twoYearsInMs) {
    return { isValid: false, error: "Período de validade não pode ser maior que 2 anos" };
  }

  return { isValid: true };
};

export const validateUsageLimits = (
  usageLimit?: number,
  userUsageLimit?: number
): { isValid: boolean; error?: string } => {
  if (usageLimit && usageLimit <= 0) {
    return { isValid: false, error: "Limite de uso total deve ser maior que zero" };
  }

  if (userUsageLimit && userUsageLimit <= 0) {
    return { isValid: false, error: "Limite de uso por usuário deve ser maior que zero" };
  }

  if (usageLimit && userUsageLimit && userUsageLimit > usageLimit) {
    return { isValid: false, error: "Limite por usuário não pode ser maior que o limite total" };
  }

  return { isValid: true };
};

export const validateOrderValueLimits = (
  minimumOrderValue?: number,
  maximumOrderValue?: number
): { isValid: boolean; error?: string } => {
  if (minimumOrderValue && minimumOrderValue < 0) {
    return { isValid: false, error: "Valor mínimo do pedido não pode ser negativo" };
  }

  if (maximumOrderValue && maximumOrderValue <= 0) {
    return { isValid: false, error: "Valor máximo do pedido deve ser maior que zero" };
  }

  if (minimumOrderValue && maximumOrderValue && minimumOrderValue > maximumOrderValue) {
    return { isValid: false, error: "Valor mínimo não pode ser maior que o valor máximo" };
  }

  return { isValid: true };
};

// Validação completa de cupom
export const validateCouponData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validar código
  const codeValidation = validateCouponCode(data.code);
  if (!codeValidation.isValid) {
    errors.push(codeValidation.error!);
  }

  // Validar desconto
  const discountValidation = validateDiscountValue(
    data.discountType,
    data.discountValue,
    data.maxDiscountAmount
  );
  if (!discountValidation.isValid) {
    errors.push(discountValidation.error!);
  }

  // Validar datas
  const dateValidation = validateDateRange(data.validFrom, data.validUntil);
  if (!dateValidation.isValid) {
    errors.push(dateValidation.error!);
  }

  // Validar limites de uso
  const usageLimitsValidation = validateUsageLimits(data.usageLimit, data.userUsageLimit);
  if (!usageLimitsValidation.isValid) {
    errors.push(usageLimitsValidation.error!);
  }

  // Validar limites de valor do pedido
  const orderValueValidation = validateOrderValueLimits(
    data.minimumOrderValue,
    data.maximumOrderValue
  );
  if (!orderValueValidation.isValid) {
    errors.push(orderValueValidation.error!);
  }

  // Validar campos obrigatórios
  if (!data.name || data.name.trim().length === 0) {
    errors.push("Nome do cupom é obrigatório");
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push("Descrição do cupom é obrigatória");
  }

  // Validar aplicação (deve ter pelo menos um asset ou ser global)
  if (!data.globalApplication.isGlobal && (!data.applicableAssets || data.applicableAssets.length === 0)) {
    errors.push("Cupom deve ser global ou ter pelo menos um asset associado");
  }

  // Validar usuários permitidos para cupons privados
  if (data.type === "private" && (!data.allowedUsers || data.allowedUsers.length === 0)) {
    errors.push("Cupons privados devem ter pelo menos um usuário permitido");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};