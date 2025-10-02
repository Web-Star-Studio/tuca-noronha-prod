"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Loader2 } from "lucide-react";
import GuiaPageContent from "./GuiaPageContent";

export default function GuideAccessWrapper() {
  const router = useRouter();
  const hasAccess = useQuery(api.domains.subscriptions.queries.hasGuideAccess);

  useEffect(() => {
    // Only redirect after we have a definitive answer
    if (hasAccess === false) {
      router.push("/meu-painel/guia/assinar");
    }
  }, [hasAccess, router]);

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
          <span>Redirecionando...</span>
        </div>
      </div>
    );
  }

  // User has access - show the guide content
  return <GuiaPageContent />;
}
