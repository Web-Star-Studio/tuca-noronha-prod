"use node";

import { internalAction } from "../../_generated/server";
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
      } else {
        console.log(`SUCESSO: Usuário com ID ${userId} excluído no Clerk`);
        return true;
      }
    } catch (error) {
      console.error("EXCEÇÃO ao excluir usuário:", error);
      return false;
    }
  },
}); 