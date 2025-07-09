"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, QrCode, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { VoucherScanner } from "@/components/vouchers/VoucherScanner";
import { toast } from "sonner";
import Link from "next/link";

export default function VoucherScannerPage() {
  const { user } = useUser();
  const [scannedVoucher, setScannedVoucher] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Get current user data
  const currentUser = useQuery(api.domains.users.queries.getCurrentUser);

  const handleScanSuccess = (voucher: any) => {
    setScannedVoucher(voucher);
    setScanError(null);
    toast.success("Voucher verificado com sucesso!");
  };

  const handleScanError = (error: string) => {
    setScanError(error);
    setScannedVoucher(null);
    toast.error(error);
  };

  const resetScanner = () => {
    setScannedVoucher(null);
    setScanError(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
      case "used":
        return <Badge variant="secondary">Utilizado</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirado</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/dashboard/vouchers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Scanner de Vouchers</h1>
            <p className="text-gray-600">Verifique vouchers usando QR Code ou entrada manual</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600">
            {currentUser.role === "master" ? "Master Admin" : "Partner"}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {scanError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{scanError}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {scannedVoucher && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Voucher verificado com sucesso! Detalhes exibidos abaixo.
          </AlertDescription>
        </Alert>
      )}

      {/* Scanner Component */}
      <VoucherScanner
        partnerId={currentUser._id}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />

      {/* Scanned Voucher Details */}
      {scannedVoucher && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Detalhes do Voucher Verificado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Voucher Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700">Número do Voucher</h3>
                <p className="text-xl font-mono text-blue-600">{scannedVoucher.voucherNumber}</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Status</h3>
                <div className="mt-1">{getStatusBadge(scannedVoucher.status)}</div>
              </div>
            </div>

            {/* Customer Info */}
            {scannedVoucher.customer && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Nome:</span>
                    <p className="font-medium">{scannedVoucher.customer.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <p className="font-medium">{scannedVoucher.customer.email}</p>
                  </div>
                  {scannedVoucher.customer.phone && (
                    <div>
                      <span className="text-sm text-gray-600">Telefone:</span>
                      <p className="font-medium">{scannedVoucher.customer.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking Details */}
            {scannedVoucher.booking && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Detalhes da Reserva</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Serviço:</span>
                    <p className="font-medium">{scannedVoucher.booking.assetName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Data:</span>
                    <p className="font-medium">
                      {new Date(scannedVoucher.booking.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  {scannedVoucher.booking.time && (
                    <div>
                      <span className="text-sm text-gray-600">Horário:</span>
                      <p className="font-medium">{scannedVoucher.booking.time}</p>
                    </div>
                  )}
                  {scannedVoucher.booking.participants && (
                    <div>
                      <span className="text-sm text-gray-600">Participantes:</span>
                      <p className="font-medium">{scannedVoucher.booking.participants}</p>
                    </div>
                  )}
                  {scannedVoucher.booking.totalPrice && (
                    <div>
                      <span className="text-sm text-gray-600">Valor Total:</span>
                      <p className="font-medium text-green-600">
                        R$ {scannedVoucher.booking.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Asset Info */}
            {scannedVoucher.asset && (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-700 mb-2">Informações do Serviço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">Nome:</span>
                    <p className="font-medium">{scannedVoucher.asset.name}</p>
                  </div>
                  {scannedVoucher.asset.address && (
                    <div>
                      <span className="text-sm text-gray-600">Endereço:</span>
                      <p className="font-medium">{scannedVoucher.asset.address}</p>
                    </div>
                  )}
                  {scannedVoucher.asset.phone && (
                    <div>
                      <span className="text-sm text-gray-600">Telefone:</span>
                      <p className="font-medium">{scannedVoucher.asset.phone}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Voucher Dates */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-700 mb-2">Datas do Voucher</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Gerado em:</span>
                  <p className="font-medium">{formatDate(scannedVoucher.generatedAt)}</p>
                </div>
                {scannedVoucher.expiresAt && (
                  <div>
                    <span className="text-sm text-gray-600">Expira em:</span>
                    <p className="font-medium">{formatDate(scannedVoucher.expiresAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-4 flex gap-3">
              <Button onClick={resetScanner} variant="outline" className="flex-1">
                Escanear Outro Voucher
              </Button>
              <Button asChild variant="default">
                <Link href="/admin/dashboard/vouchers">
                  Ir para Lista de Vouchers
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}