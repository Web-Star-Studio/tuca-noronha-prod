"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

interface TaxaPartnerModalProps {
  partnerId: Id<"partners">;
  open: boolean;
  onClose: () => void;
}

export function TaxaPartnerModal({ partnerId, open, onClose }: TaxaPartnerModalProps) {
  const partner = useQuery(api.domains.partners.queries.getPartnerById, { partnerId });
  const updateFee = useMutation(api.domains.partners.mutations.updatePartnerFee);
  
  const [feePercentage, setFeePercentage] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Initialize values when partner data loads
  useState(() => {
    if (partner) {
      setFeePercentage(partner.feePercentage.toString());
    }
  }, [partner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      await updateFee({
        partnerId,
        feePercentage: fee,
        reason: reason.trim() || undefined,
      });
      
      toast({
        title: "Taxa atualizada",
        description: `Taxa do parceiro atualizada para ${fee}%`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao atualizar taxa",
        description: "Não foi possível atualizar a taxa do parceiro",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateExample = () => {
    const fee = parseFloat(feePercentage) || 0;
    const transactionAmount = 10000; // R$ 100,00
    const stripeFee = 290 + Math.floor(transactionAmount * 0.029); // 2.9% + 29¢
    const platformFee = Math.floor(transactionAmount * (fee / 100));
    const partnerAmount = transactionAmount - platformFee - stripeFee;
    
    return {
      transaction: transactionAmount / 100,
      stripeFee: stripeFee / 100,
      platformFee: platformFee / 100,
      partnerAmount: partnerAmount / 100,
    };
  };

  const example = calculateExample();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Taxa do Parceiro</DialogTitle>
            <DialogDescription>
              {partner?.metadata?.businessName || partner?.user?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fee">Taxa da Plataforma (%)</Label>
              <Input
                id="fee"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={feePercentage}
                onChange={(e) => setFeePercentage(e.target.value)}
                placeholder="Ex: 15"
                required
              />
              <p className="text-sm text-muted-foreground">
                Taxa atual: {partner?.feePercentage}%
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Alteração (opcional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Acordo comercial especial, volume de vendas..."
                rows={3}
              />
            </div>

            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Exemplo de cálculo:</p>
                <div className="space-y-1 text-sm">
                  <p>Transação: {formatCurrency(example.transaction)}</p>
                  <p>Taxa Stripe: -{formatCurrency(example.stripeFee)} (2.9% + R$ 0,29)</p>
                  <p>Taxa Plataforma: -{formatCurrency(example.platformFee)} ({feePercentage || 0}%)</p>
                  <p className="font-medium">
                    Parceiro recebe: {formatCurrency(example.partnerAmount)}
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 