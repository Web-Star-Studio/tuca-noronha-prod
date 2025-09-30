"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { TaxasPartnersList } from "./components/TaxasPartnersList";
import { TaxaHistoryDrawer } from "./components/TaxaHistoryDrawer";
import { TaxaBulkActions } from "./components/TaxaBulkActions";
import { PartnerTransactionsList } from "./components/PartnerTransactionsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Percent, Download, Upload, Receipt, Edit } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function TaxasPage() {
  const [selectedPartners, setSelectedPartners] = useState<Id<"partners">[]>([]);
  const [historyPartnerId, setHistoryPartnerId] = useState<Id<"partners"> | null>(null);
  const [isEditingDefaultFee, setIsEditingDefaultFee] = useState(false);
  const [newDefaultFee, setNewDefaultFee] = useState("");
  
  const partners = useQuery(api.domains.partners.queries.listPartners);
  const defaultFeePercentage = useQuery(api.domains.systemSettings.queries.getDefaultPartnerFee);
  const updateDefaultFee = useMutation(api.domains.systemSettings.mutations.updateDefaultPartnerFee);

  const activePartners = partners?.filter(p => p.isActive && p.onboardingStatus === "completed");

  const handleUpdateDefaultFee = async () => {
    const fee = parseFloat(newDefaultFee);
    
    if (isNaN(fee) || fee < 0 || fee > 100) {
      toast({
        title: "Erro",
        description: "A taxa deve ser um valor entre 0 e 100",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateDefaultFee({ feePercentage: fee });
      toast({
        title: "Taxa padrão atualizada",
        description: `Taxa padrão para novos parceiros atualizada para ${fee}%`,
      });
      setIsEditingDefaultFee(false);
      setNewDefaultFee("");
    } catch {
      toast({
        title: "Erro ao atualizar taxa padrão",
        description: "Não foi possível atualizar a taxa padrão",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
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
          O valor restante (menos as taxas do provedor de pagamento) é transferido automaticamente para o parceiro.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
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
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
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
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">
              Taxa Padrão
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setNewDefaultFee(defaultFeePercentage?.toString() || "15");
                setIsEditingDefaultFee(true);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaultFeePercentage || 15}%</div>
            <p className="text-xs text-muted-foreground">
              para novos parceiros
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="partners" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
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

      {/* Edit Default Fee Dialog */}
      <Dialog open={isEditingDefaultFee} onOpenChange={setIsEditingDefaultFee}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Taxa Padrão</DialogTitle>
            <DialogDescription>
              Configure a taxa padrão que será aplicada automaticamente a novos parceiros.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultFee">Taxa Padrão (%)</Label>
              <Input
                id="defaultFee"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={newDefaultFee}
                onChange={(e) => setNewDefaultFee(e.target.value)}
                placeholder="Ex: 15"
              />
              <p className="text-sm text-muted-foreground">
                Esta taxa será aplicada automaticamente quando um novo parceiro for cadastrado.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingDefaultFee(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateDefaultFee}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
