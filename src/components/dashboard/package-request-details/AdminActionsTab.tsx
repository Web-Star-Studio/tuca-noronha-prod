"use client";

import React, { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { toast } from "sonner";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { ShieldCheck, Info } from "lucide-react";

import { formatDateTime } from "./helpers";

interface AdminActionsTabProps {
  requestId: Id<"packageRequests">;
  requestDetails: any;
}

const statusOptions = [
  { value: "in_review", label: "Em Análise" },
  { value: "proposal_sent", label: "Proposta Enviada" },
  { value: "confirmed", label: "Confirmado" },
  { value: "requires_revision", label: "Requer Revisão" },
  { value: "cancelled", label: "Cancelado" },
  { value: "completed", label: "Concluído" },
];

export function AdminActionsTab({ requestId, requestDetails }: AdminActionsTabProps) {
  const [adminResponse, setAdminResponse] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(requestDetails.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const updateRequestStatus = useMutation(api.packages.updatePackageRequestStatus);

  useEffect(() => {
    setSelectedStatus(requestDetails.status);
  }, [requestDetails.status]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!requestId) return;

    if (newStatus === requestDetails.status) {
      toast.info("A solicitação já está com este status.");
      return;
    }

    try {
      setIsUpdatingStatus(true);
      await updateRequestStatus({
        id: requestId,
        status: newStatus as any,
        note: adminResponse || undefined,
      });
      toast.success("Status atualizado com sucesso!");
      setAdminResponse("");
      setSelectedStatus(newStatus);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
      setSelectedStatus(requestDetails.status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-xl border bg-background/70 p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Atualizar status</h3>
            <p className="text-xs text-muted-foreground">
              Escolha o andamento atual da solicitação e adicione observações internas opcionais.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-select">Status atual</Label>
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              setSelectedStatus(value);
              handleStatusUpdate(value);
            }}
            disabled={isUpdatingStatus}
          >
            <SelectTrigger id="status-select" className="w-full">
              <SelectValue placeholder="Selecione o novo status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin-notes">Notas administrativas</Label>
          <Textarea
            id="admin-notes"
            placeholder="Adicione notas internas sobre esta atualização de status (opcional)."
            value={adminResponse}
            onChange={(e) => setAdminResponse(e.target.value)}
            rows={3}
            className="resize-none bg-background"
          />
          <p className="text-xs text-muted-foreground">
            As notas são anexadas quando um novo status é selecionado.
          </p>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border bg-background/70 p-5 text-sm text-foreground">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-600">
            <Info className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Informações de controle</h3>
            <p className="text-xs text-muted-foreground">Dados automáticos para monitorar o atendimento desta solicitação.</p>
          </div>
        </div>

        <dl className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Criado em</dt>
            <dd className="text-sm font-medium">{formatDateTime(requestDetails.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Última atualização</dt>
            <dd className="text-sm font-medium">{formatDateTime(requestDetails.updatedAt)}</dd>
          </div>
          {requestDetails.assignedTo && (
            <div className="flex items-center justify-between rounded-lg bg-background px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Atribuído a</dt>
              <dd className="text-sm font-medium">{requestDetails.assignedTo}</dd>
            </div>
          )}
          {requestDetails.adminNotes && (
            <div className="rounded-lg bg-background px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Últimas notas internas</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{requestDetails.adminNotes}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}
 
