"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DebugVouchersPage() {
  // Buscar reservas do usuário
  const reservations = useQuery(api.domains.bookings.queries.getUserReservations);

  // Para cada reserva confirmada, buscar o voucher
  const vouchersData = reservations?.map(reservation => {
    const voucher = useQuery(
      api.domains.vouchers.queries.getVoucherByBooking,
      reservation.status === "confirmed" || reservation.status === "completed"
        ? { bookingId: reservation.id, bookingType: reservation.type as any }
        : undefined
    );
    return { reservation, voucher };
  }) || [];

  const confirmedReservations = vouchersData.filter(
    item => item.voucher && item.voucher.voucherNumber
  );

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug: Vouchers Disponíveis</h1>

        {confirmedReservations.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-500" />
                <p className="text-lg text-muted-foreground">
                  Nenhum voucher encontrado. Certifique-se de ter reservas confirmadas.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {confirmedReservations.map(({ reservation, voucher }) => (
              <Card key={reservation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{reservation.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Tipo: {reservation.type} | Código: {reservation.confirmationCode}
                      </p>
                    </div>
                    <Badge variant={reservation.status === "confirmed" ? "default" : "secondary"}>
                      {reservation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Voucher Number:</p>
                      <p className="font-mono">{voucher?.voucherNumber}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Status:</p>
                      <Badge variant={voucher?.status === "active" ? "default" : "secondary"}>
                        {voucher?.status}
                      </Badge>
                    </div>
                    <div>
                      <p className="font-semibold">Gerado em:</p>
                      <p>
                        {voucher?.generatedAt
                          ? format(new Date(voucher.generatedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold">Expira em:</p>
                      <p>
                        {voucher?.expiresAt
                          ? format(new Date(voucher.expiresAt), "dd/MM/yyyy", { locale: ptBR })
                          : "Sem expiração"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">URLs de teste:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded flex-1">
                          /voucher/{voucher?.voucherNumber}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/voucher/${voucher?.voucherNumber}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded flex-1">
                          /voucher/{reservation.confirmationCode}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/voucher/${reservation.confirmationCode}`, "_blank")}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      variant="default"
                      onClick={() => {
                        console.log("Voucher data:", voucher);
                        console.log("Reservation data:", reservation);
                      }}
                    >
                      Log no Console
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 