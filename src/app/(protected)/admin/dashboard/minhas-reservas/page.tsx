"use client";

import { useUser } from "@clerk/nextjs";
import BookingManagement from "@/components/dashboard/bookings/BookingManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

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