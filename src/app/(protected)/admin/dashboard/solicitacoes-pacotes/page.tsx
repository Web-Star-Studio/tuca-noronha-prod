import React from "react";
import { Metadata } from "next";
import PackageRequestsAdmin from "@/components/dashboard/PackageRequestsAdmin";

export const metadata: Metadata = {
  title: "Solicitações de Pacotes | Admin Dashboard",
  description: "Gerencie todas as solicitações de pacotes personalizados dos clientes.",
};

export default function SolicitacoesPacotesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Solicitações de Pacotes
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie todas as solicitações de pacotes personalizados dos clientes.
        </p>
      </div>

      <PackageRequestsAdmin />
    </div>
  );
} 