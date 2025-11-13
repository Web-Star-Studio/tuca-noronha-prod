"use client";

import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";

// Dynamic import for large component to improve initial load time
const BookingManagement = dynamic(
  () => import("@/components/dashboard/bookings/BookingManagement"),
  { 
    loading: () => <div className="flex items-center justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>,
    ssr: false 
  }
);

export default function MyBookingsPage() {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role as string;

  // Check if user has permission to manage bookings
  if (userRole !== "partner" && userRole !== "master" && userRole !== "employee") {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Acesso Negado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Você não tem permissão para acessar esta página. Apenas parceiros, funcionários e administradores podem gerenciar reservas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <BookingManagement />;
}