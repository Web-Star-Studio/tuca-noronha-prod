"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, QrCode, AlertCircle, CheckCircle, X, Search, User, Calendar, MapPin, Camera } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../../../convex/_generated/dataModel";

interface VoucherScannerProps {
  partnerId: Id<"users">;
  onScanSuccess?: (voucher: any) => void;
  onScanError?: (error: string) => void;
}

export function VoucherScannerEnhanced({ partnerId, onScanSuccess, onScanError }: VoucherScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualVoucherNumber, setManualVoucherNumber] = useState("");
  const [scannedVoucher, setScannedVoucher] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("qr");
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Use the new verification actions
  const verifyQRToken = useAction(api.domains.vouchers.actions.verifyQRToken);
  const manualVoucherLookup = useAction(api.domains.vouchers.actions.manualVoucherLookup);
  const useVoucherByQR = useAction(api.domains.vouchers.mutations.useVoucherByQR);

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader-enhanced",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
          defaultZoomValueIfSupported: 1,
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
      // Get IP address and user agent for logging
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown');
      
      const userAgent = navigator.userAgent;

      // Verify QR token using the new action
      const result = await verifyQRToken({
        qrContent: decodedText,
        partnerId,
        ipAddress,
        userAgent,
      });

      if (result.success) {
        setScannedVoucher(result);
        onScanSuccess?.(result);
        toast.success("Voucher verificado com sucesso!");
      } else {
        throw new Error(result.error || "QR Code inválido");
      }
      
    } catch (error) {
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
      // Get IP address and user agent for logging
      const ipAddress = await fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => data.ip)
        .catch(() => 'unknown');
      
      const userAgent = navigator.userAgent;

      // Manual voucher lookup using the new action
      const result = await manualVoucherLookup({
        voucherNumber: manualVoucherNumber.trim(),
        partnerId,
        ipAddress,
        userAgent,
      });

      if (result.success) {
        setScannedVoucher(result);
        onScanSuccess?.(result);
        toast.success("Voucher encontrado com sucesso!");
      } else {
        throw new Error(result.error || "Voucher não encontrado");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao verificar voucher";
      setScanError(errorMessage);
      onScanError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUseVoucher = async () => {
    if (!scannedVoucher?.voucher?.voucherNumber) return;

    setIsVerifying(true);
    setScanError(null);

    try {
      const result = await useVoucherByQR({
        voucherNumber: scannedVoucher.voucher.voucherNumber,
        partnerId,
        usageNotes: "Usado via scanner QR",
        location: "Scanner móvel",
        ipAddress: await fetch('https://api.ipify.org?format=json')
          .then(res => res.json())
          .then(data => data.ip)
          .catch(() => 'unknown'),
        userAgent: navigator.userAgent,
      });

      if (result.success) {
        setScannedVoucher({
          ...scannedVoucher,
          voucher: {
            ...scannedVoucher.voucher,
            status: "used",
          },
        });
        toast.success("Voucher usado com sucesso!");
      } else {
        throw new Error(result.error || "Erro ao usar voucher");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao usar voucher";
      setScanError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "used":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      case "expired":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "used":
        return "Usado";
      case "cancelled":
        return "Cancelado";
      case "expired":
        return "Expirado";
      default:
        return "Desconhecido";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              <form onSubmit={handleManualVerification} className="space-y-3">
                <div>
                  <Label htmlFor="voucherNumber">Número do voucher</Label>
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
                  disabled={isVerifying || !manualVoucherNumber.trim()}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Verificar Voucher
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* QR Code Scanner */}
      {isScanning && (
        <Card>
          <CardHeader>
            <CardTitle>Escaneie o QR Code do Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <div id="qr-reader-enhanced" className="w-full max-w-md mx-auto rounded-lg overflow-hidden"></div>
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
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Voucher Verificado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Número do Voucher</Label>
                  <Badge variant="outline" className={getStatusColor(scannedVoucher.voucher?.status || "")}>
                    {getStatusLabel(scannedVoucher.voucher?.status || "")}
                  </Badge>
                </div>
                <p className="text-sm font-mono bg-white p-2 rounded border">
                  {scannedVoucher.voucher?.voucherNumber}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Pode ser usado?</Label>
                <div className="flex items-center gap-2">
                  {scannedVoucher.verification?.canUse ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm ${scannedVoucher.verification?.canUse ? 'text-green-600' : 'text-red-600'}`}>
                    {scannedVoucher.verification?.canUse ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </div>

            {scannedVoucher.voucher && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Cliente
                    </Label>
                    <div className="bg-white p-3 rounded border space-y-1">
                      <p className="font-medium">{scannedVoucher.voucher.customer?.name}</p>
                      <p className="text-sm text-gray-600">{scannedVoucher.voucher.customer?.email}</p>
                      <p className="text-sm text-gray-600">{scannedVoucher.voucher.customer?.phone}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Serviço
                    </Label>
                    <div className="bg-white p-3 rounded border space-y-1">
                      <p className="font-medium">{scannedVoucher.voucher.asset?.name}</p>
                      <p className="text-sm text-gray-600">{scannedVoucher.voucher.asset?.location}</p>
                      <Badge variant="secondary">{scannedVoucher.voucher.asset?.type}</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Detalhes da Reserva
                  </Label>
                  <div className="bg-white p-3 rounded border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Confirmação</p>
                        <p className="text-sm text-gray-600">{scannedVoucher.voucher.booking?.confirmationCode}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Data</p>
                        <p className="text-sm text-gray-600">
                          {scannedVoucher.voucher.booking?.date ? formatDate(scannedVoucher.voucher.booking.date) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Participantes</p>
                        <p className="text-sm text-gray-600">{scannedVoucher.voucher.booking?.participants || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {scannedVoucher.verification?.canUse && scannedVoucher.voucher.status === "active" && (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUseVoucher}
                      disabled={isVerifying}
                      className="flex-1"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Usar Voucher
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={resetScanner}
                      variant="outline"
                      disabled={isVerifying}
                    >
                      Novo Scan
                    </Button>
                  </div>
                )}

                {!scannedVoucher.verification?.canUse && (
                  <Button
                    onClick={resetScanner}
                    variant="outline"
                    disabled={isVerifying}
                    className="w-full"
                  >
                    Novo Scan
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}