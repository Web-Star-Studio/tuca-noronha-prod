"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Loader2, Building, CreditCard, Bell, Shield } from "lucide-react";

export default function ConfiguracoesAdminPage() {
  const currentUser = useQuery(api.domains.users.queries.getCurrentUser);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const configSections = [
    {
      title: "Configurações da Empresa",
      description: "Gerencie informações da empresa e configurações gerais",
      icon: Building,
      action: () => console.log("Empresa"),
    },
    {
      title: "Configurações de Pagamento",
      description: "Configure taxas, moedas e métodos de pagamento",
      icon: CreditCard,
      action: () => console.log("Pagamento"),
    },
    {
      title: "Notificações",
      description: "Configure notificações por email e SMS",
      icon: Bell,
      action: () => console.log("Notificações"),
    },
    {
      title: "Segurança",
      description: "Gerencie configurações de segurança e acesso",
      icon: Shield,
      action: () => console.log("Segurança"),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações gerais do sistema
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {configSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card 
              key={section.title} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={section.action}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>
            Detalhes sobre a versão e status do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Versão do Sistema</p>
              <p className="font-medium">1.0.0</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Última Atualização</p>
              <p className="font-medium">17 de Julho de 2025</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status do Banco de Dados</p>
              <p className="font-medium text-green-600">Conectado</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status de Pagamentos</p>
              <p className="font-medium text-green-600">Operacional</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
