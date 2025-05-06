/**
 * Tipos para integração Convex-Clerk com TypeScript
 */

// Tipo para representar um usuário autenticado pelo Clerk
export interface ClerkUserIdentity {
  subject: string;          // ID único do usuário no Clerk
  tokenIdentifier: string;  // Identificador do token JWT  
  name?: string;            // Nome de exibição opcional do usuário
  email?: string;           // Email opcional do usuário
  pictureUrl?: string;      // URL da imagem de perfil opcional
  emailVerified?: boolean;  // Se o email do usuário foi verificado
  phoneNumber?: string;     // Número de telefone opcional do usuário
  phoneNumberVerified?: boolean; // Se o telefone do usuário foi verificado
}

// Tipo para o contexto de autenticação do Convex
export interface AuthContextWithClerk {
  auth: {
    getUserIdentity: () => Promise<ClerkUserIdentity | null>;
  };
}

// Tipo para representar um usuário em nossa aplicação
export interface User {
  id: string;               // ID do usuário (normalmente o subject do Clerk)
  name?: string;            // Nome de exibição do usuário
  email?: string;           // Email do usuário
  image?: string;           // URL da imagem de perfil do usuário
  createdAt?: number;       // Timestamp de quando o usuário foi criado
  updatedAt?: number;       // Timestamp da última atualização do usuário
}

// Helpers de tipagem para funções autenticadas
export const isAuthenticated = (
  identity: ClerkUserIdentity | null
): identity is ClerkUserIdentity => {
  return identity !== null;
};
