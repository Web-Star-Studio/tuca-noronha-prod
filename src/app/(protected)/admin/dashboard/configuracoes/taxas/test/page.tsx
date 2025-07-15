"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAction } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { toast } from "@/hooks/use-toast";

export default function TestDirectChargesPage() {
  const [loading, setLoading] = useState(false);
  const createCheckoutSession = useAction(api.domains.stripe.actions.createCheckoutSession);

  const handleTestCheckout = async () => {
    try {
      setLoading(true);

      // Create a test checkout session
      const result = await createCheckoutSession({
        bookingId: "test-booking-123",
        assetType: "activity",
        successUrl: `${window.location.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/booking/cancel`,
        customerEmail: "test@example.com",
        currency: "brl",
      });

      if (result.success && result.sessionUrl) {
        toast.success("Redirecionando para checkout de teste...");
        window.location.href = result.sessionUrl;
      } else {
        throw new Error(result.error || "Erro ao criar sessão de teste");
      }
    } catch (error: any) {
      console.error("Erro no teste:", error);
      toast.error(error.message || "Erro ao criar checkout de teste");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Direct Charges</CardTitle>
          <CardDescription>
            Página de teste para verificar o funcionamento do sistema de Direct Charges com Stripe Connect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-semibold mb-2">⚠️ Ambiente de Teste</p>
            <p>Esta página é apenas para testes internos do sistema de Direct Charges.</p>
            <p>Use cartões de teste do Stripe para simular pagamentos.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cartões de Teste</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Sucesso:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">4242 4242 4242 4242</code>
              </div>
              <div className="flex justify-between">
                <span>Recusado:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">4000 0000 0000 0002</code>
              </div>
              <div className="flex justify-between">
                <span>Autenticação:</span>
                <code className="bg-gray-100 px-2 py-1 rounded">4000 0025 0000 3155</code>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleTestCheckout} 
            disabled={loading}
            className="w-full"
          >
            {loading ? "Criando checkout..." : "Testar Direct Charge"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 