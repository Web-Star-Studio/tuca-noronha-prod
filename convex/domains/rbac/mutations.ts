import { v } from "convex/values";
import { mutation, internalMutation } from "../../_generated/server";
import { mutationWithRole } from "./mutation";
import { getCurrentUserRole, getCurrentUserConvexId, verifyPartnerAccess } from "../rbac";
import type { Id } from "../../_generated/dataModel";
import { internal, api } from "../../_generated/api";
import { v4 as uuidv4 } from "uuid";

/**
 * Concede permissão a um employee para acessar um asset específico
 * Apenas partners (donos do asset) e masters podem conceder permissões
 */
export const grantAssetPermission = mutationWithRole(["partner", "master"])({
  args: {
    // Employee que receberá a permissão
    employeeId: v.id("users"),
    // ID do asset (evento, restaurante, etc)
    assetId: v.string(),
    // Tipo de asset (events, restaurants, etc)
    assetType: v.string(),
    // Permissões (view, edit, manage)
    permissions: v.array(v.string()),
    // Nota opcional sobre a permissão
    note: v.optional(v.string()),
  },
  returns: v.id("assetPermissions"),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }
    
    // Verificar se o employee existe e tem papel de employee
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Employee não encontrado");
    }
    
    if (employee.role !== "employee") {
      throw new Error("O usuário selecionado não é um employee");
    }
    
    // Se for partner, verificar se o asset pertence a ele
    if (currentUserRole === "partner") {
      let isOwner = false;
      
      // Verifica o owner do asset dependendo do tipo
      if (args.assetType === "events") {
        const event = await ctx.db.get(args.assetId as Id<"events">);
        isOwner = event ? event.partnerId.toString() === currentUserId.toString() : false;
      } 
      else if (args.assetType === "restaurants") {
        const restaurant = await ctx.db.get(args.assetId as Id<"restaurants">);
        isOwner = restaurant ? restaurant.partnerId.toString() === currentUserId.toString() : false;
      }
      else if (args.assetType === "activities") {
        const activity = await ctx.db.get(args.assetId as Id<"activities">);
        isOwner = activity ? activity.partnerId.toString() === currentUserId.toString() : false;
      }
      else if (args.assetType === "vehicles") {
        const vehicle = await ctx.db.get(args.assetId as Id<"vehicles">);
        isOwner = vehicle ? vehicle.ownerId && vehicle.ownerId.toString() === currentUserId.toString() : false;
      }

      // Adicionar outros tipos de asset conforme necessário
      
      if (!isOwner) {
        throw new Error("Você não tem permissão para compartilhar esse asset");
      }
    }
    
    // Verifica se já existe uma permissão para este employee e asset
    const existingPermissions = await ctx.db
      .query("assetPermissions")
      .withIndex("by_employee_asset_type", (q) => 
        q.eq("employeeId", args.employeeId).eq("assetType", args.assetType)
      )
      .filter((q) => q.eq(q.field("assetId"), args.assetId))
      .collect();
    
    // Se já existe, atualiza as permissões
    if (existingPermissions.length > 0) {
      await ctx.db.patch(existingPermissions[0]._id, {
        permissions: args.permissions,
        note: args.note,
      });
      return existingPermissions[0]._id;
    }
    
    // Caso contrário, cria uma nova permissão
    return await ctx.db.insert("assetPermissions", {
      employeeId: args.employeeId,
      partnerId: currentUserId,
      grantedBy: currentUserId, // Keep for backwards compatibility
      assetId: args.assetId,
      assetType: args.assetType,
      permissions: args.permissions,
      grantedAt: Date.now(),
      note: args.note,
    });
  },
});

/**
 * Remove a permissão de um employee para um asset específico
 * Apenas partners (donos do asset) e masters podem remover permissões
 */
export const revokeAssetPermission = mutationWithRole(["partner", "master"])({
  args: {
    // ID da permissão a ser removida
    permissionId: v.id("assetPermissions"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }
    
    // Busca a permissão
    const permission = await ctx.db.get(args.permissionId);
    if (!permission) {
      throw new Error("Permissão não encontrada");
    }
    
    // Se for partner, verificar se é o dono do asset
    if (currentUserRole === "partner" && permission.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Você não tem permissão para remover esta permissão");
    }
    
    // Remove a permissão
    await ctx.db.delete(args.permissionId);
    return true;
  },
});

/**
 * Versão simplificada de criação de employee que automaticamente concede
 * permissões básicas para evitar problemas de acesso ao dashboard
 */
export const createEmployeeWithDefaultPermissions = mutationWithRole(["partner", "master"])({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    organizationId: v.optional(v.id("partnerOrganizations")), // Organização opcional para conceder permissão automaticamente
  },
  returns: v.object({
    employeeId: v.id("users"),
    permissionGranted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    if (!currentUserId) throw new Error("Usuário não autenticado");

    // Primeiro, cria ou obtém o employee usando a função existente
    const employeeId = await ctx.runMutation(api.domains.rbac.mutations.createEmployee, {
      name: args.name,
      email: args.email,
      image: args.image,
    });

    let permissionGranted = false;

    // Se uma organização foi especificada, concede permissão automaticamente
    if (args.organizationId) {
      // Verifica se o usuário atual tem acesso à organização
      const organization = await ctx.db.get(args.organizationId);
      if (organization) {
        // Partners só podem conceder permissões para suas próprias organizações
        if (currentUserRole === "master" || organization.partnerId.toString() === currentUserId.toString()) {
          try {
            await ctx.runMutation(api.domains.rbac.mutations.grantOrganizationPermission, {
              employeeId,
              organizationId: args.organizationId,
              permissions: ["view"],
              note: "Permissão básica concedida automaticamente durante criação"
            });
            permissionGranted = true;
          } catch (error) {
            console.error("Erro ao conceder permissão automática:", error);
          }
        }
      }
    } else {
      // Se nenhuma organização foi especificada, tenta conceder para a primeira organização do partner
      if (currentUserRole === "partner") {
        const partnerOrganizations = await ctx.db
          .query("partnerOrganizations")
          .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .take(1);

        if (partnerOrganizations.length > 0) {
          try {
            await ctx.runMutation(api.domains.rbac.mutations.grantOrganizationPermission, {
              employeeId,
              organizationId: partnerOrganizations[0]._id,
              permissions: ["view"],
              note: "Permissão básica concedida automaticamente para primeira organização do partner"
            });
            permissionGranted = true;
          } catch (error) {
            console.error("Erro ao conceder permissão automática para primeira organização:", error);
          }
        }
      }
    }

    return { employeeId, permissionGranted };
  },
});

/**
 * Criação direta de colaborador com senha definida pelo partner
 * Cria o usuário diretamente no Clerk com senha, sem envio de email
 */
export const createEmployeeDirectly = mutationWithRole(["partner", "master"])({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    image: v.optional(v.string()),
    partnerId: v.optional(v.id("users")), // Opcional - apenas masters podem especificar
    organizationId: v.optional(v.id("partnerOrganizations")),
  },
  returns: v.object({
    employeeId: v.id("users"),
    permissionGranted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    console.log(`=== INÍCIO: createEmployeeDirectly para email=${args.email}, name=${args.name} ===`);
    
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    if (!currentUserId) throw new Error("Usuário não autenticado");

    // Determina o partnerId a ser usado
    let targetPartnerId = currentUserId;
    
    // Apenas masters podem especificar um partnerId diferente
    if (args.partnerId) {
      if (currentUserRole !== "master") {
        throw new Error("Apenas masters podem criar employees para outros partners");
      }
      
      // Verifica se o partner especificado existe
      const targetPartner = await ctx.db.get(args.partnerId);
      if (!targetPartner || targetPartner.role !== "partner") {
        throw new Error("Partner especificado não encontrado ou não é um partner válido");
      }
      
      targetPartnerId = args.partnerId;
    }

    // Validações básicas
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(args.email)) {
      throw new Error("Email inválido");
    }

    if (args.password.length < 8) {
      throw new Error("Senha deve ter pelo menos 8 caracteres");
    }

    // Verifica se já existe usuário com esse email
    console.log(`Verificando se já existe usuário com email ${args.email}...`);
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Já existe um usuário com este email");
    }

    // Valida organização se fornecida
    if (args.organizationId) {
      const organization = await ctx.db.get(args.organizationId);
      if (!organization) {
        throw new Error("Organização não encontrada");
      }
      
      // Masters podem associar a qualquer organização, partners apenas às suas
      if (currentUserRole === "partner" && organization.partnerId !== currentUserId) {
        throw new Error("Organização não pertence ao partner");
      }
    }

    // Cria o usuário diretamente no Convex
    console.log(`Criando novo colaborador para ${args.email}...`);
    const newEmployeeId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      role: "employee",
      partnerId: targetPartnerId,
      organizationId: args.organizationId,
      isAnonymous: false,
      emailVerificationTime: Date.now(), // Consideramos como verificado
    });
    console.log(`Novo colaborador criado com ID: ${newEmployeeId}`);

    // Agenda criação no Clerk com senha
    console.log(`Agendando criação direta no Clerk para ${args.email}...`);
    await ctx.scheduler.runAfter(0, internal.domains.integrations.clerk.createEmployeeDirectly, {
      email: args.email,
      password: args.password,
      name: args.name,
      employeeId: newEmployeeId,
    });

    let permissionGranted = false;

    // Concede permissões automáticas
    if (args.organizationId) {
      const organization = await ctx.db.get(args.organizationId);
      if (organization) {
        if (currentUserRole === "master" || organization.partnerId.toString() === currentUserId.toString()) {
          try {
            await ctx.runMutation(api.domains.rbac.mutations.grantOrganizationPermission, {
              employeeId: newEmployeeId,
              organizationId: args.organizationId,
              permissions: ["view"],
              note: "Permissão básica concedida automaticamente durante criação direta"
            });
            permissionGranted = true;
          } catch (error) {
            console.error("Erro ao conceder permissão automática:", error);
          }
        }
      }
    } else {
      // Se nenhuma organização foi especificada, tenta conceder para a primeira organização do partner
      if (currentUserRole === "partner") {
        const partnerOrganizations = await ctx.db
          .query("partnerOrganizations")
          .withIndex("by_partner", (q) => q.eq("partnerId", currentUserId))
          .filter((q) => q.eq(q.field("isActive"), true))
          .take(1);

        if (partnerOrganizations.length > 0) {
          try {
            await ctx.runMutation(api.domains.rbac.mutations.grantOrganizationPermission, {
              employeeId: newEmployeeId,
              organizationId: partnerOrganizations[0]._id,
              permissions: ["view"],
              note: "Permissão básica concedida automaticamente para primeira organização do partner"
            });
            permissionGranted = true;
          } catch (error) {
            console.error("Erro ao conceder permissão automática para primeira organização:", error);
          }
        }
      }
    }

    console.log(`=== FIM: createEmployeeDirectly para ${args.email} ===`);
    return { employeeId: newEmployeeId, permissionGranted };
  },
});

/**
 * Cria (ou convida) um employee. Somente parceiros (ou masters) podem cadastrar
 * novos employees. Neste primeiro momento criamos um registro na tabela `users`
 * com papel "employee" e dados básicos; a autenticação via Clerk poderá
 * reconciliar o usuário definitivo mais tarde associando o mesmo e-mail.
 */
export const createEmployee = mutationWithRole(["partner", "master"])({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    partnerId: v.optional(v.id("users")), // Opcional - apenas masters podem especificar
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    console.log(`=== INÍCIO: createEmployee para email=${args.email}, name=${args.name} ===`);
    
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    if (!currentUserId) throw new Error("Usuário não autenticado");

    // Determina o partnerId a ser usado
    let targetPartnerId = currentUserId;
    
    // Apenas masters podem especificar um partnerId diferente
    if (args.partnerId) {
      if (currentUserRole !== "master") {
        throw new Error("Apenas masters podem criar employees para outros partners");
      }
      
      // Verifica se o partner especificado existe
      const targetPartner = await ctx.db.get(args.partnerId);
      if (!targetPartner || targetPartner.role !== "partner") {
        throw new Error("Partner especificado não encontrado ou não é um partner válido");
      }
      
      targetPartnerId = args.partnerId;
    }

    // Verifica se já existe usuário com esse e-mail
    console.log(`Verificando se já existe usuário com email ${args.email}...`);
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .collect();

    if (existing.length > 0) {
      // Se já existir, garante papel employee e associa ao partner
      console.log(`Usuário existente encontrado para ${args.email}, atualizando...`);
      const user = existing[0];
      await ctx.db.patch(user._id, {
        role: "employee",
        partnerId: targetPartnerId,
      });
      console.log(`Usuário atualizado com ID: ${user._id}`);
      
      // Envia convite via Clerk mesmo para usuário existente
      console.log(`Agendando convite via Clerk para usuário existente ${args.email}...`);
      await ctx.scheduler.runAfter(0, internal.domains.integrations.clerk.inviteEmployee, {
        email: args.email,
        name: args.name,
      });
      console.log(`Agendamento de convite concluído para ${args.email}`);
      
      return user._id as Id<"users">;
    }

    // Cria novo usuário placeholder associado ao partner
    console.log(`Criando novo usuário employee para ${args.email}...`);
    const newEmployeeId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      role: "employee",
      partnerId: targetPartnerId,
    });
    console.log(`Novo employee criado com ID: ${newEmployeeId}`);

    // Envia convite via Clerk (action async, fora da transação)
    console.log(`Agendando convite via Clerk para novo usuário ${args.email}...`);
    await ctx.scheduler.runAfter(0, internal.domains.integrations.clerk.inviteEmployee, {
      email: args.email,
      name: args.name,
    });
    console.log(`Agendamento de convite concluído para ${args.email}`);

    console.log(`=== FIM: createEmployee para ${args.email} ===`);
    return newEmployeeId as Id<"users">;
  },
});

/**
 * Cria um convite de employee e registra um token para onboarding via e-mail.
 */
export const createInvite = mutationWithRole(["partner", "master"])({
  args: {
    name: v.optional(v.string()),
    email: v.string(),
  },
  returns: v.id("invites"),
  handler: async (ctx, args) => {
    console.log(`=== INÍCIO: createInvite para email=${args.email}, name=${args.name} ===`);
    
    const currentUserId = await getCurrentUserConvexId(ctx);
    if (!currentUserId) throw new Error("Usuário não autenticado");

    // Cria ou obtém o placeholder employee e dispara convite via Clerk
    console.log(`Criando ou obtendo employee para ${args.email}...`);
    const inviteeId: Id<"users"> = await ctx.runMutation(
      api.domains.rbac.mutations.createEmployee,
      { name: args.name ?? "", email: args.email }
    );
    console.log(`Employee criado/obtido com ID: ${inviteeId}`);

    // Gera token de convite
    const token = uuidv4();
    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 dias

    // Insere convite na tabela
    console.log(`Gerando registro de convite na tabela invites para ${args.email}`);
    const inviteId = await ctx.db.insert("invites", {
      employeeId: inviteeId,
      email: args.email,
      token,
      createdAt: now,
      expiresAt,
      status: "pending",
    });
    console.log(`Convite registrado com ID: ${inviteId}`);

    console.log(`=== FIM: createInvite para ${args.email} ===`);
    return inviteId;
  },
});

/**
 * Marca um convite como utilizado após confirmação de cadastro.
 * Função privada para uso interno.
 */
export const markInviteUsed = internalMutation({
  args: {
    token: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const invite = await ctx.db
      .query("invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (!invite) throw new Error("Convite não encontrado");
    await ctx.db.patch(invite._id, { status: "used" });
    return null;
  },
});

/**
 * Marca todos os convites pendentes para um e-mail como usados (via webhook).
 */
export const markInvitesUsedByEmail = internalMutation({
  args: {
    email: v.string(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const invites = await ctx.db
      .query("invites")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    for (const invite of invites) {
      await ctx.db.patch(invite._id, { status: "used" });
    }
    return invites.length;
  },
});

/**
 * Atualiza dados básicos de um employee (nome, imagem). Somente partner dono ou master.
 */
export const updateEmployee = mutationWithRole(["partner", "master"])({
  args: {
    id: v.id("users"),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const role = await getCurrentUserRole(ctx);
    if (!currentUserId) throw new Error("Usuário não autenticado");

    // Busca employee
    const employee = await ctx.db.get(args.id);
    if (!employee) throw new Error("Employee não encontrado");
    if (employee.role !== "employee") throw new Error("Usuário não é employee");

    if (role === "partner") {
      // Permite se o employee estiver associado diretamente a este partner
      if (employee.partnerId?.toString() === currentUserId.toString()) {
        // ok
      } else {
        const rel = await ctx.db
          .query("assetPermissions")
          .withIndex("by_employee_partner", (q) => q.eq("employeeId", args.id).eq("partnerId", currentUserId))
          .collect();
        if (rel.length === 0) throw new Error("Você não pode editar este employee");
      }
    }

    await ctx.db.patch(args.id, {
      name: args.name ?? employee.name,
      image: args.image ?? employee.image,
    });
    return true;
  },
});

/**
 * Remove (demite) um employee — simplesmente altera role para traveler e remove suas permissões.
 * Se includeClerk=true, também exclui o usuário do Clerk.
 */
export const removeEmployee = mutationWithRole(["partner", "master"])({
  args: { 
    id: v.id("users"),
    includeClerk: v.optional(v.boolean())
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const role = await getCurrentUserRole(ctx);
    if (!currentUserId) throw new Error("Usuário não autenticado");

    const employee = await ctx.db.get(args.id);
    if (!employee) throw new Error("Employee não encontrado");
    if (employee.role !== "employee") throw new Error("Usuário não é employee");

    if (role === "partner") {
      // Permite remoção se for associado diretamente
      if (employee.partnerId?.toString() !== currentUserId.toString()) {
        const rel = await ctx.db
          .query("assetPermissions")
          .withIndex("by_employee_partner", (q) => q.eq("employeeId", args.id).eq("partnerId", currentUserId))
          .collect();
        if (rel.length === 0) throw new Error("Você não pode remover este employee");
      }
    }

    // Remove permissões do employee concedidas por este partner (ou todas se master)
    const toDelete = await ctx.db
      .query("assetPermissions")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.id))
      .collect();
    for (const perm of toDelete) {
      if (role === "master" || perm.partnerId.toString() === currentUserId.toString()) {
        await ctx.db.delete(perm._id);
      }
    }

    // Se solicitado, também exclui o usuário do Clerk
    if (args.includeClerk && employee.email) {
      // Agendamos a exclusão no Clerk de maneira assíncrona
      await ctx.scheduler.runAfter(0, internal.domains.integrations.clerk.deleteUser, {
        email: employee.email
      });
      console.log(`Agendada exclusão do usuário ${employee.email} no Clerk`);
    }

    // Atualiza role para traveler e remove associação ao partner
    await ctx.db.patch(args.id, { role: "traveler", partnerId: undefined });
    return true;
  },
});

/**
 * Cria uma nova organização para o partner
 */
export const createOrganization = mutationWithRole(["partner", "master"])({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    type: v.string(), // "restaurant", "accommodation", "rental_service", "activity_service", "event_service"
    image: v.optional(v.string()),
    partnerId: v.optional(v.id("users")), // Opcional - apenas masters podem especificar
    settings: v.optional(v.object({
      theme: v.optional(v.string()),
      contactInfo: v.optional(v.object({
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
      })),
    })),
  },
  returns: v.id("partnerOrganizations"),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Valida o tipo de organização
    const validTypes = ["restaurant", "accommodation", "rental_service", "activity_service", "event_service"];
    if (!validTypes.includes(args.type)) {
      throw new Error("Tipo de organização inválido");
    }

    // Determina o partnerId a ser usado
    let targetPartnerId = currentUserId;
    
    // Apenas masters podem especificar um partnerId diferente
    if (args.partnerId) {
      if (currentUserRole !== "master") {
        throw new Error("Apenas masters podem criar organizações para outros partners");
      }
      
      // Verifica se o partner especificado existe
      const targetPartner = await ctx.db.get(args.partnerId);
      if (!targetPartner || targetPartner.role !== "partner") {
        throw new Error("Partner especificado não encontrado ou não é um partner válido");
      }
      
      targetPartnerId = args.partnerId;
    }

    const now = Date.now();

    const organizationId = await ctx.db.insert("partnerOrganizations", {
      name: args.name,
      description: args.description,
      type: args.type,
      image: args.image,
      partnerId: targetPartnerId,
      isActive: true,
      settings: args.settings,
      createdAt: now,
      updatedAt: now,
    });

    return organizationId;
  },
});

/**
 * Atualiza uma organização
 */
export const updateOrganization = mutationWithRole(["partner", "master"])({
  args: {
    organizationId: v.id("partnerOrganizations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    settings: v.optional(v.object({
      theme: v.optional(v.string()),
      contactInfo: v.optional(v.object({
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
      })),
    })),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    // Verifica permissões
    if (currentUserRole === "partner" && organization.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Você não tem permissão para atualizar esta organização");
    }

    const updateData: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.image !== undefined) updateData.image = args.image;
    if (args.isActive !== undefined) updateData.isActive = args.isActive;
    if (args.settings !== undefined) updateData.settings = args.settings;

    await ctx.db.patch(args.organizationId, updateData);
    return true;
  },
});

/**
 * Associa um asset existente a uma organização
 */
export const addAssetToOrganization = mutationWithRole(["partner", "master"])({
  args: {
    organizationId: v.id("partnerOrganizations"),
    assetId: v.string(),
    assetType: v.string(),
  },
  returns: v.id("partnerAssets"),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organização não encontrada");
    }

    // Verifica permissões
    if (currentUserRole === "partner" && organization.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Você não tem permissão para adicionar assets a esta organização");
    }

    // Verifica se o asset existe e pertence ao partner
    let assetExists = false;
    let assetOwnerId: string | undefined;

    switch (args.assetType) {
      case "restaurants":
        const restaurant = await ctx.db.get(args.assetId as any);
        if (restaurant) {
          assetExists = true;
          assetOwnerId = restaurant.partnerId?.toString();
        }
        break;
      case "events":
        const event = await ctx.db.get(args.assetId as any);
        if (event) {
          assetExists = true;
          assetOwnerId = event.partnerId?.toString();
        }
        break;
      case "activities":
        const activity = await ctx.db.get(args.assetId as any);
        if (activity) {
          assetExists = true;
          assetOwnerId = activity.partnerId?.toString();
        }
        break;
      case "vehicles":
        const vehicle = await ctx.db.get(args.assetId as any);
        if (vehicle) {
          assetExists = true;
          assetOwnerId = vehicle.ownerId?.toString();
        }
        break;

      default:
        throw new Error("Tipo de asset inválido");
    }

    if (!assetExists) {
      throw new Error("Asset não encontrado");
    }

    // Verifica se o partner é o dono do asset (exceto para masters)
    if (currentUserRole === "partner" && assetOwnerId !== currentUserId.toString()) {
      throw new Error("Você não é o dono deste asset");
    }

    // Verifica se o asset já está associado a esta organização
    const existingAssociation = await ctx.db
      .query("partnerAssets")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => 
        q.and(
          q.eq(q.field("assetId"), args.assetId),
          q.eq(q.field("assetType"), args.assetType)
        )
      )
      .first();

    if (existingAssociation) {
      throw new Error("Asset já está associado a esta organização");
    }

    const now = Date.now();

    const partnerAssetId = await ctx.db.insert("partnerAssets", {
      organizationId: args.organizationId,
      assetId: args.assetId,
      assetType: args.assetType,
      partnerId: organization.partnerId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return partnerAssetId;
  },
});

/**
 * Remove um asset de uma organização
 */
export const removeAssetFromOrganization = mutationWithRole(["partner", "master"])({
  args: {
    partnerAssetId: v.id("partnerAssets"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const partnerAsset = await ctx.db.get(args.partnerAssetId);
    if (!partnerAsset) {
      throw new Error("Associação asset-organização não encontrada");
    }

    // Verifica permissões
    if (currentUserRole === "partner" && partnerAsset.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Você não tem permissão para remover este asset");
    }

    await ctx.db.delete(args.partnerAssetId);
    return true;
  },
});

/**
 * Concede permissão a um employee para acessar uma organização específica
 * Apenas partners (donos da organização) e masters podem conceder permissões
 */
export const grantOrganizationPermission = mutationWithRole(["partner", "master"])({
  args: {
    // Employee que receberá a permissão
    employeeId: v.id("users"),
    // ID da organização/empreendimento
    organizationId: v.id("partnerOrganizations"),
    // Permissões (view, edit, manage)
    permissions: v.array(v.string()),
    // Nota opcional sobre a permissão
    note: v.optional(v.string()),
  },
  returns: v.id("organizationPermissions"),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }
    
    // Verificar se o employee existe e tem papel de employee
    const employee = await ctx.db.get(args.employeeId);
    if (!employee) {
      throw new Error("Employee não encontrado");
    }
    
    if (employee.role !== "employee") {
      throw new Error("O usuário selecionado não é um employee");
    }
    
    // Verificar se a organização existe
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organização não encontrada");
    }
    
    // Se for partner, verificar se a organização pertence a ele
    if (currentUserRole === "partner") {
      if (organization.partnerId.toString() !== currentUserId.toString()) {
        throw new Error("Você não tem permissão para compartilhar essa organização");
      }
      
      // Verificar se o employee foi criado por este partner
      if (employee.partnerId?.toString() !== currentUserId.toString()) {
        throw new Error("Você só pode atribuir empreendimentos a employees criados por você");
      }
    }
    
    // Verifica se já existe uma permissão para este employee e organização
    const existingPermission = await ctx.db
      .query("organizationPermissions")
      .withIndex("by_employee_organization", (q) => 
        q.eq("employeeId", args.employeeId).eq("organizationId", args.organizationId)
      )
      .first();
    
    const now = Date.now();
    
    // Se já existe, atualiza as permissões
    if (existingPermission) {
      await ctx.db.patch(existingPermission._id, {
        permissions: args.permissions,
        note: args.note,
        updatedAt: now,
      });
      return existingPermission._id;
    }
    
    // Caso contrário, cria uma nova permissão
    return await ctx.db.insert("organizationPermissions", {
      employeeId: args.employeeId,
      partnerId: currentUserId,
      organizationId: args.organizationId,
      permissions: args.permissions,
      note: args.note,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Remove a permissão de um employee para uma organização específica
 * Apenas partners (donos da organização) e masters podem remover permissões
 */
export const revokeOrganizationPermission = mutationWithRole(["partner", "master"])({
  args: {
    // ID da permissão a ser removida
    permissionId: v.id("organizationPermissions"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }
    
    // Busca a permissão
    const permission = await ctx.db.get(args.permissionId);
    if (!permission) {
      throw new Error("Permissão não encontrada");
    }
    
    // Se for partner, verificar se é o dono da organização
    if (currentUserRole === "partner" && permission.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Você não tem permissão para remover esta permissão");
    }
    
    // Remove a permissão
    await ctx.db.delete(args.permissionId);
    return true;
  },
});

/**
 * Atualiza as permissões de um employee para uma organização específica
 */
export const updateOrganizationPermission = mutationWithRole(["partner", "master"])({
  args: {
    // ID da permissão a ser atualizada
    permissionId: v.id("organizationPermissions"),
    // Novas permissões (view, edit, manage)
    permissions: v.array(v.string()),
    // Nova nota opcional
    note: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);
    
    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }
    
    // Busca a permissão
    const permission = await ctx.db.get(args.permissionId);
    if (!permission) {
      throw new Error("Permissão não encontrada");
    }
    
    // Se for partner, verificar se é o dono da organização
    if (currentUserRole === "partner" && permission.partnerId.toString() !== currentUserId.toString()) {
      throw new Error("Você não tem permissão para atualizar esta permissão");
    }
    
    // Atualiza a permissão
    await ctx.db.patch(args.permissionId, {
      permissions: args.permissions,
      note: args.note,
      updatedAt: Date.now(),
    });
    
    return true;
  },
});

/**
 * Cria uma nova organização com restaurante integrado
 */
export const createOrganizationWithRestaurant = mutationWithRole(["partner", "master"])({
  args: {
    // Dados da organização
    organizationName: v.string(),
    organizationDescription: v.optional(v.string()),
    organizationType: v.string(),
    organizationSettings: v.optional(v.object({
      theme: v.optional(v.string()),
      contactInfo: v.optional(v.object({
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
      })),
    })),
    // Dados do restaurante (opcionais, apenas quando tipo = "restaurant")
    restaurantData: v.optional(v.object({
      name: v.string(),
      slug: v.string(),
      description: v.string(),
      description_long: v.string(),
      address: v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
        neighborhood: v.string(),
        coordinates: v.object({
          latitude: v.number(),
          longitude: v.number(),
        }),
      }),
      phone: v.string(),
      website: v.optional(v.string()),
      cuisine: v.array(v.string()),
      priceRange: v.string(),
      diningStyle: v.string(),
      hours: v.object({
        Monday: v.array(v.string()),
        Tuesday: v.array(v.string()),
        Wednesday: v.array(v.string()),
        Thursday: v.array(v.string()),
        Friday: v.array(v.string()),
        Saturday: v.array(v.string()),
        Sunday: v.array(v.string()),
      }),
      features: v.array(v.string()),
      dressCode: v.optional(v.string()),
      paymentOptions: v.array(v.string()),
      parkingDetails: v.optional(v.string()),
      mainImage: v.string(),
      galleryImages: v.array(v.string()),
      menuImages: v.optional(v.array(v.string())),
      rating: v.object({
        overall: v.number(),
        food: v.number(),
        service: v.number(),
        ambience: v.number(),
        value: v.number(),
        noiseLevel: v.string(),
        totalReviews: v.number(),
      }),
      acceptsReservations: v.boolean(),
      maximumPartySize: v.number(),
      tags: v.array(v.string()),
      executiveChef: v.optional(v.string()),
      privatePartyInfo: v.optional(v.string()),
      isActive: v.boolean(),
      isFeatured: v.boolean(),
    })),
  },
  returns: v.object({
    organizationId: v.id("partnerOrganizations"),
    restaurantId: v.optional(v.id("restaurants")),
  }),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    // Valida o tipo de organização
    const validTypes = ["restaurant", "rental_service", "activity_service", "event_service"];
    if (!validTypes.includes(args.organizationType)) {
      throw new Error("Tipo de organização inválido");
    }

    // Se for restaurante, os dados do restaurante são obrigatórios
    if (args.organizationType === "restaurant" && !args.restaurantData) {
      throw new Error("Dados do restaurante são obrigatórios para organizações do tipo restaurante");
    }

    const now = Date.now();

    // Criar a organização
    const organizationId = await ctx.db.insert("partnerOrganizations", {
      name: args.organizationName,
      description: args.organizationDescription,
      type: args.organizationType,
      partnerId: currentUserId,
      isActive: true,
      settings: args.organizationSettings,
      createdAt: now,
      updatedAt: now,
    });

    let restaurantId: any = undefined;

    // Se for restaurante, criar o restaurante automaticamente
    if (args.organizationType === "restaurant" && args.restaurantData) {
      const restaurantData = args.restaurantData;
      
      // Convert numbers to appropriate types for the database
      const maximumPartySize = BigInt(restaurantData.maximumPartySize);
      const totalReviews = BigInt(restaurantData.rating.totalReviews);
      
      // Criar o restaurante
      restaurantId = await ctx.db.insert("restaurants", {
        name: restaurantData.name,
        slug: restaurantData.slug,
        description: restaurantData.description,
        description_long: restaurantData.description_long,
        address: {
          ...restaurantData.address,
          coordinates: {
            latitude: restaurantData.address.coordinates.latitude,
            longitude: restaurantData.address.coordinates.longitude,
          },
        },
        phone: restaurantData.phone,
        website: restaurantData.website,
        cuisine: restaurantData.cuisine,
        priceRange: restaurantData.priceRange,
        diningStyle: restaurantData.diningStyle,
        hours: restaurantData.hours,
        features: restaurantData.features,
        dressCode: restaurantData.dressCode,
        paymentOptions: restaurantData.paymentOptions,
        parkingDetails: restaurantData.parkingDetails,
        mainImage: restaurantData.mainImage,
        galleryImages: restaurantData.galleryImages,
        menuImages: restaurantData.menuImages,
        rating: {
          ...restaurantData.rating,
          overall: restaurantData.rating.overall,
          food: restaurantData.rating.food,
          service: restaurantData.rating.service,
          ambience: restaurantData.rating.ambience,
          value: restaurantData.rating.value,
          totalReviews,
        },
        acceptsReservations: restaurantData.acceptsReservations,
        maximumPartySize,
        tags: restaurantData.tags,
        executiveChef: restaurantData.executiveChef,
        privatePartyInfo: restaurantData.privatePartyInfo,
        isActive: restaurantData.isActive,
        isFeatured: restaurantData.isFeatured,
        partnerId: currentUserId,
      });

      // Associar o restaurante à organização
      await ctx.db.insert("partnerAssets", {
        organizationId,
        assetId: restaurantId,
        assetType: "restaurants",
        partnerId: currentUserId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    return {
      organizationId,
      restaurantId,
    };
  },
});

/**
 * Migration function to populate partnerId field from grantedBy for existing records
 * This should be run once after the schema change
 */
export const migrateAssetPermissionsPartnerField = mutationWithRole(["master"])({
  args: {},
  returns: v.object({
    updated: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    const permissions = await ctx.db.query("assetPermissions").collect();
    let updated = 0;

    for (const permission of permissions) {
      // If partnerId doesn't exist but grantedBy does, copy it over
      if (!(permission as any).partnerId && (permission as any).grantedBy) {
        await ctx.db.patch(permission._id, {
          partnerId: (permission as any).grantedBy,
        });
        updated++;
      }
    }

    return {
      updated,
      message: `Migration completed. Updated ${updated} permission records.`,
    };
  },
});

/**
 * DEVELOPMENT ONLY: Cria organizações de exemplo para testes
 */
export const createSampleOrganizations = mutationWithRole(["partner", "master"])({
  args: {},
  returns: v.array(v.id("partnerOrganizations")),
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserConvexId(ctx);
    const currentUserRole = await getCurrentUserRole(ctx);

    if (!currentUserId) {
      throw new Error("Usuário não autenticado");
    }

    const now = Date.now();
    const organizations: Id<"partnerOrganizations">[] = [];

    // Restaurante do Mar - Organização de Restaurante
    const restauranteId = await ctx.db.insert("partnerOrganizations", {
      name: "Restaurante do Mar",
      description: "Restaurante especializado em frutos do mar com vista para o oceano",
      type: "restaurant",
      partnerId: currentUserId,
      isActive: true,
      settings: {
        contactInfo: {
          email: "contato@restaurantedomar.com",
          phone: "(85) 3456-7890",
          website: "www.restaurantedomar.com",
        }
      },
      createdAt: now,
      updatedAt: now,
    });
    organizations.push(restauranteId);

    // Aventuras Fernando de Noronha - Organização de Atividades
    const aventurasId = await ctx.db.insert("partnerOrganizations", {
      name: "Aventuras Fernando de Noronha",
      description: "Experiências únicas em atividades aquáticas e terrestres",
      type: "activity_service",
      partnerId: currentUserId,
      isActive: true,
      settings: {
        contactInfo: {
          email: "aventuras@fernandodenoronha.com",
          phone: "(85) 3654-3210",
          website: "www.aventurasfn.com",
        }
      },
      createdAt: now,
      updatedAt: now,
    });
    organizations.push(aventurasId);

    // Eventos Noronha - Organização de Eventos
    const eventosId = await ctx.db.insert("partnerOrganizations", {
      name: "Eventos Noronha",
      description: "Organização de eventos especiais na ilha",
      type: "event_service",
      partnerId: currentUserId,
      isActive: true,
      settings: {
        contactInfo: {
          email: "eventos@noronha.com",
          phone: "(85) 3789-4560",
          website: "www.eventosnoronha.com",
        }
      },
      createdAt: now,
      updatedAt: now,
    });
    organizations.push(eventosId);

    // Aluguel de Veículos Ilha - Organização de Veículos
    const veiculosId = await ctx.db.insert("partnerOrganizations", {
      name: "Aluguel de Veículos Ilha",
      description: "Locação de buggies e veículos para explorar a ilha",
      type: "rental_service",
      partnerId: currentUserId,
      isActive: true,
      settings: {
        contactInfo: {
          email: "veiculos@ilha.com",
          phone: "(85) 3321-6540",
          website: "www.aluguelilha.com",
        }
      },
      createdAt: now,
      updatedAt: now,
    });
    organizations.push(veiculosId);

    return organizations;
  },
});



 