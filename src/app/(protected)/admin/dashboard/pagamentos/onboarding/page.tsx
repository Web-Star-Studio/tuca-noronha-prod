"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function OnboardingCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const refresh = searchParams.get("refresh") === "true";

  useEffect(() => {
    if (success) {
      toast.success("Onboarding concluído com sucesso!");
      setTimeout(() => {
        router.push("/admin/dashboard/pagamentos");
      }, 2000);
    } else if (refresh) {
      toast.info("Sessão expirada. Retorne à página de pagamentos para gerar um novo link.");
      setTimeout(() => {
        router.push("/admin/dashboard/pagamentos");
      }, 3000);
    }
  }, [success, refresh, router]);

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>
            {success ? "Onboarding Concluído" : refresh ? "Sessão Expirada" : "Processando..."}
          </CardTitle>
          <CardDescription>
            {success 
              ? "Sua conta foi configurada com sucesso"
              : refresh
              ? "Você precisa gerar um novo link de onboarding"
              : "Aguarde enquanto processamos suas informações"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          {success ? (
            <CheckCircle className="h-16 w-16 text-green-500" />
          ) : refresh ? (
            <XCircle className="h-16 w-16 text-yellow-500" />
          ) : (
            <Loader2 className="h-16 w-16 animate-spin text-muted-foreground" />
          )}
        </CardContent>
      </Card>
    </div>
  );
} 