"use client";

import { useState } from "react";
import { Copy, Check, QrCode, Clock } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface PixPaymentDisplayProps {
  pixQrCode: string;
  pixQrCodeBase64?: string;
  amount: number;
  expiresIn?: number; // minutes
}

export function PixPaymentDisplay({
  pixQrCode,
  pixQrCodeBase64,
  amount,
  expiresIn = 30
}: PixPaymentDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pixQrCode);
      setCopied(true);
      toast.success("Código PIX copiado!", {
        description: "Cole no seu app de pagamento para pagar."
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Failed to copy PIX code:", error);
      toast.error("Erro ao copiar código", {
        description: "Tente selecionar e copiar manualmente."
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-green-500">
      <CardHeader className="bg-green-50 border-b border-green-200">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-lg">
            <QrCode className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-green-900">Pagamento PIX Gerado</CardTitle>
            <CardDescription className="text-green-700">
              Valor: <span className="font-bold text-lg">{formatCurrency(amount)}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Timer de expiração */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-yellow-900">Pague em até {expiresIn} minutos</p>
            <p className="text-sm text-yellow-700 mt-1">
              Após esse prazo, o código PIX expirará e você precisará gerar um novo.
            </p>
          </div>
        </div>

        {/* QR Code */}
        {pixQrCodeBase64 && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-gray-700">
              1. Escaneie o QR Code com seu app de pagamento:
            </p>
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
              <Image
                src={`data:image/png;base64,${pixQrCodeBase64}`}
                alt="QR Code PIX"
                width={256}
                height={256}
                className="w-64 h-64"
                unoptimized
              />
            </div>
          </div>
        )}

        {/* Código PIX */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">
            {pixQrCodeBase64 ? "2. Ou copie o código PIX:" : "Copie o código PIX:"}
          </p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <code className="flex-1 text-xs text-gray-800 break-all font-mono leading-relaxed">
                {pixQrCode}
              </code>
              <Button
                onClick={handleCopyCode}
                size="sm"
                variant={copied ? "default" : "outline"}
                className={copied ? "bg-green-500 hover:bg-green-600" : ""}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-blue-900 flex items-center gap-2">
            <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              i
            </span>
            Como pagar:
          </h4>
          <ol className="text-sm text-blue-800 space-y-2 ml-7 list-decimal">
            <li>Abra o app do seu banco ou carteira digital</li>
            <li>Procure pela opção <strong>PIX → Pagar com QR Code</strong> ou <strong>Pix Copia e Cola</strong></li>
            <li>Escaneie o QR Code acima ou cole o código copiado</li>
            <li>Confirme os dados e finalize o pagamento</li>
            <li>A confirmação é automática e instantânea!</li>
          </ol>
        </div>

        {/* Status */}
        <div className="text-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            Aguardando pagamento... A página será atualizada automaticamente após a confirmação.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
