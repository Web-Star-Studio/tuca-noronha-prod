"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Handshake, LifeBuoy, PhoneCall, CheckCircle2, Clock, XCircle } from "lucide-react";
import { usePartner } from "@/lib/hooks/usePartner";

const statusLabels: Record<string, { label: string; tone: "default" | "secondary" | "success" | "destructive" }> = {
  pending: { label: "Configuração pendente", tone: "secondary" },
  in_progress: { label: "Em análise", tone: "default" },
  completed: { label: "Configuração concluída", tone: "success" },
  rejected: { label: "Configuração interrompida", tone: "destructive" },
};

export function PartnerOnboarding() {
  const { partner, canBePartner } = usePartner();

  if (!canBePartner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
          <CardDescription>
            Apenas contas com perfil de parceiro podem visualizar as configurações de recebimento.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (partner) {
    const statusInfo = statusLabels[partner.onboardingStatus ?? "pending"] ?? statusLabels.pending;

    return (
      <div className="space-y-4">
        <Card className="border-slate-200">
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Handshake className="h-5 w-5 text-slate-500" />
                  Recebimentos do parceiro
                </CardTitle>
                <CardDescription>
                  A habilitação é acompanhada pelo time financeiro para garantir repasses consistentes.
                </CardDescription>
              </div>
              <Badge variant={statusInfo.tone}>{statusInfo.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-700">O que você pode esperar</p>
              <ul className="mt-3 space-y-2">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Pagamentos continuam sendo processados pela plataforma com repasses automáticos.
                </li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  O dashboard financeiro permanece disponível para acompanhar saldo e transações.
                </li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Você recebe alertas sempre que novos pagamentos forem liberados.
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                Próximos passos sugeridos
              </p>
              <ol className="space-y-2 text-sm text-slate-600">
                <li>1. Envie os dados bancários e documentos solicitados para o suporte.</li>
                <li>2. Aguarde a validação — o processo leva até um dia útil após o envio completo.</li>
                <li>3. Receba a confirmação por e-mail e acompanhe os repasses no painel.</li>
              </ol>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="flex-1">
                <Link href="/contato">
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Falar com o suporte
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link href="mailto:financeiro@tuca.com.br">
                  <LifeBuoy className="mr-2 h-4 w-4" />
                  Enviar documentos por e-mail
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {partner.onboardingStatus === "rejected" && (
          <Alert variant="destructive">
            <AlertTitle className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4" />
              Revisão necessária
            </AlertTitle>
            <AlertDescription className="text-sm">
              Identificamos divergências nos dados enviados. Reenvie as informações corretas para retomarmos o processo.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Handshake className="h-5 w-5 text-slate-500" />
          Habilite os pagamentos da sua conta
        </CardTitle>
        <CardDescription>
          Coletamos os dados essenciais por atendimento para tornar o processo rápido e sem formulários longos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-700">Como funciona</p>
          <ol className="mt-2 space-y-2">
            <li>1. Compartilhe documentos e dados bancários com nossa equipe.</li>
            <li>2. Receba a confirmação por e-mail assim que o repasse estiver ativo.</li>
            <li>3. Acompanhe o saldo e as transferências no painel financeiro.</li>
          </ol>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <Link href="/contato">
              <PhoneCall className="mr-2 h-4 w-4" />
              Iniciar atendimento
            </Link>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="mailto:financeiro@tuca.com.br">
              <LifeBuoy className="mr-2 h-4 w-4" />
              Enviar dados por e-mail
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
