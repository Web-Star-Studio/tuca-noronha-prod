// Utilitários para o sistema de cupons

export interface CouponDiscountCalculation {
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  discountPercentage: number;
  maxDiscountReached?: boolean;
}

export interface CouponValidationResult {
  isValid: boolean;
  reasons: string[];
  canUse: boolean;
  maxUsageReached?: boolean;
  userLimitReached?: boolean;
}

// Calcular desconto de cupom
export const calculateDiscount = (
  discountType: "percentage" | "fixed_amount",
  discountValue: number,
  orderAmount: number,
  maxDiscountAmount?: number
): CouponDiscountCalculation => {
  let discountAmount = 0;
  let maxDiscountReached = false;

  if (discountType === "percentage") {
    discountAmount = (orderAmount * discountValue) / 100;
    
    if (maxDiscountAmount && discountAmount > maxDiscountAmount) {
      discountAmount = maxDiscountAmount;
      maxDiscountReached = true;
    }
  } else {
    discountAmount = Math.min(discountValue, orderAmount);
  }

  const finalAmount = Math.max(0, orderAmount - discountAmount);
  const discountPercentage = orderAmount > 0 ? (discountAmount / orderAmount) * 100 : 0;

  return {
    originalAmount: orderAmount,
    discountAmount,
    finalAmount,
    discountPercentage,
    maxDiscountReached,
  };
};

// Gerar código único de cupom
export const generateCouponCode = (prefix?: string, length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  if (prefix) {
    result = prefix.toUpperCase() + '-';
    length = Math.max(4, length - prefix.length - 1);
  }
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// Verificar se cupom está no período de validade
export const isCouponValid = (validFrom: number, validUntil: number): boolean => {
  const now = Date.now();
  return validFrom <= now && validUntil >= now;
};

// Verificar se cupom está próximo do vencimento
export const isCouponExpiringSoon = (validUntil: number, daysThreshold: number = 3): boolean => {
  const now = Date.now();
  const thresholdTime = now + (daysThreshold * 24 * 60 * 60 * 1000);
  return validUntil <= thresholdTime && validUntil > now;
};

// Formatar data de validade para exibição
export const formatCouponDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Calcular taxa de uso do cupom
export const calculateUsageRate = (usageCount: number, usageLimit?: number): number => {
  if (!usageLimit) return 0;
  return Math.min(100, (usageCount / usageLimit) * 100);
};

// Verificar se asset é aplicável ao cupom
export const isAssetApplicable = (
  coupon: any,
  assetType: string,
  assetId: string
): boolean => {
  // Verificar aplicação global
  if (coupon.globalApplication.isGlobal) {
    return coupon.globalApplication.assetTypes.includes(assetType);
  }

  // Verificar assets específicos
  return coupon.applicableAssets.some((asset: any) => 
    asset.assetType === assetType &&
    asset.assetId === assetId &&
    asset.isActive
  );
};

// Obter status do cupom
export const getCouponStatus = (coupon: any): {
  status: 'active' | 'inactive' | 'expired' | 'used_up' | 'deleted';
  message: string;
} => {
  const now = Date.now();

  if (coupon.deletedAt) {
    return { status: 'deleted', message: 'Cupom removido' };
  }

  if (!coupon.isActive) {
    return { status: 'inactive', message: 'Cupom inativo' };
  }

  if (coupon.validUntil < now) {
    return { status: 'expired', message: 'Cupom expirado' };
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { status: 'used_up', message: 'Limite de uso atingido' };
  }

  return { status: 'active', message: 'Cupom ativo' };
};

// Validar regras de negócio do cupom
export const validateCouponRules = (
  coupon: any,
  orderValue: number,
  userId?: string,
  userUsageCount?: number
): CouponValidationResult => {
  const reasons: string[] = [];
  const status = getCouponStatus(coupon);

  if (status.status !== 'active') {
    reasons.push(status.message);
  }

  // Verificar valor mínimo do pedido
  if (coupon.minimumOrderValue && orderValue < coupon.minimumOrderValue) {
    reasons.push(`Valor mínimo do pedido: R$ ${coupon.minimumOrderValue.toFixed(2)}`);
  }

  // Verificar valor máximo do pedido
  if (coupon.maximumOrderValue && orderValue > coupon.maximumOrderValue) {
    reasons.push(`Valor máximo do pedido: R$ ${coupon.maximumOrderValue.toFixed(2)}`);
  }

  // Verificar limite de uso por usuário
  let userLimitReached = false;
  if (userId && coupon.userUsageLimit && userUsageCount !== undefined) {
    if (userUsageCount >= coupon.userUsageLimit) {
      reasons.push('Limite de uso por usuário atingido');
      userLimitReached = true;
    }
  }

  return {
    isValid: reasons.length === 0,
    reasons,
    canUse: reasons.length === 0,
    maxUsageReached: status.status === 'used_up',
    userLimitReached,
  };
};

// Classificar cupons por prioridade (melhor desconto primeiro)
export const prioritizeCoupons = (
  coupons: any[],
  orderValue: number
): any[] => {
  return coupons
    .map(coupon => {
      const discount = calculateDiscount(
        coupon.discountType,
        coupon.discountValue,
        orderValue,
        coupon.maxDiscountAmount
      );
      
      return {
        ...coupon,
        calculatedDiscount: discount,
        priority: discount.discountAmount,
      };
    })
    .sort((a, b) => b.priority - a.priority);
};

// Gerar descrição legível do cupom
export const generateCouponDescription = (coupon: any): string => {
  let description = '';

  if (coupon.discountType === 'percentage') {
    description = `${coupon.discountValue}% de desconto`;
    
    if (coupon.maxDiscountAmount) {
      description += ` (máximo R$ ${coupon.maxDiscountAmount.toFixed(2)})`;
    }
  } else {
    description = `R$ ${coupon.discountValue.toFixed(2)} de desconto`;
  }

  if (coupon.minimumOrderValue) {
    description += ` em pedidos acima de R$ ${coupon.minimumOrderValue.toFixed(2)}`;
  }

  return description;
};

// Calcular economia total do usuário com cupons
export const calculateUserSavings = (usages: any[]): {
  totalSavings: number;
  usageCount: number;
  averageSavings: number;
  lastUsed?: number;
} => {
  const validUsages = usages.filter(usage => usage.status === 'applied');
  const totalSavings = validUsages.reduce((sum, usage) => sum + usage.discountAmount, 0);
  const usageCount = validUsages.length;
  const averageSavings = usageCount > 0 ? totalSavings / usageCount : 0;
  const lastUsed = validUsages.length > 0 
    ? Math.max(...validUsages.map(usage => usage.appliedAt))
    : undefined;

  return {
    totalSavings,
    usageCount,
    averageSavings,
    lastUsed,
  };
};

// Verificar conflitos entre cupons (para stacking)
export const checkCouponConflicts = (coupons: any[]): {
  hasConflicts: boolean;
  conflicts: string[];
} => {
  const conflicts: string[] = [];

  // Verificar se há cupons não empilháveis
  const nonStackableCoupons = coupons.filter(coupon => !coupon.stackable);
  
  if (nonStackableCoupons.length > 1) {
    conflicts.push('Múltiplos cupons não empilháveis selecionados');
  }

  if (nonStackableCoupons.length > 0 && coupons.length > 1) {
    conflicts.push('Cupom selecionado não pode ser usado com outros cupons');
  }

  // Verificar cupons do mesmo tipo
  const privateTypes = ['first_purchase', 'returning_customer'];
  const typeGroups: Record<string, any[]> = {};
  
  coupons.forEach(coupon => {
    if (privateTypes.includes(coupon.type)) {
      if (!typeGroups[coupon.type]) {
        typeGroups[coupon.type] = [];
      }
      typeGroups[coupon.type].push(coupon);
    }
  });

  Object.entries(typeGroups).forEach(([type, groupCoupons]) => {
    if (groupCoupons.length > 1) {
      conflicts.push(`Múltiplos cupons do tipo "${type}" não são permitidos`);
    }
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
};

// Otimizar combinação de cupons empilháveis
export const optimizeCouponCombination = (
  availableCoupons: any[],
  orderValue: number
): {
  bestCombination: any[];
  totalDiscount: number;
  finalAmount: number;
  savings: number;
} => {
  const stackableCoupons = availableCoupons.filter(coupon => coupon.stackable);
  const nonStackableCoupons = availableCoupons.filter(coupon => !coupon.stackable);

  let bestCombination: any[] = [];
  let maxDiscount = 0;

  // Testar combinações de cupons empilháveis
  if (stackableCoupons.length > 0) {
    // Para simplicidade, apenas somar todos os cupons empilháveis válidos
    let combinedDiscount = 0;
    const validStackable: any[] = [];

    stackableCoupons.forEach(coupon => {
      const discount = calculateDiscount(
        coupon.discountType,
        coupon.discountValue,
        orderValue,
        coupon.maxDiscountAmount
      );

      combinedDiscount += discount.discountAmount;
      validStackable.push(coupon);
    });

    if (combinedDiscount > maxDiscount) {
      maxDiscount = combinedDiscount;
      bestCombination = validStackable;
    }
  }

  // Testar cupons únicos não empilháveis
  nonStackableCoupons.forEach(coupon => {
    const discount = calculateDiscount(
      coupon.discountType,
      coupon.discountValue,
      orderValue,
      coupon.maxDiscountAmount
    );

    if (discount.discountAmount > maxDiscount) {
      maxDiscount = discount.discountAmount;
      bestCombination = [coupon];
    }
  });

  const finalAmount = Math.max(0, orderValue - maxDiscount);

  return {
    bestCombination,
    totalDiscount: maxDiscount,
    finalAmount,
    savings: maxDiscount,
  };
};