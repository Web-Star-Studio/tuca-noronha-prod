"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Mail, Key } from "lucide-react";
import { toast } from "sonner";
import { DashboardPageHeader } from "../../components";

export default function ProcessSubscriptionsPage() {
  const [email, setEmail] = useState("");
  const [preapprovalId, setPreapprovalId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const manuallyProcessSubscription = useAction(api.domains.subscriptions.actions.manuallyProcessSubscription);
  const manuallyProcessSubscriptionByEmail = useAction(api.domains.subscriptions.actions.manuallyProcessSubscriptionByEmail);

  const handleProcessByPreapprovalId = async () => {
    if (!preapprovalId.trim()) {
      toast.error("Por favor, insira o Preapproval ID");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await manuallyProcessSubscription({
        preapprovalId: preapprovalId.trim(),
      });

      setResult(response);

      if (response.success) {
        toast.success(response.message || "Assinatura processada com sucesso!");
      } else {
        toast.error(response.error || "Erro ao processar assinatura");
      }
    } catch (error) {
      console.error("Erro ao processar assinatura:", error);
      toast.error("Erro ao processar assinatura");
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessByEmail = async () => {
    if (!email.trim()) {
      toast.error("Por favor, insira o email");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await manuallyProcessSubscriptionByEmail({
        email: email.trim(),
      });

      setResult(response);

      if (response.success) {
        toast.success(response.message || "Assinatura processada com sucesso!");
      } else {
        toast.error(response.error || "Erro ao processar assinatura");
      }
    } catch (error) {
      console.error("Erro ao processar assinatura:", error);
      toast.error("Erro ao processar assinatura");
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Processar Assinaturas"
        description="Processe manualmente assinaturas de guias que não foram criadas automaticamente pelo webhook"
        icon={Key}
        iconColorClassName="text-purple-600"
        iconBgClassName="bg-purple-50"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Processar por Preapproval ID */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-600" />
              Processar por Preapproval ID
            </CardTitle>
            <CardDescription>
              Use o ID da assinatura do Mercado Pago para criar/atualizar a guideSubscription no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preapprovalId">Preapproval ID</Label>
              <Input
                id="preapprovalId"
                placeholder="Ex: 2c938084..."
                value={preapprovalId}
                onChange={(e) => setPreapprovalId(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Encontre no painel do Mercado Pago → Assinaturas
              </p>
            </div>

            <Button
              onClick={handleProcessByPreapprovalId}
              disabled={loading || !preapprovalId.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Processar Assinatura
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Processar por Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Processar por Email
            </CardTitle>
            <CardDescription>
              Busque automaticamente a assinatura pelo email do usuário
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Usuário</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Email usado na compra da assinatura
              </p>
            </div>

            <Button
              onClick={handleProcessByEmail}
              disabled={loading || !email.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Processar por Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resultado */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Sucesso
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Erro
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">
                  {result.message}
                </AlertTitle>
                {result.subscription && (
                  <AlertDescription className="text-green-800 mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <strong>Status:</strong>{" "}
                        <Badge variant={result.subscription.status === "authorized" ? "default" : "secondary"}>
                          {result.subscription.status}
                        </Badge>
                      </div>
                      <div>
                        <strong>Email:</strong> {result.subscription.userEmail}
                      </div>
                      <div>
                        <strong>Valor:</strong> R$ {result.subscription.transactionAmount?.toFixed(2)}
                      </div>
                      <div>
                        <strong>Frequência:</strong> {result.subscription.frequency} {result.subscription.frequencyType}
                      </div>
                    </div>
                  </AlertDescription>
                )}
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro ao Processar</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Encontrar o Preapproval ID</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm text-muted-foreground">
            <h4 className="font-semibold text-foreground">No Painel do Mercado Pago:</h4>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Acesse <a href="https://www.mercadopago.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">www.mercadopago.com.br</a></li>
              <li>Faça login com a conta da Tuca Noronha</li>
              <li>Vá em <strong>Assinaturas</strong> (ou Vendas → Assinaturas)</li>
              <li>Encontre a assinatura do guia</li>
              <li>Copie o <strong>ID da assinatura</strong> (Preapproval ID)</li>
              <li>Cole no campo acima e clique em &quot;Processar Assinatura&quot;</li>
            </ol>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Dica:</strong> O Preapproval ID geralmente começa com &quot;2c938084...&quot; ou formato similar.
              É diferente do Payment ID (número da transação).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
