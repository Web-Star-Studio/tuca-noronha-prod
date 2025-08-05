import { createContext, useContext, useEffect, useState } from 'react';
import { useConvexAuth } from "convex/react";
import { useUser } from "@clerk/nextjs";

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userId: null,
  isLoading: true,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [userId, setUserId] = useState<string | null>(null);
  
  // Obter o ID real do usuário do Clerk
  useEffect(() => {
    if (isAuthenticated && clerkUser && clerkLoaded && !userId) {
      // Em produção, usamos o ID real do usuário do Clerk
      setUserId(clerkUser.id);
      
      // Log para depuração (pode ser removido em produção)

    } else if (!isAuthenticated) {
      setUserId(null);
    }
  }, [isAuthenticated, clerkUser, clerkLoaded, userId]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userId, 
      // Consideramos que estamos carregando se o Clerk ainda estiver carregando OU se o Convex ainda está verificando
      isLoading: isLoading || !clerkLoaded 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 