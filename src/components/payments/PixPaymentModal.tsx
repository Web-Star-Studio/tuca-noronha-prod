"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PixPaymentDisplay } from "./PixPaymentDisplay";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pixQrCode: string;
  pixQrCodeBase64?: string;
  amount: number;
  expiresIn?: number; // minutes
  onPaymentConfirmed?: () => void;
  paymentId?: string;
  checkPaymentStatus?: (paymentId: string) => Promise<boolean>;
}

export function PixPaymentModal({
  open,
  onOpenChange,
  pixQrCode,
  pixQrCodeBase64,
  amount,
  expiresIn = 30,
  onPaymentConfirmed,
  paymentId,
  checkPaymentStatus,
}: PixPaymentModalProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(expiresIn * 60); // em segundos

  // Countdown timer
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  // Auto-check payment status
  useEffect(() => {
    if (!open || !paymentId || !checkPaymentStatus) return;

    const checkInterval = setInterval(async () => {
      try {
        setIsChecking(true);
        const isPaid = await checkPaymentStatus(paymentId);
        
        if (isPaid) {
          clearInterval(checkInterval);
          onPaymentConfirmed?.();
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento:", error);
      } finally {
        setIsChecking(false);
      }
    }, 5000); // Verifica a cada 5 segundos

    return () => clearInterval(checkInterval);
  }, [open, paymentId, checkPaymentStatus, onPaymentConfirmed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = () => {
    if (timeRemaining > 0) {
      // Avisa o usuário que o pagamento ainda está pendente
      const confirmClose = confirm(
        "O pagamento PIX ainda não foi confirmado. Tem certeza que deseja fechar?\n\n" +
        "Você ainda pode realizar o pagamento usando o código copiado."
      );
      
      if (confirmClose) {
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Previne fechar ao clicar fora se ainda houver tempo
          if (timeRemaining > 0) {
            e.preventDefault();
          }
        }}
      >
        {/* Botão de fechar customizado */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Fechar</span>
        </button>

        <DialogHeader className="pr-8">
          <DialogTitle className="text-2xl">Pagamento via PIX</DialogTitle>
          <DialogDescription>
            Complete o pagamento usando o QR Code ou código PIX abaixo
          </DialogDescription>
        </DialogHeader>

        {/* Timer de expiração visível */}
        {timeRemaining > 0 ? (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 text-center">
            <p className="text-sm font-medium">
              Tempo restante para pagamento
            </p>
            <p className="text-3xl font-bold mt-1 tabular-nums">
              {formatTime(timeRemaining)}
            </p>
          </div>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O código PIX expirou. Por favor, feche esta janela e gere um novo pagamento.
            </AlertDescription>
          </Alert>
        )}

        {/* Componente de Display PIX */}
        {timeRemaining > 0 && (
          <PixPaymentDisplay
            pixQrCode={pixQrCode}
            pixQrCodeBase64={pixQrCodeBase64}
            amount={amount}
            expiresIn={expiresIn}
          />
        )}

        {/* Indicador de verificação */}
        {isChecking && (
          <div className="text-center py-2">
            <div className="inline-flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              Verificando pagamento...
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        <div className="text-xs text-gray-500 text-center space-y-1 pt-4 border-t">
          <p>
            💡 <strong>Dica:</strong> Mantenha esta janela aberta. Ela será fechada automaticamente após a confirmação do pagamento.
          </p>
          <p>
            O pagamento via PIX é processado instantaneamente pelo Mercado Pago.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
