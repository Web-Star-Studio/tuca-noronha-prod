"use node";

import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";

/**
 * Action interna que cria um convite (ou adiciona) um usuário no Clerk.
 * Clerk enviará o email de convite automaticamente.
 */
export const inviteEmployee = internalAction({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { email, name }) => {
    console.log(`=== INÍCIO: inviteEmployee chamado para email=${email}, name=${name} ===`);
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (!clerkSecret) {
      console.error("ERRO CRÍTICO: CLERK_SECRET_KEY não configurada – pulando convite Clerk");
      return null;
    }
    console.log(`CLERK_SECRET_KEY configurada: ${clerkSecret.substring(0, 5)}...`);

    const headers = {
      Authorization: `Bearer ${clerkSecret}`,
      "Content-Type": "application/json",
    } as const;

    // Primeiro verifica se já existe usuário com esse email
    console.log(`Verificando se usuário com email ${email} já existe no Clerk...`);
    const existingRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
      method: "GET",
      headers,
    });
    if (!existingRes.ok) {
      const txt = await existingRes.text();
      console.error("Erro ao consultar usuário no Clerk", existingRes.status, txt);
    }
    const existing = (await existingRes.json()) as Array<{ id: string }>;
    console.log(`Clerk existing users count for ${email}: ${existing.length}`);

    if (existing.length === 0) {
      // Cria convite
      console.log(`Criando novo convite no Clerk para ${email}...`);
      try {
        const inviteRes = await fetch("https://api.clerk.com/v1/invitations", {
          method: "POST",
          headers,
          body: JSON.stringify({ email_address: email, public_metadata: { role: "employee", name } }),
        });
        
        const inviteTxt = await inviteRes.text();
        console.log(`Resposta do Clerk para convite de ${email}:`, inviteRes.status, inviteTxt);
        
        if (!inviteRes.ok) {
          console.error("ERRO ao criar convite Clerk", inviteRes.status, inviteTxt);
        } else {
          console.log(`SUCESSO: Convite enviado para ${email}`);
        }
      } catch (error) {
        console.error("EXCEÇÃO ao enviar convite:", error);
      }
    } else {
      // Usuário já existe – garante role employee em metadata
      const userId = existing[0].id;
      console.log(`Atualizando metadata de usuário existente no Clerk para ${userId}...`);
      try {
        const metaRes = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ public_metadata: { role: "employee", name } }),
        });
        
        const metaTxt = await metaRes.text();
        console.log(`Resposta do Clerk para atualização de metadata de ${userId}:`, metaRes.status, metaTxt);
        
        if (!metaRes.ok) {
          console.error("ERRO ao atualizar metadata Clerk", metaRes.status, metaTxt);
        }
      } catch (error) {
        console.error("EXCEÇÃO ao atualizar metadata:", error);
      }
    }

    console.log(`=== FIM: processamento de inviteEmployee para ${email} ===`);
    return null;
  },
});

/**
 * Action interna que exclui um usuário no Clerk.
 */
export const deleteUser = internalAction({
  args: {
    email: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, { email }) => {
    console.log(`=== INÍCIO: deleteUser chamado para email=${email} ===`);
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (!clerkSecret) {
      console.error("ERRO CRÍTICO: CLERK_SECRET_KEY não configurada – pulando exclusão Clerk");
      return false;
    }
    console.log(`CLERK_SECRET_KEY configurada: ${clerkSecret.substring(0, 5)}...`);

    const headers = {
      Authorization: `Bearer ${clerkSecret}`,
      "Content-Type": "application/json",
    } as const;

    // Primeiro verifica se existe usuário com esse email
    console.log(`Verificando se usuário com email ${email} existe no Clerk...`);
    const existingRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
      method: "GET",
      headers,
    });
    
    if (!existingRes.ok) {
      const txt = await existingRes.text();
      console.error("Erro ao consultar usuário no Clerk", existingRes.status, txt);
      return false;
    }
    
    const existing = (await existingRes.json()) as Array<{ id: string }>;
    console.log(`Clerk existing users count for ${email}: ${existing.length}`);

    if (existing.length === 0) {
      console.log(`Nenhum usuário encontrado no Clerk para o email ${email}`);
      return false;
    }

    // Exclui o usuário no Clerk
    const userId = existing[0].id;
    console.log(`Excluindo usuário no Clerk com ID ${userId}...`);
    
    try {
      const deleteRes = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: "DELETE",
        headers,
      });
      
      const deleteTxt = await deleteRes.text();
      console.log(`Resposta do Clerk para exclusão de ${userId}:`, deleteRes.status, deleteTxt);
      
      if (!deleteRes.ok) {
        console.error("ERRO ao excluir usuário no Clerk", deleteRes.status, deleteTxt);
        return false;
      }
      
      console.log(`SUCESSO: Usuário com ID ${userId} excluído no Clerk`);
      return true;
    } catch (error) {
      console.error("EXCEÇÃO ao excluir usuário:", error);
      return false;
    }
  },
});

/**
 * Action interna que cria um usuário diretamente no Clerk com senha
 * Não envia email de convite, o usuário pode fazer login imediatamente
 */
export const createEmployeeDirectly = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    employeeId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, { email, password, name, employeeId }) => {
    console.log(`=== INÍCIO: createEmployeeDirectly chamado para email=${email}, name=${name} ===`);
    const clerkSecret = process.env.CLERK_SECRET_KEY;
    if (!clerkSecret) {
      console.error("ERRO CRÍTICO: CLERK_SECRET_KEY não configurada – pulando criação direta Clerk");
      
      // Marca o usuário como falha na criação
      await ctx.runMutation(internal.domains.users.mutations.updateUserClerkId, {
        userId: employeeId,
        clerkId: `failed_${Date.now()}_no_clerk_key`,
      });
      return null;
    }
    console.log(`CLERK_SECRET_KEY configurada: ${clerkSecret.substring(0, 5)}...`);

    const headers = {
      Authorization: `Bearer ${clerkSecret}`,
      "Content-Type": "application/json",
    } as const;

    // Primeiro verifica se já existe usuário com esse email
    console.log(`Verificando se usuário com email ${email} já existe no Clerk...`);
    try {
      const existingRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
        method: "GET",
        headers,
      });
      
      if (!existingRes.ok) {
        const txt = await existingRes.text();
        console.error("Erro ao consultar usuário no Clerk", existingRes.status, txt);
        throw new Error(`Erro ao consultar usuário: ${existingRes.status}`);
      }
      
      const existing = (await existingRes.json()) as Array<{ id: string }>;
      console.log(`Clerk existing users count for ${email}: ${existing.length}`);

      if (existing.length > 0) {
        console.log(`Usuário já existe no Clerk para ${email}, usando ID existente`);
        const existingUserId = existing[0].id;
        
        // Atualiza metadata para garantir role employee
        await fetch(`https://api.clerk.com/v1/users/${existingUserId}/metadata`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ 
            public_metadata: { role: "employee", name }
          }),
        });
        
        // Atualiza o Convex com o Clerk ID existente
        await ctx.runMutation(internal.domains.users.mutations.updateUserClerkId, {
          userId: employeeId,
          clerkId: existingUserId,
        });
        
        console.log(`=== FIM: createEmployeeDirectly (usuário existente) para ${email} ===`);
        return null;
      }

      // Cria novo usuário diretamente com senha
      console.log(`Criando novo usuário no Clerk para ${email} com senha...`);
      const requestBody = {
        email_address: [email],
        password: password,
        first_name: name.split(' ')[0] || name,
        last_name: name.split(' ').slice(1).join(' ') || '',
        public_metadata: { 
          role: "employee", 
          name: name 
        },
        // Essas configurações são importantes para garantir que o usuário seja criado corretamente
        skip_password_checks: false, // Valida a senha
        skip_password_requirement: false, // Senha é obrigatória
      };
      
      console.log(`Request body para Clerk:`, JSON.stringify(requestBody, null, 2));
      
      const createRes = await fetch("https://api.clerk.com/v1/users", {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });
      
      const createTxt = await createRes.text();
      console.log(`Resposta do Clerk para criação de ${email}:`, createRes.status, createTxt);
      
      if (!createRes.ok) {
        console.error("ERRO ao criar usuário no Clerk", createRes.status, createTxt);
        
        // Tenta analisar o erro do Clerk
        try {
          const errorResponse = JSON.parse(createTxt);
          console.error("Detalhes do erro do Clerk:", errorResponse);
          
          if (errorResponse.errors) {
            console.error("Erros específicos:", errorResponse.errors);
          }
        } catch (parseError) {
          console.error("Não foi possível parsear resposta de erro do Clerk");
        }
        
        // Marca o usuário como falha na criação
        await ctx.runMutation(internal.domains.users.mutations.updateUserClerkId, {
          userId: employeeId,
          clerkId: `failed_${Date.now()}_${createRes.status}`,
        });
        
        throw new Error(`Erro ao criar usuário no Clerk: ${createRes.status} - ${createTxt}`);
      }
      
      const createdUser = JSON.parse(createTxt) as { id: string };
      console.log(`SUCESSO: Usuário criado no Clerk com ID ${createdUser.id} para ${email}`);
      
      // Atualiza o Convex com o Clerk ID real
      await ctx.runMutation(internal.domains.users.mutations.updateUserClerkId, {
        userId: employeeId,
        clerkId: createdUser.id,
      });
      
    } catch (error) {
      console.error("EXCEÇÃO ao criar usuário diretamente:", error);
      
      // Marca o usuário como falha na criação
      await ctx.runMutation(internal.domains.users.mutations.updateUserClerkId, {
        userId: employeeId,
        clerkId: `failed_${Date.now()}_exception`,
      });
      
      throw error;
    }

    console.log(`=== FIM: createEmployeeDirectly para ${email} ===`);
    return null;
  },
}); 