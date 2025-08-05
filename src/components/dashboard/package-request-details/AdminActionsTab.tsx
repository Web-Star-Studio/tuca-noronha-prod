"use client";

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  Clock,
  Mail,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Info
} from 'lucide-react';

import { formatDateTime } from './helpers';

interface AdminActionsTabProps {
  requestId: Id<"packageRequests">;
  requestDetails: any;
}

const statusActions = [
  { status: "in_review", label: "Em Análise", icon: <Clock className="h-5 w-5" /> },
  { status: "proposal_sent", label: "Proposta Enviada", icon: <Mail className="h-5 w-5" /> },
  { status: "confirmed", label: "Confirmado", icon: <CheckCircle className="h-5 w-5" /> },
  { status: "cancelled", label: "Cancelado", icon: <XCircle className="h-5 w-5" /> },
  { status: "completed", label: "Concluído", icon: <ShieldCheck className="h-5 w-5" /> },
];

export function AdminActionsTab({ requestId, requestDetails }: AdminActionsTabProps) {
  const [adminResponse, setAdminResponse] = useState("");
  const updateRequestStatus = useMutation(api.packages.updatePackageRequestStatus);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!requestId) return;

    try {
      await updateRequestStatus({
        id: requestId,
        status: newStatus as any,
        note: adminResponse || undefined,
      });
      toast.success("Status atualizado com sucesso!");
      setAdminResponse("");
    } catch {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  return (
    <div className="space-y-6 p-1">
      <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <ShieldCheck className="h-6 w-6 text-blue-600"/>
            Atualizar Status da Solicitação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {statusActions.map(action => (
              <Button
                key={action.status}
                variant="outline"
                onClick={() => handleStatusUpdate(action.status)}
                className="flex flex-col items-center justify-center gap-2 h-24 p-2 text-center group hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"
                disabled={requestDetails.status === action.status}
              >
                <div className="p-2 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors duration-200">
                  {action.icon}
                </div>
                <span className="text-xs font-semibold">{action.label}</span>
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-notes">Notas Administrativas (Opcional)</Label>
            <Textarea
              id="admin-notes"
              placeholder="Adicione notas internas sobre esta atualização de status..."
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              rows={3}
              className="bg-gray-50"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <Info className="h-6 w-6 text-blue-600"/>
            Informações de Controle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between p-2 rounded-md hover:bg-gray-50">
            <strong className="text-gray-600">Criado em:</strong> 
            <span>{formatDateTime(requestDetails.createdAt)}</span>
          </div>
          <div className="flex justify-between p-2 rounded-md hover:bg-gray-50">
            <strong className="text-gray-600">Última atualização:</strong> 
            <span>{formatDateTime(requestDetails.updatedAt)}</span>
          </div>
          {requestDetails.assignedTo && (
            <div className="flex justify-between p-2 rounded-md hover:bg-gray-50">
              <strong className="text-gray-600">Atribuído a:</strong> 
              <span>{requestDetails.assignedTo}</span>
            </div>
          )}
          {requestDetails.adminNotes && (
            <div>
              <strong className="text-gray-600">Últimas Notas Admin:</strong>
              <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-md border">{requestDetails.adminNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 