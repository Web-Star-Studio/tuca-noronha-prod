"use client";

import { useState } from "react";
import { useMutation } from "convex/react";  
import { api } from "../../../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  Edit3, 
  Trash2, 
  Users, 
  Percent,
  AlertTriangle 
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface TaxaBulkActionsProps {
  selectedPartners: Id<"partners">[];
  onComplete: () => void;
}

export function TaxaBulkActions({ selectedPartners, onComplete }: TaxaBulkActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [bulkTaxaPercentage, setBulkTaxaPercentage] = useState("");
  const [bulkReason, setBulkReason] = useState("");
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Mutations for bulk actions
  const updatePartnerTaxa = useMutation(api.domains.partners.mutations.updatePartnerTaxa);
  const deactivatePartners = useMutation(api.domains.partners.mutations.deactivateMultiplePartners);

  const handleBulkUpdateTaxa = async () => {
    if (!bulkTaxaPercentage.trim()) {
      toast.error("Por favor, insira uma taxa válida");
      return;
    }

    const taxaValue = parseFloat(bulkTaxaPercentage);
    if (isNaN(taxaValue) || taxaValue < 0 || taxaValue > 100) {
      toast.error("A taxa deve ser um número entre 0 e 100");
      return;
    }

    setIsUpdating(true);
    try {
      // Update taxa for each selected partner
      await Promise.all(
        selectedPartners.map(partnerId =>
          updatePartnerTaxa({
            partnerId,
            taxaPercentage: taxaValue,
            reason: bulkReason.trim() || `Atualização em lote - ${new Date().toLocaleDateString()}`
          })
        )
      );

      toast.success(`Taxa atualizada para ${selectedPartners.length} parceiro(s)`);
      setBulkTaxaPercentage("");
      setBulkReason("");
      setShowUpdateDialog(false);
      onComplete();
    } catch (error) {
      console.error("Error updating taxa:", error);
      toast.error("Erro ao atualizar taxas");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDeactivate = async () => {
    setIsUpdating(true);
    try {
      await deactivatePartners({ partnerIds: selectedPartners });
      toast.success(`${selectedPartners.length} parceiro(s) desativado(s)`);
      setShowDeleteDialog(false);
      onComplete();
    } catch (error) {
      console.error("Error deactivating partners:", error);
      toast.error("Erro ao desativar parceiros");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Users className="h-4 w-4" />
          Ações em Lote
          <Badge variant="secondary" className="ml-2">
            {selectedPartners.length} selecionado(s)
          </Badge>
        </CardTitle>
        <CardDescription className="text-orange-700">
          Gerencie múltiplos parceiros simultaneamente
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {/* Update Taxa Dialog */}
          <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Percent className="h-4 w-4" />
                Atualizar Taxa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atualizar Taxa em Lote</DialogTitle>
                <DialogDescription>
                  Alterar a taxa para {selectedPartners.length} parceiro(s) selecionado(s)
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="bulkTaxa">Nova Taxa (%)</Label>
                  <Input
                    id="bulkTaxa"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Ex: 15.5"
                    value={bulkTaxaPercentage}
                    onChange={(e) => setBulkTaxaPercentage(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulkReason">Motivo da Alteração</Label>
                  <Textarea
                    id="bulkReason"
                    placeholder="Descreva o motivo da alteração da taxa..."
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowUpdateDialog(false)}
                  disabled={isUpdating}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleBulkUpdateTaxa}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  {isUpdating ? "Atualizando..." : "Atualizar Taxa"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Bulk Deactivate Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
                Desativar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Confirmar Desativação em Lote
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Você está prestes a desativar <strong>{selectedPartners.length} parceiro(s)</strong>.
                  Essa ação pode ser revertida posteriormente através da reativação individual.
                  
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ⚠️ Parceiros desativados não poderão receber novas reservas.
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isUpdating}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkDeactivate}
                  disabled={isUpdating}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isUpdating ? "Desativando..." : "Desativar Parceiros"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Clear Selection Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onComplete}
            className="text-muted-foreground hover:text-foreground"
          >
            Limpar Seleção
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}