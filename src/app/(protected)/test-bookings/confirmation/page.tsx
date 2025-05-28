"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BookingConfirmation } from "@/components/bookings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const confirmationCode = searchParams.get("code") || "";
  const type = searchParams.get("type") as "activity" | "event" | "restaurant" || "activity";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Confirmação de Reserva</h1>
        <p className="text-gray-600">
          Visualize os detalhes da sua reserva
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <BookingConfirmation
          confirmationCode={confirmationCode}
          bookingType={type}
        />
      </div>

      {/* Instructions */}
      <Card className="max-w-2xl mx-auto bg-yellow-50">
        <CardHeader>
          <CardTitle>Teste a Busca por Código</CardTitle>
          <CardDescription>
            Use esta página para testar a funcionalidade de busca por código de confirmação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold">URL Parameters:</h4>
            <p className="text-sm text-gray-600">
              • <code>?code=TN123ABC</code> - Código de confirmação para buscar<br/>
              • <code>&type=activity|event|restaurant</code> - Tipo da reserva
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Exemplo:</h4>
            <p className="text-sm text-gray-600">
              <code>/test-bookings/confirmation?code=TN123ABC&type=activity</code>
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Funcionalidades:</h4>
            <p className="text-sm text-gray-600">
              • Busca automática quando há código na URL<br/>
              • Campo de busca manual quando não há código<br/>
              • Exibição completa dos detalhes da reserva<br/>
              • Botões para compartilhar e imprimir
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}