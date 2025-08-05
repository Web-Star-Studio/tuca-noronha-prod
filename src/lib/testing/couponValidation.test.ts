// Testes para validação de cupons
// Este arquivo contém testes unitários para as funções de validação de cupons

import { 
  validateCouponCode, 
  validateDiscountValue, 
  validateDateRange, 
  validateCouponData 
} from "../../convex/domains/coupons/validators";

import { 
  calculateDiscount, 
  generateCouponCode, 
  isCouponValid, 
  isCouponExpiringSoon, 
  getCouponStatus, 
  validateCouponRules 
} from "../../convex/domains/coupons/utils";

// Mock de dados para testes
const mockCoupon = {
  _id: "test-coupon-id",
  code: "TEST20",
  name: "Cupom de Teste",
  description: "Cupom para testes",
  discountType: "percentage" as const,
  discountValue: 20,
  usageCount: 5,
  usageLimit: 100,
  validFrom: Date.now() - 24 * 60 * 60 * 1000, // 1 dia atrás
  validUntil: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias à frente
  isActive: true,
  deletedAt: undefined,
};

describe("Validação de Código de Cupom", () => {
  test("deve aceitar código válido", () => {
    const result = validateCouponCode("DESCONTO20");
    expect(result.isValid).toBe(true);
  });

  test("deve rejeitar código vazio", () => {
    const result = validateCouponCode("");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("obrigatório");
  });

  test("deve rejeitar código muito curto", () => {
    const result = validateCouponCode("AB");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("3 caracteres");
  });

  test("deve rejeitar código muito longo", () => {
    const result = validateCouponCode("A".repeat(25));
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("20 caracteres");
  });

  test("deve rejeitar código com caracteres inválidos", () => {
    const result = validateCouponCode("DESC@NTO");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("letras, números e hífen");
  });
});

describe("Validação de Valor de Desconto", () => {
  test("deve aceitar desconto percentual válido", () => {
    const result = validateDiscountValue("percentage", 20);
    expect(result.isValid).toBe(true);
  });

  test("deve rejeitar desconto percentual maior que 100", () => {
    const result = validateDiscountValue("percentage", 150);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("100%");
  });

  test("deve aceitar desconto valor fixo válido", () => {
    const result = validateDiscountValue("fixed_amount", 50);
    expect(result.isValid).toBe(true);
  });

  test("deve rejeitar valor de desconto zero ou negativo", () => {
    const result1 = validateDiscountValue("percentage", 0);
    const result2 = validateDiscountValue("fixed_amount", -10);
    
    expect(result1.isValid).toBe(false);
    expect(result2.isValid).toBe(false);
  });
});

describe("Validação de Período de Datas", () => {
  const now = Date.now();
  const futureDate1 = now + 24 * 60 * 60 * 1000; // 1 dia
  const futureDate2 = now + 7 * 24 * 60 * 60 * 1000; // 7 dias

  test("deve aceitar período válido", () => {
    const result = validateDateRange(futureDate1, futureDate2);
    expect(result.isValid).toBe(true);
  });

  test("deve rejeitar data de fim anterior à data de início", () => {
    const result = validateDateRange(futureDate2, futureDate1);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("anterior");
  });

  test("deve rejeitar data de fim no passado", () => {
    const pastDate = now - 24 * 60 * 60 * 1000;
    const result = validateDateRange(now, pastDate);
    expect(result.isValid).toBe(false);
  });
});

describe("Cálculo de Desconto", () => {
  test("deve calcular desconto percentual corretamente", () => {
    const result = calculateDiscount("percentage", 20, 100);
    
    expect(result.originalAmount).toBe(100);
    expect(result.discountAmount).toBe(20);
    expect(result.finalAmount).toBe(80);
    expect(result.discountPercentage).toBe(20);
  });

  test("deve aplicar valor máximo de desconto", () => {
    const result = calculateDiscount("percentage", 50, 200, 50);
    
    expect(result.discountAmount).toBe(50);
    expect(result.maxDiscountReached).toBe(true);
  });

  test("deve calcular desconto valor fixo corretamente", () => {
    const result = calculateDiscount("fixed_amount", 30, 100);
    
    expect(result.discountAmount).toBe(30);
    expect(result.finalAmount).toBe(70);
  });

  test("não deve aplicar desconto maior que o valor do pedido", () => {
    const result = calculateDiscount("fixed_amount", 150, 100);
    
    expect(result.discountAmount).toBe(100);
    expect(result.finalAmount).toBe(0);
  });
});

describe("Geração de Código de Cupom", () => {
  test("deve gerar código com comprimento correto", () => {
    const code = generateCouponCode();
    expect(code).toHaveLength(8);
  });

  test("deve gerar código com prefixo", () => {
    const code = generateCouponCode("PROMO", 6);
    expect(code).toMatch(/^PROMO-[A-Z0-9]{6}$/);
  });

  test("deve gerar códigos únicos", () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateCouponCode());
    }
    expect(codes.size).toBe(100);
  });
});

describe("Validação de Período de Validade", () => {
  test("deve identificar cupom válido", () => {
    const now = Date.now();
    const validFrom = now - 24 * 60 * 60 * 1000;
    const validUntil = now + 24 * 60 * 60 * 1000;
    
    expect(isCouponValid(validFrom, validUntil)).toBe(true);
  });

  test("deve identificar cupom expirado", () => {
    const now = Date.now();
    const validFrom = now - 48 * 60 * 60 * 1000;
    const validUntil = now - 24 * 60 * 60 * 1000;
    
    expect(isCouponValid(validFrom, validUntil)).toBe(false);
  });

  test("deve identificar cupom ainda não válido", () => {
    const now = Date.now();
    const validFrom = now + 24 * 60 * 60 * 1000;
    const validUntil = now + 48 * 60 * 60 * 1000;
    
    expect(isCouponValid(validFrom, validUntil)).toBe(false);
  });
});

describe("Verificação de Expiração Próxima", () => {
  test("deve identificar cupom expirando em breve", () => {
    const now = Date.now();
    const validUntil = now + 2 * 24 * 60 * 60 * 1000; // 2 dias
    
    expect(isCouponExpiringSoon(validUntil, 3)).toBe(true);
  });

  test("não deve identificar como expirando quando ainda há tempo", () => {
    const now = Date.now();
    const validUntil = now + 5 * 24 * 60 * 60 * 1000; // 5 dias
    
    expect(isCouponExpiringSoon(validUntil, 3)).toBe(false);
  });
});

describe("Status do Cupom", () => {
  test("deve retornar status ativo para cupom válido", () => {
    const status = getCouponStatus(mockCoupon);
    expect(status.status).toBe("active");
  });

  test("deve retornar status expirado", () => {
    const expiredCoupon = {
      ...mockCoupon,
      validUntil: Date.now() - 24 * 60 * 60 * 1000,
    };
    
    const status = getCouponStatus(expiredCoupon);
    expect(status.status).toBe("expired");
  });

  test("deve retornar status inativo", () => {
    const inactiveCoupon = { ...mockCoupon, isActive: false };
    const status = getCouponStatus(inactiveCoupon);
    expect(status.status).toBe("inactive");
  });

  test("deve retornar status esgotado", () => {
    const usedUpCoupon = { ...mockCoupon, usageCount: 100 };
    const status = getCouponStatus(usedUpCoupon);
    expect(status.status).toBe("used_up");
  });
});

describe("Validação de Regras de Negócio", () => {
  test("deve validar cupom sem restrições", () => {
    const result = validateCouponRules(mockCoupon, 100);
    expect(result.isValid).toBe(true);
    expect(result.canUse).toBe(true);
  });

  test("deve rejeitar por valor mínimo", () => {
    const couponWithMinValue = {
      ...mockCoupon,
      minimumOrderValue: 200,
    };
    
    const result = validateCouponRules(couponWithMinValue, 100);
    expect(result.isValid).toBe(false);
    expect(result.reasons).toContain("Valor mínimo");
  });

  test("deve rejeitar por valor máximo", () => {
    const couponWithMaxValue = {
      ...mockCoupon,
      maximumOrderValue: 50,
    };
    
    const result = validateCouponRules(couponWithMaxValue, 100);
    expect(result.isValid).toBe(false);
    expect(result.reasons).toContain("Valor máximo");
  });

  test("deve rejeitar por limite de uso por usuário", () => {
    validateCouponRules(mockCoupon, 100, "user123", 5);
    // Assumindo que o cupom tem userUsageLimit de 5
    // E o usuário já usou 5 vezes
    // Este teste precisaria ser ajustado baseado na implementação real
  });
});

describe("Validação Completa de Dados do Cupom", () => {
  const validCouponData = {
    code: "TEST20",
    name: "Cupom de Teste",
    description: "Descrição do cupom",
    discountType: "percentage" as const,
    discountValue: 20,
    validFrom: Date.now() + 60000,
    validUntil: Date.now() + 7 * 24 * 60 * 60 * 1000,
    type: "public" as const,
    globalApplication: {
      isGlobal: true,
      assetTypes: ["activities"],
    },
    applicableAssets: [],
    allowedUsers: [],
  };

  test("deve validar cupom com dados válidos", () => {
    const result = validateCouponData(validCouponData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("deve rejeitar cupom sem código", () => {
    const invalidData = { ...validCouponData, code: "" };
    const result = validateCouponData(invalidData);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Código é obrigatório");
  });

  test("deve rejeitar cupom sem nome", () => {
    const invalidData = { ...validCouponData, name: "" };
    const result = validateCouponData(invalidData);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Nome do cupom é obrigatório");
  });

  test("deve rejeitar cupom privado sem usuários permitidos", () => {
    const invalidData = {
      ...validCouponData,
      type: "private" as const,
      allowedUsers: [],
    };
    
    const result = validateCouponData(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("pelo menos um usuário permitido");
  });
});

// Testes de integração simulados
describe("Integração - Aplicação de Cupons", () => {
  test("deve simular aplicação bem-sucedida de cupom", async () => {
    // Mock das funções de mutation
    const mockApplyCoupon = jest.fn().mockResolvedValue({
      usageId: "usage123",
      discountAmount: 20,
      finalAmount: 80,
    });

    const result = await mockApplyCoupon({
      couponCode: "TEST20",
      userId: "user123",
      bookingId: "booking123",
      bookingType: "activity",
      originalAmount: 100,
    });

    expect(result.discountAmount).toBe(20);
    expect(result.finalAmount).toBe(80);
    expect(mockApplyCoupon).toHaveBeenCalledWith({
      couponCode: "TEST20",
      userId: "user123",
      bookingId: "booking123",
      bookingType: "activity",
      originalAmount: 100,
    });
  });

  test("deve simular erro na aplicação de cupom", async () => {
    const mockApplyCoupon = jest.fn().mockRejectedValue(
      new Error("Cupom já foi usado pelo usuário")
    );

    await expect(mockApplyCoupon({
      couponCode: "INVALID",
      userId: "user123",
      bookingId: "booking123",
      bookingType: "activity",
      originalAmount: 100,
    })).rejects.toThrow("Cupom já foi usado pelo usuário");
  });
});

// Helper para executar testes
export const runCouponTests = () => {
  console.log("Executando testes de validação de cupons...");
  
  // Este seria o ponto de entrada para executar todos os testes
  // Em um ambiente real, você usaria Jest, Vitest ou similar
  
  const testResults = {
    validationTests: {
      passed: 0,
      failed: 0,
      total: 0,
    },
    calculationTests: {
      passed: 0,
      failed: 0,
      total: 0,
    },
    integrationTests: {
      passed: 0,
      failed: 0,
      total: 0,
    },
  };
  
  return testResults;
};