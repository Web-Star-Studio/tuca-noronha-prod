"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Componente de diagnóstico de usuário
 * Use temporariamente para diagnosticar e resolver problemas de autenticação
 */
export function UserDebug() {
  const { user: clerkUser, isSignedIn, isLoaded } = useUser();
  const convexUser = useQuery(api.domains.users.queries.getCurrentUser);
  
  type UserStatus = "loading" | "success" | "error" | "fixing";
  const [status, setStatus] = useState<UserStatus>("loading");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<Record<string, unknown> | null>(null);
  
  useEffect(() => {
    if (!isLoaded) {
      setStatus("loading");
      setMessage("Carregando dados do usuário...");
      return;
    }
    
    if (!isSignedIn || !clerkUser) {
      setStatus("error");
      setMessage("Usuário não está autenticado no Clerk");
      return;
    }
    
    if (convexUser === undefined) {
      setStatus("loading");
      setMessage("Carregando dados do Convex...");
      return;
    }
    
    if (!convexUser) {
      setStatus("error");
      setMessage("Usuário autenticado no Clerk mas não encontrado no Convex");
      setDetails({
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName
      });
      return;
    }
    
    setStatus("success");
    setMessage("Usuário corretamente sincronizado entre Clerk e Convex");
    setDetails({
      clerk: {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName
      },
      convex: convexUser
    });
  }, [isLoaded, isSignedIn, clerkUser, convexUser]);
  
  const syncUser = async () => {
    if (!clerkUser) return;
    
    setStatus("fixing");
    setMessage("Tentando sincronizar usuário...");
    
    try {
      const userData = {
        clerkId: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName || clerkUser.username,
        image: clerkUser.imageUrl,
        createdAt: clerkUser.createdAt?.getTime()
      };
      
      const response = await fetch("/api/sync-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setStatus("success");
        setMessage("Usuário sincronizado com sucesso!");
        setDetails(result);
      } else {
        setStatus("error");
        setMessage("Erro ao sincronizar usuário");
        setDetails(result);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Erro ao sincronizar usuário");
      setDetails(error instanceof Error 
        ? { message: error.message, name: error.name } 
        : { message: 'Erro desconhecido' });
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Diagnóstico de Usuário</CardTitle>
        <CardDescription>
          Verificação da sincronização entre Clerk e Convex
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Alert className={
          status === "loading" ? "bg-blue-50" :
          status === "success" ? "bg-green-50" :
          status === "fixing" ? "bg-yellow-50" :
          "bg-red-50"
        }>
          <AlertTitle>
            {status === "loading" && "Carregando..."}
            {status === "success" && "Sincronizado"}
            {status === "error" && "Erro de Sincronização"}
            {status === "fixing" && "Sincronizando..."}
          </AlertTitle>
          <AlertDescription>
            {message}
          </AlertDescription>
        </Alert>
        
        {details && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-semibold mb-2">Detalhes:</h3>
            <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {status === "error" && (
          <Button 
            onClick={syncUser}
            disabled={!clerkUser}
            className="w-full"
          >
            Sincronizar Usuário
          </Button>
        )}
        
        {status === "success" && (
          <p className="text-sm text-green-600 w-full text-center">
            Usuário corretamente sincronizado! ✅
          </p>
        )}
      </CardFooter>
    </Card>
  );
} 