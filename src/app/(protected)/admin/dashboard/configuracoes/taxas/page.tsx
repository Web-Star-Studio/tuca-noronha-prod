"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { TaxasPartnersList } from "./components/TaxasPartnersList";
import { TaxaHistoryDrawer } from "./components/TaxaHistoryDrawer";
import { TaxaBulkActions } from "./components/TaxaBulkActions";
import { PartnerTransactionsList } from "./components/PartnerTransactionsList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Percent, History, Download, Upload, Receipt } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function TaxasPage() {
  const [selectedPartners, setSelectedPartners] = useState<Id<"partners">[]>([]);
  const [historyPartnerId, setHistoryPartnerId] = useState<Id<"partners"> | null>(null);
  const partners = useQuery(api.domains.partners.queries.listPartners);

  const activePartners = partners?.filter(p => p.isActive && p.onboardingStatus === "completed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Taxas de Parceiros</h1>
          <p className="text-muted-foreground">
            Configure as taxas individuais para cada parceiro da plataforma
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          As taxas configuradas aqui determinam a porcentagem que a plataforma retém de cada transação. 
          O valor restante (menos as taxas do Stripe) é transferido automaticamente para o parceiro.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Parceiros Ativos
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePartners?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              com taxas configuradas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa Média
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activePartners && activePartners.length > 0
                ? (activePartners.reduce((sum, p) => sum + p.feePercentage, 0) / activePartners.length).toFixed(1)
                : "0"}%
            </div>
            <p className="text-xs text-muted-foreground">
              da plataforma
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa Padrão
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15%</div>
            <p className="text-xs text-muted-foreground">
              para novos parceiros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="partners" className="space-y-6">
        <TabsList>
          <TabsTrigger value="partners">
            <Percent className="h-4 w-4 mr-2" />
            Taxas por Parceiro
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Receipt className="h-4 w-4 mr-2" />
            Transações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="space-y-6">
          {/* Bulk Actions */}
          {selectedPartners.length > 0 && (
            <TaxaBulkActions
              selectedPartners={selectedPartners}
              onComplete={() => setSelectedPartners([])}
            />
          )}

          {/* Partners List */}
          <TaxasPartnersList
            selectedPartners={selectedPartners}
            onSelectionChange={setSelectedPartners}
            onViewHistory={setHistoryPartnerId}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <PartnerTransactionsList />
        </TabsContent>
      </Tabs>

      {/* History Drawer */}
      {historyPartnerId && (
        <TaxaHistoryDrawer
          partnerId={historyPartnerId}
          open={!!historyPartnerId}
          onClose={() => setHistoryPartnerId(null)}
        />
      )}
    </div>
  );
} 