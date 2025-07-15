"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PartnerOnboarding } from "@/components/partners/PartnerOnboarding";
import { usePartner } from "@/lib/hooks/usePartner";
import { 
  CreditCard, 
  BarChart3, 
  Settings,
  Receipt,
  FileText
} from "lucide-react";

export default function ConfiguracoesPage() {
  const { partner, canBePartner } = usePartner();

  // Se não é partner, mostrar apenas configurações gerais
  if (!canBePartner) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas configurações pessoais
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>
              Configure suas preferências e informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Funcionalidade em desenvolvimento...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas configurações e conta de parceiro
        </p>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Pagamentos</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Faturas</span>
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          <PartnerOnboarding />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Financeiros</CardTitle>
              <CardDescription>
                Visualize e exporte seus relatórios de vendas e pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {partner?.onboardingStatus === "completed" ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Funcionalidade de relatórios em desenvolvimento...
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete o onboarding para acessar seus relatórios financeiros.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Faturas e Recibos</CardTitle>
              <CardDescription>
                Acesse suas faturas e comprovantes de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {partner?.onboardingStatus === "completed" ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Funcionalidade de faturas em desenvolvimento...
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Complete o onboarding para acessar suas faturas.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure suas preferências e informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Informações da Conta */}
                {partner && (
                  <div className="border rounded-lg p-4 space-y-2">
                    <h4 className="font-medium">Informações da Conta de Parceiro</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID Stripe:</span>
                        <span className="font-mono text-xs">{partner.stripeAccountId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">País:</span>
                        <span>{partner.metadata.country}</span>
                      </div>
                      {partner.metadata.businessName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Empresa:</span>
                          <span>{partner.metadata.businessName}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxa da Plataforma:</span>
                        <span className="font-medium">{partner.feePercentage}%</span>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  Outras configurações em desenvolvimento...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 