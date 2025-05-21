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
      // Adicionar outros tipos de asset aqui conforme necessário
      
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
      assetId: args.assetId,
      assetType: args.assetType,
      permissions: args.permissions,
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
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    console.log(`=== INÍCIO: createEmployee para email=${args.email}, name=${args.name} ===`);
    
    const currentUserId = await getCurrentUserConvexId(ctx);
    if (!currentUserId) throw new Error("Usuário não autenticado");

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
        partnerId: currentUserId,
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
      partnerId: currentUserId,
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