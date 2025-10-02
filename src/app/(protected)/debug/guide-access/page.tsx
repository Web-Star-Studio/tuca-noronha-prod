"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

export default function DebugGuideAccessPage() {
  const debugInfo = useQuery(api.domains.subscriptions.queries.debugGuideAccess);
  const hasAccess = useQuery(api.domains.subscriptions.queries.hasGuideAccess);

  if (debugInfo === undefined) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Debug - Acesso ao Guia</h1>

      <Card>
        <CardHeader>
          <CardTitle>Status de Autenticação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold min-w-[200px]">Tem Identity:</span>
            {debugInfo.hasIdentity ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Sim
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-4 w-4 mr-1" />
                Não
              </Badge>
            )}
          </div>

          {debugInfo.clerkId && (
            <div className="flex items-center gap-3">
              <span className="font-semibold min-w-[200px]">Clerk ID:</span>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                {debugInfo.clerkId}
              </code>
            </div>
          )}

          {debugInfo.userRole && (
            <div className="flex items-center gap-3">
              <span className="font-semibold min-w-[200px]">Role do Usuário:</span>
              <Badge variant="outline" className="text-base">
                {debugInfo.userRole}
              </Badge>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="font-semibold min-w-[200px]">Tem Assinatura:</span>
            {debugInfo.hasSubscription ? (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Sim
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="h-4 w-4 mr-1" />
                Não
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold min-w-[200px]">hasGuideAccess (debugInfo):</span>
            {debugInfo.hasAccess ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                TEM ACESSO
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-4 w-4 mr-1" />
                SEM ACESSO
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold min-w-[200px]">hasGuideAccess (query real):</span>
            {hasAccess === undefined ? (
              <Badge variant="secondary">Carregando...</Badge>
            ) : hasAccess ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                TEM ACESSO
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-4 w-4 mr-1" />
                SEM ACESSO
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {debugInfo.userRole === "master" ? (
            <p className="text-green-600 font-semibold">
              ✅ Você é MASTER - deveria ter acesso gratuito ao guia
            </p>
          ) : (
            <p className="text-orange-600">
              ℹ️ Você não é master, verificando assinatura...
            </p>
          )}

          {!debugInfo.hasSubscription && debugInfo.userRole !== "master" && (
            <p className="text-red-600">
              ❌ Você não tem assinatura ativa e não é master
            </p>
          )}

          {debugInfo.hasAccess && (
            <p className="text-green-600 font-semibold text-lg mt-4">
              ✅ ACESSO LIBERADO - Você pode acessar /meu-painel/guia
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
