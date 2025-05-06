import { query } from "./_generated/server";
import { AuthContextWithClerk, ClerkUserIdentity, User, isAuthenticated } from "./types";

// Função auxiliar para obter o usuário a partir do contexto de autenticação
export const getUserFromContext = async (ctx: AuthContextWithClerk): Promise<User> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!isAuthenticated(identity)) {
    throw new Error("Unauthorized");
  }
  return {
    id: identity.subject,
    name: identity.name,
    email: identity.email,
    image: identity.pictureUrl
  };
};

// Função query para obter o usuário atual
export const getUser = query({
  args: {},
  handler: async (ctx): Promise<User | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    return {
      id: identity.subject,
      name: identity.name,
      email: identity.email,
      image: identity.pictureUrl
    };
  },
});

// Verificador de autenticação para uso em outras funções
export const requireAuth = async (ctx: AuthContextWithClerk): Promise<ClerkUserIdentity> => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Não autorizado");
  }
  return identity;
};
