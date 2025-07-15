"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TaxaBulkActionsProps {
  selectedPartners: Id<"partners">[];
  onComplete: () => void;
}

export function TaxaBulkActions({ selectedPartners, onComplete }: TaxaBulkActionsProps) {
  const [feePercentage, setFeePercentage] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const updateFee = useMutation(api.domains.partners.mutations.updatePartnerFee);

  const handleApply = async () => {
    const fee = parseFloat(feePercentage);
    
    if (isNaN(fee) || fee < 0 || fee > 100) {
      toast({
        title: "Erro",
        description: "A taxa deve ser um valor entre 0 e 100",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Update each selected partner
      const updates = selectedPartners.map(partnerId =>
        updateFee({
          partnerId,
          feePercentage: fee,
          reason: reason.trim() || `Atualização em massa - ${selectedPartners.length} parceiros`,
        })
      );
      
      await Promise.all(updates);
      
      toast({
        title: "Taxas atualizadas",
        description: `${selectedPartners.length} parceiros tiveram suas taxas atualizadas para ${fee}%`,
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Erro ao atualizar taxas",
        description: "Não foi possível atualizar as taxas dos parceiros selecionados",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">Ações em Massa</h3>
          <p className="text-sm text-muted-foreground">
            {selectedPartners.length} parceiro(s) selecionado(s)
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={onComplete}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Esta ação irá atualizar a taxa de todos os parceiros selecionados simultaneamente.
            Esta operação não pode ser desfeita automaticamente.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-fee">Nova Taxa (%)</Label>
            <Input
              id="bulk-fee"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={feePercentage}
              onChange={(e) => setFeePercentage(e.target.value)}
              placeholder="Ex: 15"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bulk-reason">Motivo da Alteração</Label>
          <Textarea
            id="bulk-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Promoção especial, ajuste de mercado..."
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onComplete}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={!feePercentage || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aplicar Taxa
          </Button>
        </div>
      </div>
    </Card>
  );
} 