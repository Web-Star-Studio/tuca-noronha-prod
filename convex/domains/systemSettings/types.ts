import { v } from "convex/values";

// Tipos das configurações
export type SettingType = "string" | "number" | "boolean" | "object" | "array";
export type SettingCategory = "communication" | "business" | "system" | "ui" | "integration" | "security";

// Interface para uma configuração
export interface SystemSetting {
  key: string;
  value: any;
  type: SettingType;
  category: SettingCategory;
  description: string;
  isPublic: boolean;
  lastModifiedBy: string;
  lastModifiedAt: number;
  createdAt: number;
}

// Configurações padrão do sistema
export const DEFAULT_SETTINGS = {
  // Comunicação
  "whatsapp.admin_number": {
    value: "+5581979097547",
    type: "string" as const,
    category: "communication" as const,
    description: "Número do WhatsApp do administrador master para contato direto",
    isPublic: true,
  },
  "whatsapp.business_name": {
    value: "Tuca Noronha Turismo",
    type: "string" as const,
    category: "communication" as const,
    description: "Nome do negócio para mensagens de WhatsApp",
    isPublic: true,
  },
  "support.email": {
    value: "atendimentotucanoronha@gmail.com",
    type: "string" as const,
    category: "communication" as const,
    description: "Email de suporte principal",
    isPublic: true,
  },
  "support.phone": {
    value: "+558197909754",
    type: "string" as const,
    category: "communication" as const,
    description: "Telefone de suporte principal",
    isPublic: true,
  },

  // Negócio
  "business.company_name": {
    value: "Tuca Noronha Turismo",
    type: "string" as const,
    category: "business" as const,
    description: "Nome da empresa",
    isPublic: true,
  },
  "business.cnpj": {
    value: "00.000.000/0000-00",
    type: "string" as const,
    category: "business" as const,
    description: "CNPJ da empresa",
    isPublic: false,
  },
  "business.address": {
    value: {
      street: "Rua das Flores",
      city: "Fernando de Noronha",
      state: "PE",
      zipCode: "53990-000",
    },
    type: "object" as const,
    category: "business" as const,
    description: "Endereço da empresa",
    isPublic: true,
  },

  // Sistema
  "system.maintenance_mode": {
    value: false,
    type: "boolean" as const,
    category: "system" as const,
    description: "Modo de manutenção ativo",
    isPublic: true,
  },
  "system.max_booking_days_advance": {
    value: 365,
    type: "number" as const,
    category: "system" as const,
    description: "Máximo de dias para reserva antecipada",
    isPublic: true,
  },

  // Interface
  "ui.primary_color": {
    value: "#0066CC",
    type: "string" as const,
    category: "ui" as const,
    description: "Cor primária da interface",
    isPublic: true,
  },
  "ui.footer_text": {
    value: "© 2025 Tuca Noronha Turismo. Todos os direitos reservados.",
    type: "string" as const,
    category: "ui" as const,
    description: "Texto do rodapé",
    isPublic: true,
  },
} as const;

// Validators para os argumentos das mutations
export const settingValidators = {
  updateSetting: v.object({
    key: v.string(),
    value: v.any(),
    type: v.union(
      v.literal("string"),
      v.literal("number"),
      v.literal("boolean"),
      v.literal("object"),
      v.literal("array")
    ),
  }),
  
  createSetting: v.object({
    key: v.string(),
    value: v.any(),
    type: v.union(
      v.literal("string"),
      v.literal("number"),
      v.literal("boolean"),
      v.literal("object"),
      v.literal("array")
    ),
    category: v.union(
      v.literal("communication"),
      v.literal("business"),
      v.literal("system"),
      v.literal("ui"),
      v.literal("integration"),
      v.literal("security")
    ),
    description: v.string(),
    isPublic: v.boolean(),
  }),

  getSetting: v.object({
    key: v.string(),
  }),

  getSettingsByCategory: v.object({
    category: v.union(
      v.literal("communication"),
      v.literal("business"),
      v.literal("system"),
      v.literal("ui"),
      v.literal("integration"),
      v.literal("security")
    ),
  }),
}; 