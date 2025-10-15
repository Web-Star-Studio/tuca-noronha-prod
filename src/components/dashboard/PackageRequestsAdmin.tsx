"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, MapPin, DollarSign, Eye, Edit, Filter, Mail, ChevronLeft, ChevronRight, FileText, Clock } from "lucide-react";
import { 
  STATUS_LABELS, 
  STATUS_COLORS,
  // PackageRequestSummary removido (não utilizado)
  // PackageRequest removido (não utilizado)
} from "../../../convex/domains/packages/types";
import { Id } from "@/../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { parseDateInput } from "@/lib/utils";

export default function PackageRequestsAdmin() {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<Id<"packageRequests"> | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [paginationCursor, setPaginationCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([null]); // Stack de cursores para voltar
  const itemsPerPage = 10;

  // Queries with pagination
  const requestsStats = useQuery(api.packages.getPackageRequestStats);
  const requestsResult = useQuery(api.packages.listPackageRequests, {
    paginationOpts: { numItems: itemsPerPage, cursor: paginationCursor },
    status: selectedStatus || undefined,
  });

  // Mutations
  const updateRequestStatus = useMutation(api.packages.updatePackageRequestStatus);

  const [updateForm, setUpdateForm] = useState({
    status: "",
    adminNotes: "",
    proposalDetails: "",
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Data não definida";
    const parsed = parseDateInput(dateString);
    return parsed ? parsed.toLocaleDateString('pt-BR') : "Data inválida";
  };

  // Helper function to format trip dates (handles both specific and flexible dates)
  const formatTripDates = (tripDetails: any) => {
    if (tripDetails.flexibleDates) {
      // For flexible dates, show months
      const startMonth = tripDetails.startMonth;
      const endMonth = tripDetails.endMonth;
      
      if (startMonth && endMonth) {
        const formatMonth = (monthStr: string) => {
          const [year, month] = monthStr.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        };
        
        if (startMonth === endMonth) {
          return `${formatMonth(startMonth)} (flexível)`;
        } else {
          return `${formatMonth(startMonth)} - ${formatMonth(endMonth)} (flexível)`;
        }
      }
      return "Datas flexíveis";
    } else {
      // For specific dates
      if (tripDetails.startDate && tripDetails.endDate) {
        return `${formatDate(tripDetails.startDate)} - ${formatDate(tripDetails.endDate)}`;
      } else if (tripDetails.startDate) {
        return formatDate(tripDetails.startDate);
      }
      return "Datas a definir";
    }
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;

    try {
      await updateRequestStatus({
        id: selectedRequest,
        status: updateForm.status as any,
        note: updateForm.adminNotes || undefined,
      });
      setIsUpdateDialogOpen(false);
      setUpdateForm({ status: "", adminNotes: "", proposalDetails: "" });
    } catch (error) {
      console.error("Erro ao atualizar solicitação:", error);
      alert("Erro ao atualizar solicitação");
    }
  };

  const openUpdateDialog = (request: any) => {
    setSelectedRequest(request._id);
    setUpdateForm({
      status: "",
      adminNotes: "",
      proposalDetails: "",
    });
    setIsUpdateDialogOpen(true);
  };

  const handleViewDetails = (requestId: Id<"packageRequests">) => {
    router.push(`/admin/dashboard/solicitacoes-pacotes/${requestId}`);
  };

  // Reset pagination quando filtro mudar (MOVED BEFORE EARLY RETURN)
  useEffect(() => {
    setPaginationCursor(null);
    setCursorHistory([null]);
  }, [selectedStatus]);

  // Reset pagination on mount to clear any stale cursors
  useEffect(() => {
    setPaginationCursor(null);
    setCursorHistory([null]);
  }, []);

  if (!requestsStats || !requestsResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando solicitações...</p>
        </div>
      </div>
    );
  }

  const requests = requestsResult.page;
  const hasMore = requestsResult.isDone === false;
  const continueCursor = requestsResult.continueCursor;

  // Handlers de paginação
  const handleNextPage = () => {
    if (hasMore && continueCursor) {
      setCursorHistory([...cursorHistory, paginationCursor]);
      setPaginationCursor(continueCursor);
    }
  };

  const handlePreviousPage = () => {
    if (cursorHistory.length > 1) {
      const newHistory = [...cursorHistory];
      newHistory.pop(); // Remove o cursor atual
      const previousCursor = newHistory[newHistory.length - 1];
      setCursorHistory(newHistory);
      setPaginationCursor(previousCursor);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{requestsStats.total}</div>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{requestsStats.pending}</div>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{requestsStats.inReview}</div>
            <p className="text-xs text-muted-foreground">Em Análise</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{requestsStats.proposalSent}</div>
            <p className="text-xs text-muted-foreground">Propostas Enviadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{requestsStats.requiresRevision}</div>
            <p className="text-xs text-muted-foreground">Requer Revisão</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{requestsStats.confirmed}</div>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{requestsStats.cancelled}</div>
            <p className="text-xs text-muted-foreground">Cancelados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="in_review">Em análise</option>
                <option value="proposal_sent">Proposta enviada</option>
                <option value="confirmed">Confirmado</option>
                <option value="requires_revision">Requer revisão</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Pacotes</CardTitle>
          <CardDescription>
            Gerencie todas as solicitações de pacotes dos clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Nenhuma solicitação encontrada.</p>
              </div>
            ) : (
              requests.map((request) => (
                <div
                  key={request._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-lg">
                          #{request.requestNumber}
                        </span>
                        <Badge className={STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}>
                          {STATUS_LABELS[request.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{request.customerInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{request.tripDetails.destination}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatTripDates(request.tripDetails)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(request.tripDetails.budget)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          <span className={`font-medium ${
                            request.tripDetails.includesAirfare === true 
                              ? 'text-green-600' 
                              : request.tripDetails.includesAirfare === false
                              ? 'text-red-600'
                              : 'text-gray-400'
                          }`}>
                            {request.tripDetails.includesAirfare === true 
                              ? 'Com Aéreo' 
                              : request.tripDetails.includesAirfare === false
                              ? 'Sem Aéreo'
                              : 'N/D'}
                          </span>
                        </div>
                      </div>

                      {/* Proposal indicators */}
                      {request.proposalCount && request.proposalCount > 0 && (
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-blue-600">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{request.proposalCount} proposta{request.proposalCount > 1 ? 's' : ''}</span>
                          </div>
                          {request.lastProposalSent && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">Última proposta: {formatDate(new Date(request.lastProposalSent).toISOString())}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(request._id)}
                        title="Ver detalhes completos e mensagens"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openUpdateDialog(request)}
                        title="Editar status"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {requests.length > 0 && (
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-gray-700">
                Mostrando {requests.length} solicitações
                {hasMore && " (há mais resultados)"}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cursorHistory.length <= 1}
                  onClick={handlePreviousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={handleNextPage}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Atualizar Solicitação</DialogTitle>
            <DialogDescription>
              Atualize o status e adicione notas administrativas
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="update-status">Novo Status</Label>
              <select
                id="update-status"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={updateForm.status}
                onChange={(e) => setUpdateForm({...updateForm, status: e.target.value})}
              >
                <option value="">Selecione um status</option>
                <option value="pending">Pendente</option>
                <option value="in_review">Em análise</option>
                <option value="proposal_sent">Proposta enviada</option>
                <option value="confirmed">Confirmado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="admin-notes">Notas Administrativas</Label>
              <Textarea
                id="admin-notes"
                placeholder="Adicione notas sobre esta solicitação..."
                value={updateForm.adminNotes}
                onChange={(e) => setUpdateForm({...updateForm, adminNotes: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="proposal-details">Detalhes da Proposta</Label>
              <Textarea
                id="proposal-details"
                placeholder="Detalhes da proposta enviada ao cliente..."
                value={updateForm.proposalDetails}
                onChange={(e) => setUpdateForm({...updateForm, proposalDetails: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateRequest} disabled={!updateForm.status}>
                Atualizar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Details Modal with Tabs */}
    </div>
  );
}
