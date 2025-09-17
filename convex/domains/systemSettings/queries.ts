import { query } from "../../_generated/server";
import { v } from "convex/values";
import { settingValidators } from "./types";

// Query para buscar uma configuração específica
export const getSetting = query({
  args: settingValidators.getSetting,
  returns: v.union(v.null(), v.any()),
  handler: async (ctx, { key }) => {
    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    return setting?.value || null;
  },
});

// Query para buscar configurações por categoria (apenas públicas por padrão)
export const getSettingsByCategory = query({
  args: {
    category: v.union(
      v.literal("communication"),
      v.literal("business"),
      v.literal("system"),
      v.literal("ui"),
      v.literal("integration"),
      v.literal("security")
    ),
    includePrivate: v.optional(v.boolean()),
  },
  returns: v.array(v.object({
    key: v.string(),
    value: v.any(),
    type: v.string(),
    category: v.string(),
    description: v.string(),
    isPublic: v.boolean(),
    lastModifiedAt: v.number(),
  })),
  handler: async (ctx, { category, includePrivate = false }) => {
    // Verificar se o usuário pode acessar configurações privadas
    if (includePrivate) {
      const user = await ctx.auth.getUserIdentity();
      if (!user) {
        throw new Error("Acesso negado: usuário não autenticado");
      }

      const currentUser = await ctx.db
        .query("users")
        .withIndex("clerkId", (q) => q.eq("clerkId", user.subject))
        .unique();

      if (!currentUser || currentUser.role !== "master") {
        throw new Error("Acesso negado: apenas administradores master podem acessar configurações privadas");
      }
    }

    const settings = await ctx.db
      .query("systemSettings")
      .withIndex("by_category", (q) => q.eq("category", category))
      .collect();

    return settings
      .filter(setting => includePrivate || setting.isPublic)
      .map(setting => ({
        key: setting.key,
        value: setting.value,
        type: setting.type,
        category: setting.category,
        description: setting.description,
        isPublic: setting.isPublic,
        lastModifiedAt: setting.lastModifiedAt,
      }));
  },
});

// Query para buscar todas as configurações públicas
export const getPublicSettings = query({
  args: {},
  returns: v.object({
    whatsapp: v.object({
      adminNumber: v.string(),
      businessName: v.string(),
    }),
    support: v.object({
      email: v.string(),
      phone: v.string(),
    }),
    business: v.object({
      companyName: v.string(),
      address: v.any(),
    }),
    ui: v.object({
      primaryColor: v.string(),
      footerText: v.string(),
    }),
  }),
  handler: async (ctx) => {
    const settings = await ctx.db
      .query("systemSettings")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    // Organizar as configurações em um objeto estruturado
    const result = {
      whatsapp: {
        adminNumber: "+5581979097547",
        businessName: "Tuca Noronha Turismo",
      },
      support: {
        email: "atendimentotucanoronha@gmail.com",
        phone: "+5581979097547",
      },
      business: {
        companyName: "Tuca Noronha Turismo",
        address: {
          street: "Rua das Flores",
          city: "Fernando de Noronha",
          state: "PE",
          zipCode: "53990-000",
        },
      },
      ui: {
        primaryColor: "#0066CC",
        footerText: "© 2025 Tuca Noronha Turismo. Todos os direitos reservados. Desenvolvido por Web Star Studio.",
      },
    };

    // Sobrescrever com valores do banco se existirem
    for (const setting of settings) {
      const keyParts = setting.key.split(".");
      if (keyParts.length === 2) {
        const [category, field] = keyParts;
        if (result[category as keyof typeof result]) {
          const camelCaseField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          (result[category as keyof typeof result] as any)[camelCaseField] = setting.value;
        }
      }
    }

    return result;
  },
});

// Query para administradores listarem todas as configurações
export const getAllSettings = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("systemSettings"),
    _creationTime: v.number(),
    key: v.string(),
    value: v.any(),
    type: v.string(),
    category: v.string(),
    description: v.string(),
    isPublic: v.boolean(),
    lastModifiedBy: v.id("users"),
    lastModifiedAt: v.number(),
    createdAt: v.number(),
  })),
  handler: async (ctx) => {
    // Verificar se o usuário é admin master
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Acesso negado: usuário não autenticado");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("clerkId", (q) => q.eq("clerkId", user.subject))
      .unique();

    if (!currentUser || currentUser.role !== "master") {
      throw new Error("Acesso negado: apenas administradores master podem listar todas as configurações");
    }

    return await ctx.db.query("systemSettings").collect();
  },
});

// Query para verificar se o modo de manutenção está ativo
export const isMaintenanceMode = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "system.maintenance_mode"))
      .unique();

    return setting?.value === true;
  },
});

// Query para buscar a taxa padrão de parceiros
export const getDefaultPartnerFee = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "defaultPartnerFeePercentage"))
      .unique();

    // Retorna o valor configurado ou 15% como padrão
    return setting?.value as number || 15;
  },
}); 