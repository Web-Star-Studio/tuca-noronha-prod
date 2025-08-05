"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, QrCode, AlertCircle, CheckCircle, X } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";


interface VoucherScannerProps {
  partnerId: string;
  onScanSuccess?: (voucher: any) => void;
  onScanError?: (error: string) => void;
}

export function VoucherScanner({ partnerId, onScanSuccess, onScanError }: VoucherScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualVoucherNumber, setManualVoucherNumber] = useState("");
  const [scannedVoucher, setScannedVoucher] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const verifyVoucher = useMutation(api.domains.vouchers.mutations.useVoucher);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(handleScanSuccess, onScanFailure);
      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear();
          scannerRef.current = null;
        }
      };
    }
  }, [isScanning]);

  const handleScanSuccess = async (decodedText: string) => {
    setIsScanning(false);
    setIsVerifying(true);
    setScanError(null);

    try {
      // Parse QR code data
      const qrData = JSON.parse(decodedText);
      
      if (!qrData.n || !qrData.tk) {
        throw new Error("QR code inválido");
      }

      // Verify voucher with the verification token
      await handleVoucherVerification(qrData.tk);
      
    } catch {
      const errorMessage = error instanceof Error ? error.message : "Erro ao verificar voucher";
      setScanError(errorMessage);
      onScanError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const onScanFailure = (error: string) => {
    // Ignore continuous scan failures, only show if it's a significant error
    if (error.includes("NotFoundException") || error.includes("NotFoundError")) {
      return; // Common when no QR code is in view
    }
    setScanError(`Erro na leitura: ${error}`);
  };

  const handleManualVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualVoucherNumber.trim()) {
      toast.error("Digite o número do voucher");
      return;
    }

    setIsVerifying(true);
    setScanError(null);

    try {
      // For manual input, we'll use the voucher number directly
      await handleVoucherVerification(manualVoucherNumber.trim());
    } catch {
      const errorMessage = error instanceof Error ? error.message : "Erro ao verificar voucher";
      setScanError(errorMessage);
      onScanError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVoucherVerification = async (voucherIdentifier: string) => {
    try {
      const result = await verifyVoucher({
        voucherId: voucherIdentifier, // This might need to be adjusted based on the actual API
        partnerId,
        usageNotes: "Verificado via scanner QR"
      });

      setScannedVoucher(result);
      onScanSuccess?.(result);
      toast.success("Voucher verificado com sucesso!");
      
    } catch {
      throw error;
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setScannedVoucher(null);
    setScanError(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
  };

  const resetScanner = () => {
    setScannedVoucher(null);
    setScanError(null);
    setManualVoucherNumber("");
    stopScanning();
  };

  return (
    <div className="space-y-6">
      {/* Scanner Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Verificar Voucher
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={startScanning}
              disabled={isScanning || isVerifying}
              className="flex-1"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Escaneando...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Escanear QR Code
                </>
              )}
            </Button>
            
            {isScanning && (
              <Button onClick={stopScanning} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Parar
              </Button>
            )}
          </div>

          {/* Manual Input */}
          <div className="border-t pt-4">
            <form onSubmit={handleManualVerification} className="space-y-3">
              <div>
                <Label htmlFor="voucherNumber">Ou digite o número do voucher</Label>
                <Input
                  id="voucherNumber"
                  type="text"
                  placeholder="Ex: VCH-20250108-1234"
                  value={manualVoucherNumber}
                  onChange={(e) => setManualVoucherNumber(e.target.value)}
                  disabled={isVerifying}
                />
              </div>
              <Button 
                type="submit" 
                variant="outline" 
                disabled={isVerifying || !manualVoucherNumber.trim()}
                className="w-full"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  "Verificar Voucher"
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Scanner */}
      {isScanning && (
        <Card>
          <CardHeader>
            <CardTitle>Escaneie o QR Code do Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <div id="qr-reader" className="w-full"></div>
            <p className="text-sm text-gray-600 mt-2 text-center">
              Posicione o QR code do voucher na área destacada
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {scanError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{scanError}</AlertDescription>
        </Alert>
      )}

      {/* Verification Result */}
      {scannedVoucher && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Voucher Verificado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Número do Voucher</Label>
                <p className="text-lg font-mono">{scannedVoucher.voucherNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant={scannedVoucher.status === "used" ? "default" : "secondary"}>
                  {scannedVoucher.status === "used" ? "Utilizado" : "Ativo"}
                </Badge>
              </div>
            </div>

            {scannedVoucher.booking && (
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Detalhes da Reserva</Label>
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>Serviço:</strong> {scannedVoucher.booking.assetName}</p>
                  <p><strong>Cliente:</strong> {scannedVoucher.booking.customerName}</p>
                  <p><strong>Data:</strong> {new Date(scannedVoucher.booking.date).toLocaleDateString("pt-BR")}</p>
                  {scannedVoucher.booking.participants && (
                    <p><strong>Participantes:</strong> {scannedVoucher.booking.participants}</p>
                  )}
                </div>
              </div>
            )}

            <Button onClick={resetScanner} variant="outline" className="w-full">
              Escanear Outro Voucher
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}