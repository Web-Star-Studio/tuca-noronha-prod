"use client";

/**
 * ⚠️ DEPRECATED PAGE
 * This page is for the old subscription model that is NO LONGER IN USE.
 * Guide now uses one-time purchase instead of recurring subscriptions.
 * 
 * Kept only for users who may have old bookmarks or links.
 * Redirects to the purchase page or shows deprecation notice.
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Loader2, AlertCircle, Key, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ActivateSubscriptionPage() {
  const router = useRouter();
  const { user } = useUser();
  const [processing, setProcessing] = useState(false);
  const [preapprovalId, setPreapprovalId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [showLegacyForm, setShowLegacyForm] = useState(false);
  
  // Check if user already has access
  const hasAccess = useQuery(api.domains.guide.queries.hasGuideAccess);
  
  // ⚠️ DEPRECATED: Only used for legacy subscription migration
  const processSubscription = useAction(api.domains.subscriptions.actions.manuallyProcessSubscription);

  // Redirect if user already has access
  useEffect(() => {
    if (hasAccess === true) {
      router.push("/meu-painel/guia");
    }
  }, [hasAccess, router]);

  const handleActivate = async () => {
    if (!preapprovalId.trim()) {
      toast.error("Digite o Preapproval ID da sua assinatura");
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      console.log("🔄 Processando assinatura:", preapprovalId.trim());
      
      const res = await processSubscription({
        preapprovalId: preapprovalId.trim(),
      });

      console.log("📥 Resultado:", res);
      setResult(res);

      if (res.success) {
        toast.success("🎉 Assinatura ativada com sucesso!", {
          description: "Redirecionando para o painel do guia...",
          duration: 3000,
        });
        
        setTimeout(() => {
          router.push("/meu-painel/guia");
        }, 2000);
      } else {
        toast.error("❌ Erro ao ativar assinatura", {
          description: res.error || "Verifique o Preapproval ID e tente novamente",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("❌ Erro:", error);
      toast.error("❌ Erro ao processar", {
        description: String(error),
        duration: 5000,
      });
      setResult({ success: false, error: String(error) });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white py-16 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Deprecation Notice */}
        <Alert className="bg-amber-50 border-amber-300 border-2">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <AlertTitle className="text-amber-900 font-bold text-lg">
            ⚠️ Sistema Atualizado
          </AlertTitle>
          <AlertDescription className="text-amber-800 space-y-3">
            <p className="font-semibold">
              O sistema de assinaturas foi substituído por <strong>compra única</strong>.
            </p>
            <p>
              Se você ainda não comprou o guia, clique no botão abaixo para fazer a compra (pagamento único de R$ 99,90).
            </p>
            <Button 
              onClick={() => router.push("/meu-painel/guia/assinar")}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
            >
              Ir para Página de Compra
            </Button>
            <hr className="border-amber-300" />
            <p className="text-sm">
              Se você tinha uma <strong>assinatura antiga</strong> e precisa migrar, clique abaixo:
            </p>
            <Button 
              onClick={() => setShowLegacyForm(true)}
              variant="outline"
              className="w-full border-amber-400 text-amber-900 hover:bg-amber-100"
            >
              Tenho uma assinatura antiga (Preapproval ID)
            </Button>
          </AlertDescription>
        </Alert>

        {!showLegacyForm && (
          <div className="text-center space-y-4 opacity-60">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              Sistema de Assinaturas (Descontinuado)
            </h1>
            <p className="text-lg text-gray-600">
              Esta página não é mais necessária. Use a compra única acima.
            </p>
          </div>
        )}

        {showLegacyForm && (
          <>
            {/* Header */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                Migrar Assinatura Antiga
              </h1>
              <p className="text-lg text-gray-600">
                Use esta opção apenas se você tinha uma assinatura do modelo antigo.
              </p>
            </div>

        {/* User Info */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900 font-semibold">
            Seus dados
          </AlertTitle>
          <AlertDescription className="text-blue-800 space-y-1">
            <p><strong>Email:</strong> {user?.primaryEmailAddress?.emailAddress}</p>
            <p><strong>User ID:</strong> <code className="text-xs bg-blue-100 px-2 py-1 rounded">{user?.id}</code></p>
          </AlertDescription>
        </Alert>

        {/* Instructions */}
        <Card className="shadow-lg border-2 border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Como encontrar o Preapproval ID</CardTitle>
                <CardDescription className="text-base">
                  Siga o passo a passo abaixo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm space-y-3">
                <p className="font-semibold text-gray-900">📋 Passo a passo:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Acesse <a href="https://www.mercadopago.com.br" target="_blank" className="text-blue-600 underline">mercadopago.com.br</a> e faça login</li>
                  <li>Vá em <strong>Vendas → Assinaturas</strong></li>
                  <li>Encontre sua assinatura de <strong>R$ 99,90 anual</strong></li>
                  <li>Clique na assinatura para ver os detalhes</li>
                  <li>Copie o <strong>Preapproval ID</strong> (geralmente aparece na URL ou nos detalhes)</li>
                  <li>Cole abaixo e clique em &quot;Ativar Assinatura&quot;</li>
                </ol>
                
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    <strong>💡 Dica:</strong> O Preapproval ID geralmente é um código longo com letras e números, 
                    algo como: <code className="bg-amber-100 px-1">2c938084726fca8a0172890000000000</code>
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label htmlFor="preapprovalId" className="text-base font-semibold">
                Cole o Preapproval ID aqui:
              </Label>
              <Input
                id="preapprovalId"
                placeholder="Ex: 2c938084726fca8a0172890000000000"
                value={preapprovalId}
                onChange={(e) => setPreapprovalId(e.target.value)}
                className="font-mono text-base h-12"
                disabled={processing}
              />
              <p className="text-xs text-gray-500">
                O ID é um código alfanumérico fornecido pelo Mercado Pago
              </p>
            </div>

            <Button
              onClick={handleActivate}
              disabled={processing || !preapprovalId.trim()}
              className="w-full py-6 text-lg"
              size="lg"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-6 w-6" />
                  Ativar Assinatura
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result Display */}
        {result && (
          <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
            {result.success ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-900 font-semibold">
                  ✅ Sucesso!
                </AlertTitle>
                <AlertDescription className="text-green-800">
                  <p>{result.message}</p>
                  <p className="mt-2 text-sm">Redirecionando para o painel do guia...</p>
                </AlertDescription>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-red-900 font-semibold">
                  ❌ Erro ao ativar
                </AlertTitle>
                <AlertDescription className="text-red-800 whitespace-pre-wrap">
                  {result.error}
                </AlertDescription>
              </>
            )}
          </Alert>
        )}

        {/* Help Section */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">❓ Ainda com problemas?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Verifique se o pagamento foi aprovado no Mercado Pago</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Confira se copiou o Preapproval ID corretamente (sem espaços extras)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>Entre em contato com nosso suporte se o erro persistir</span>
              </li>
            </ul>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  );
}
