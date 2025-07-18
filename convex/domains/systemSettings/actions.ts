import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";

export const updateSystemContactSettings = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    console.log("🔄 Iniciando atualização das configurações de contato...");

    try {
      // Atualizar email de suporte
      console.log("📧 Atualizando email de suporte...");
      await ctx.runMutation(internal.domains.systemSettings.mutations.internalUpdateSetting, {
        key: "support.email",
        value: "atendimentotucanoronha@gmail.com",
        type: "string"
      });

      // Atualizar telefone de suporte
      console.log("📱 Atualizando telefone de suporte...");
      await ctx.runMutation(internal.domains.systemSettings.mutations.internalUpdateSetting, {
        key: "support.phone",
        value: "+5581979097547",
        type: "string"
      });

      // Atualizar WhatsApp
      console.log("📲 Atualizando WhatsApp...");
      await ctx.runMutation(internal.domains.systemSettings.mutations.internalUpdateSetting, {
        key: "whatsapp.admin_number",
        value: "+5581979097547",
        type: "string"
      });

      console.log("✅ Configurações de contato atualizadas com sucesso!");
      console.log("📧 Email: atendimentotucanoronha@gmail.com");
      console.log("📱 Telefone: +5581979097547");
      console.log("📲 WhatsApp: +5581979097547");

    } catch (error) {
      console.error("❌ Erro ao atualizar configurações:", error);
      throw error;
    }

    return null;
  },
}); 