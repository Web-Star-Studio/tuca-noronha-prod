"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { Loader2 } from "lucide-react";
import GuiaPageContent from "./GuiaPageContent";

export default function GuideAccessWrapper() {
  const router = useRouter();
  const { isLoaded: authLoaded, userId } = useAuth();
  
  // Wait for auth to be ready before querying
  const hasAccess = useQuery(
    api.domains.guide.queries.hasGuideAccess,
    authLoaded && userId ? {} : "skip"
  );

  useEffect(() => {
    // Only redirect after we have a definitive answer
    if (hasAccess === false) {
      console.log("[GuideAccessWrapper] No access, redirecting...");
      router.push("/meu-painel/guia/assinar");
    }
  }, [hasAccess, router]);

  // Wait for Clerk auth to load
  if (!authLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span>Carregando autenticação...</span>
        </div>
      </div>
    );
  }

  // Not authenticated - should not happen due to middleware, but handle anyway
  if (!userId) {
    router.push("/sign-in");
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span>Redirecionando...</span>
        </div>
      </div>
    );
  }

  // Show loading state while checking access
  if (hasAccess === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span>Verificando acesso...</span>
        </div>
      </div>
    );
  }

  // If no access, show loading while redirecting
  if (hasAccess === false) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span>Sem acesso - redirecionando...</span>
        </div>
      </div>
    );
  }

  // User has access - show the guide content
  console.log("[GuideAccessWrapper] Access granted!");
  return <GuiaPageContent />;
}
