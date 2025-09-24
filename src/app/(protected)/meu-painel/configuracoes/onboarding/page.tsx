"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Handshake, LifeBuoy, ArrowLeft } from "lucide-react";

export default function PartnerOnboardingLegacyPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Handshake className="h-6 w-6 text-blue-600" />
            Habilitação de pagamentos
          </CardTitle>
          <CardDescription>
            O fluxo automático de onboarding foi descontinuado. Nosso time financeiro agora acompanha cada parceiro de perto para garantir repasses sem complicações.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle className="flex items-center gap-2 text-sm">
              <LifeBuoy className="h-4 w-4" />
              Como seguir a partir daqui
            </AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground">
              Compartilhe seus dados bancários e documentos com o suporte. Assim que tudo estiver revisado, você receberá a confirmação por e-mail e poderá acompanhar os repasses no painel financeiro.
            </AlertDescription>
          </Alert>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>• A coleta é manual para evitarmos solicitações repetitivas e garantir conformidade.</p>
            <p>• O prazo médio de habilitação é de 1 dia útil após o envio completo dos documentos.</p>
            <p>• Você pode acompanhar o status em &quot;Configurações&quot; &gt; &quot;Pagamentos&quot;.</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/contato?assunto=habilitacao-pagamentos">
                Falar com o suporte
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="mailto:financeiro@tuca.com.br">
                Enviar dados por e-mail
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        className="inline-flex items-center gap-2"
        onClick={() => router.push("/meu-painel/configuracoes")}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para configurações
      </Button>
    </div>
  );
}
