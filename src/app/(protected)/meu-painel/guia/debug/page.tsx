"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";

export default function DebugGuidePage() {
  const debugData = useQuery(api.domains.guide.queries.debugUserPurchases);
  const hasAccess = useQuery(api.domains.guide.queries.hasGuideAccess);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Debug - Compras do Guia</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Status de Acesso</h2>
          <p className="text-lg">
            <strong>Has Access:</strong>{" "}
            <span className={hasAccess ? "text-green-600" : "text-red-600"}>
              {hasAccess ? "✅ SIM" : "❌ NÃO"}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Dados da Query</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>

        {debugData?.purchases && debugData.purchases.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Suas Compras</h2>
            <div className="space-y-4">
              {debugData.purchases.map((purchase: any) => (
                <div key={purchase._id} className="border rounded p-4">
                  <p><strong>ID:</strong> {purchase._id}</p>
                  <p><strong>Status:</strong> <span className="font-mono bg-yellow-100 px-2 py-1">{purchase.status}</span></p>
                  <p><strong>Payment ID:</strong> {purchase.mpPaymentId}</p>
                  <p><strong>Purchased At:</strong> {new Date(purchase.purchasedAt).toLocaleString()}</p>
                  {purchase.approvedAt && (
                    <p><strong>Approved At:</strong> {new Date(purchase.approvedAt).toLocaleString()}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
