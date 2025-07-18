import { mutation, internalMutation } from "../../_generated/server";
import { v } from "convex/values";
import { settingValidators, DEFAULT_SETTINGS } from "./types";

// Mutation para atualizar uma configuração existente
export const updateSetting = mutation({
  args: settingValidators.updateSetting,
  returns: v.null(),
  handler: async (ctx, { key, value, type }) => {
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
      throw new Error("Acesso negado: apenas administradores master podem atualizar configurações");
    }

    // Buscar a configuração existente
    const existingSetting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (!existingSetting) {
      throw new Error(`Configuração '${key}' não encontrada`);
    }

    // Atualizar a configuração
    await ctx.db.patch(existingSetting._id, {
      value,
      type,
      lastModifiedBy: currentUser._id,
      lastModifiedAt: Date.now(),
    });

    // Log da alteração
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUser._id,
        role: currentUser.role,
        name: currentUser.name || "Usuário",
        email: currentUser.email,
      },
      event: {
        type: "system_config_change",
        action: `Configuração '${key}' atualizada`,
        category: "system_admin",
        severity: "medium",
      },
      resource: {
        type: "systemSettings",
        id: existingSetting._id,
        name: key,
      },
      source: {
        ipAddress: "0.0.0.0", // TODO: Capturar IP real
        platform: "web",
      },
      status: "success",
      metadata: {
        before: existingSetting.value,
        after: value,
        reason: "Configuração atualizada pelo administrador",
      },
      timestamp: Date.now(),
    });

    return null;
  },
});

// Mutation para atualizar ou criar uma configuração (upsert)
export const upsertSetting = mutation({
  args: settingValidators.updateSetting,
  returns: v.null(),
  handler: async (ctx, { key, value, type }) => {
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
      throw new Error("Acesso negado: apenas administradores master podem atualizar configurações");
    }

    // Buscar a configuração existente
    const existingSetting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    const now = Date.now();
    let settingId;
    let isUpdate = false;

    if (existingSetting) {
      // Atualizar configuração existente
      await ctx.db.patch(existingSetting._id, {
        value,
        type,
        lastModifiedBy: currentUser._id,
        lastModifiedAt: now,
      });
      settingId = existingSetting._id;
      isUpdate = true;
    } else {
      // Criar nova configuração usando valores padrão se disponível
      const defaultSetting = DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS];
      
      settingId = await ctx.db.insert("systemSettings", {
        key,
        value,
        type,
        category: defaultSetting?.category || "system",
        description: defaultSetting?.description || `Configuração ${key}`,
        isPublic: defaultSetting?.isPublic ?? true,
        lastModifiedBy: currentUser._id,
        lastModifiedAt: now,
        createdAt: now,
      });
      isUpdate = false;
    }

    // Log da alteração
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUser._id,
        role: currentUser.role,
        name: currentUser.name || "Usuário",
        email: currentUser.email,
      },
      event: {
        type: "system_config_change",
        action: isUpdate 
          ? `Configuração '${key}' atualizada`
          : `Configuração '${key}' criada`,
        category: "system_admin",
        severity: "medium",
      },
      resource: {
        type: "systemSettings",
        id: settingId,
        name: key,
      },
      source: {
        ipAddress: "0.0.0.0", // TODO: Capturar IP real
        platform: "web",
      },
      status: "success",
      metadata: {
        before: existingSetting?.value,
        after: value,
        reason: isUpdate 
          ? "Configuração atualizada pelo administrador"
          : "Configuração criada pelo administrador",
      },
      timestamp: now,
    });

    return null;
  },
});

// Mutation para criar uma nova configuração
export const createSetting = mutation({
  args: settingValidators.createSetting,
  returns: v.id("systemSettings"),
  handler: async (ctx, { key, value, type, category, description, isPublic }) => {
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
      throw new Error("Acesso negado: apenas administradores master podem criar configurações");
    }

    // Verificar se a configuração já existe
    const existingSetting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (existingSetting) {
      throw new Error(`Configuração '${key}' já existe`);
    }

    // Criar a nova configuração
    const settingId = await ctx.db.insert("systemSettings", {
      key,
      value,
      type,
      category,
      description,
      isPublic,
      lastModifiedBy: currentUser._id,
      lastModifiedAt: Date.now(),
      createdAt: Date.now(),
    });

    // Log da criação
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUser._id,
        role: currentUser.role,
        name: currentUser.name || "Usuário",
        email: currentUser.email,
      },
      event: {
        type: "system_config_change",
        action: `Nova configuração '${key}' criada`,
        category: "system_admin",
        severity: "medium",
      },
      resource: {
        type: "systemSettings",
        id: settingId,
        name: key,
      },
      source: {
        ipAddress: "0.0.0.0", // TODO: Capturar IP real
        platform: "web",
      },
      status: "success",
      metadata: {
        after: value,
        reason: "Nova configuração criada pelo administrador",
      },
      timestamp: Date.now(),
    });

    return settingId;
  },
});

// Mutation para deletar uma configuração
export const deleteSetting = mutation({
  args: { key: v.string() },
  returns: v.null(),
  handler: async (ctx, { key }) => {
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
      throw new Error("Acesso negado: apenas administradores master podem deletar configurações");
    }

    // Buscar a configuração
    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (!setting) {
      throw new Error(`Configuração '${key}' não encontrada`);
    }

    // Verificar se é uma configuração crítica do sistema
    if (key.startsWith("system.") || key.startsWith("security.")) {
      throw new Error("Configurações críticas do sistema não podem ser deletadas");
    }

    // Deletar a configuração
    await ctx.db.delete(setting._id);

    // Log da exclusão
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUser._id,
        role: currentUser.role,
        name: currentUser.name || "Usuário",
        email: currentUser.email,
      },
      event: {
        type: "system_config_change",
        action: `Configuração '${key}' deletada`,
        category: "system_admin",
        severity: "high",
      },
      resource: {
        type: "systemSettings",
        id: setting._id,
        name: key,
      },
      source: {
        ipAddress: "0.0.0.0", // TODO: Capturar IP real
        platform: "web",
      },
      status: "success",
      metadata: {
        before: setting.value,
        reason: "Configuração deletada pelo administrador",
      },
      timestamp: Date.now(),
    });

    return null;
  },
});

// Mutation para inicializar configurações padrão (executar apenas uma vez)
export const initializeDefaultSettings = mutation({
  args: {},
  returns: v.null(),
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
      throw new Error("Acesso negado: apenas administradores master podem inicializar configurações");
    }

    // Verificar se já existem configurações
    const existingSettings = await ctx.db.query("systemSettings").take(1);
    if (existingSettings.length > 0) {
      throw new Error("Configurações já foram inicializadas");
    }

    // Criar todas as configurações padrão
    const now = Date.now();
    for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
      await ctx.db.insert("systemSettings", {
        key,
        value: config.value,
        type: config.type,
        category: config.category,
        description: config.description,
        isPublic: config.isPublic,
        lastModifiedBy: currentUser._id,
        lastModifiedAt: now,
        createdAt: now,
      });
    }

    // Log da inicialização
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUser._id,
        role: currentUser.role,
        name: currentUser.name || "Usuário",
        email: currentUser.email,
      },
      event: {
        type: "system_config_change",
        action: "Configurações padrão inicializadas",
        category: "system_admin",
        severity: "high",
      },
      source: {
        ipAddress: "0.0.0.0", // TODO: Capturar IP real
        platform: "web",
      },
      status: "success",
      metadata: {
        reason: "Inicialização das configurações padrão do sistema",
        quantity: Object.keys(DEFAULT_SETTINGS).length,
      },
      timestamp: now,
    });

    return null;
  },
});

// Mutation para alternar modo de manutenção
export const toggleMaintenanceMode = mutation({
  args: { enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { enabled }) => {
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
      throw new Error("Acesso negado: apenas administradores master podem alternar o modo de manutenção");
    }

    // Buscar configuração do modo de manutenção
    const setting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "system.maintenance_mode"))
      .unique();

    if (setting) {
      // Atualizar configuração existente
      await ctx.db.patch(setting._id, {
        value: enabled,
        lastModifiedBy: currentUser._id,
        lastModifiedAt: Date.now(),
      });
    } else {
      // Criar configuração se não existir
      await ctx.db.insert("systemSettings", {
        key: "system.maintenance_mode",
        value: enabled,
        type: "boolean",
        category: "system",
        description: "Modo de manutenção ativo",
        isPublic: true,
        lastModifiedBy: currentUser._id,
        lastModifiedAt: Date.now(),
        createdAt: Date.now(),
      });
    }

    // Log da alteração
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUser._id,
        role: currentUser.role,
        name: currentUser.name || "Usuário",
        email: currentUser.email,
      },
      event: {
        type: "system_config_change",
        action: `Modo de manutenção ${enabled ? "ativado" : "desativado"}`,
        category: "system_admin",
        severity: "critical",
      },
      source: {
        ipAddress: "0.0.0.0", // TODO: Capturar IP real
        platform: "web",
      },
      status: "success",
      metadata: {
        before: setting?.value,
        after: enabled,
        reason: `Modo de manutenção ${enabled ? "ativado" : "desativado"} pelo administrador`,
      },
      timestamp: Date.now(),
    });

    return null;
  },
});

// Mutation para inicializar configurações específicas que estão faltando
export const initializeMissingSettings = mutation({
  args: {},
  returns: v.null(),
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
      throw new Error("Acesso negado: apenas administradores master podem inicializar configurações");
    }

    // Verificar quais configurações padrão estão faltando
    const now = Date.now();
    let createdCount = 0;

    for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
      const existingSetting = await ctx.db
        .query("systemSettings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();

      if (!existingSetting) {
        await ctx.db.insert("systemSettings", {
          key,
          value: config.value,
          type: config.type,
          category: config.category,
          description: config.description,
          isPublic: config.isPublic,
          lastModifiedBy: currentUser._id,
          lastModifiedAt: now,
          createdAt: now,
        });
        createdCount++;
      }
    }

    if (createdCount > 0) {
      // Log da inicialização
      await ctx.db.insert("auditLogs", {
        actor: {
          userId: currentUser._id,
          role: currentUser.role,
          name: currentUser.name || "Usuário",
          email: currentUser.email,
        },
        event: {
          type: "system_config_change",
          action: `${createdCount} configurações faltantes inicializadas`,
          category: "system_admin",
          severity: "medium",
        },
        source: {
          ipAddress: "0.0.0.0", // TODO: Capturar IP real
          platform: "web",
        },
        status: "success",
        metadata: {
          reason: "Inicialização de configurações faltantes",
          quantity: createdCount,
        },
        timestamp: now,
      });
    }

    return null;
  },
}); 

// Mutation específica para configurar a taxa padrão de parceiros
export const updateDefaultPartnerFee = mutation({
  args: {
    feePercentage: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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
      throw new Error("Acesso negado: apenas administradores master podem atualizar a taxa padrão");
    }

    // Validar a porcentagem
    if (args.feePercentage < 0 || args.feePercentage > 100) {
      throw new Error("A taxa deve estar entre 0% e 100%");
    }

    // Buscar a configuração existente
    const existingSetting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", "defaultPartnerFeePercentage"))
      .unique();

    if (existingSetting) {
      // Atualizar configuração existente
      await ctx.db.patch(existingSetting._id, {
        value: args.feePercentage,
        type: "number",
        lastModifiedBy: currentUser._id,
        lastModifiedAt: Date.now(),
      });
    } else {
      // Criar nova configuração
      await ctx.db.insert("systemSettings", {
        key: "defaultPartnerFeePercentage",
        value: args.feePercentage,
        type: "number",
        category: "business",
        description: "Taxa padrão aplicada a novos parceiros da plataforma",
        isPublic: false,
        createdAt: Date.now(),
        lastModifiedBy: currentUser._id,
        lastModifiedAt: Date.now(),
      });
    }

    // Log da alteração
    await ctx.db.insert("auditLogs", {
      actor: {
        userId: currentUser._id,
        role: currentUser.role,
        name: currentUser.name || "Usuário",
        email: currentUser.email,
      },
      event: {
        type: "system_config_change",
        action: `Taxa padrão de parceiros ${existingSetting ? "atualizada" : "configurada"} para ${args.feePercentage}%`,
        category: "system_admin",
        severity: "medium",
      },
      resource: {
        type: "systemSettings",
        id: existingSetting?._id || "defaultPartnerFeePercentage",
        name: "Taxa Padrão de Parceiros",
      },
      source: {
        ipAddress: "127.0.0.1", // TODO: Obter IP real do request
        platform: "web",
      },
      status: "success",
      metadata: {
        before: existingSetting?.value,
        after: args.feePercentage,
        reason: `Taxa padrão ${existingSetting ? "alterada" : "definida"} via interface administrativa`,
      },
      timestamp: Date.now(),
    });

    return null;
  },
}); 

// Mutation interna para atualizar configurações (sem autenticação - para setup inicial)
export const internalUpdateSetting = internalMutation({
  args: {
    key: v.string(),
    value: v.any(),
    type: v.union(
      v.literal("string"),
      v.literal("number"),
      v.literal("boolean"),
      v.literal("object"),
      v.literal("array")
    ),
  },
  returns: v.null(),
  handler: async (ctx, { key, value, type }) => {
    console.log(`🔄 Atualizando configuração interna: ${key} = ${value}`);
    
    // Buscar a configuração existente
    const existingSetting = await ctx.db
      .query("systemSettings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    const now = Date.now();
    
    if (existingSetting) {
      // Atualizar configuração existente
      await ctx.db.patch(existingSetting._id, {
        value,
        type,
        lastModifiedAt: now,
      });
      console.log(`✅ Configuração '${key}' atualizada`);
    } else {
      // Criar nova configuração usando valores padrão se disponível
      const defaultSetting = DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS];
      
      // Buscar um usuário master como fallback para lastModifiedBy
      const masterUser = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "master"))
        .first();
      
      await ctx.db.insert("systemSettings", {
        key,
        value,
        type,
        category: defaultSetting?.category || "system",
        description: defaultSetting?.description || `Configuração ${key}`,
        isPublic: defaultSetting?.isPublic ?? true,
        lastModifiedBy: masterUser?._id || "system" as any,
        lastModifiedAt: now,
        createdAt: now,
      });
      console.log(`✅ Configuração '${key}' criada`);
    }

    return null;
  },
}); 