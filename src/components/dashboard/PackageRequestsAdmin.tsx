"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  Eye, 
  Edit, 
  BarChart3,
  Filter,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { 
  STATUS_LABELS, 
  STATUS_COLORS,
  type PackageRequestSummary,
  type PackageRequest
} from "../../../convex/domains/packages/types";
import { Id } from "@/../convex/_generated/dataModel";

export default function PackageRequestsAdmin() {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedRequest, setSelectedRequest] = useState<Id<"packageRequests"> | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  // Queries with pagination
  const requestsStats = useQuery(api.packages.getPackageRequestStats);
  const requestsResult = useQuery(api.packages.listPackageRequests, {
    paginationOpts: { numItems: itemsPerPage, cursor: null },
    status: selectedStatus || undefined,
  });
  const requestDetails = useQuery(
    api.packages.getPackageRequestDetails,
    selectedRequest ? { requestId: selectedRequest } : "skip"
  );

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
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
                          <span>{formatDate(request.tripDetails.startDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCurrency(request.tripDetails.budget)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRequest(request._id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Solicitação #{request.requestNumber}</DialogTitle>
                          </DialogHeader>
                          {requestDetails && (
                            <RequestDetailsContent request={requestDetails} />
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openUpdateDialog(request)}
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
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => setCurrentPage(prev => prev + 1)}
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
    </div>
  );
}

// Component for displaying request details
function RequestDetailsContent({ request }: { request: any }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 ">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações do Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Nome:</strong> {request.customerInfo.name}</div>
          <div><strong>Email:</strong> {request.customerInfo.email}</div>
          <div><strong>Telefone:</strong> {request.customerInfo.phone}</div>
          {request.customerInfo.age && (
            <div><strong>Idade:</strong> {request.customerInfo.age} anos</div>
          )}
          {request.customerInfo.occupation && (
            <div><strong>Profissão:</strong> {request.customerInfo.occupation}</div>
          )}
        </CardContent>
      </Card>

      {/* Trip Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhes da Viagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Destino:</strong> {request.tripDetails.destination}</div>
          <div><strong>Data de Início:</strong> {formatDate(request.tripDetails.startDate)}</div>
          <div><strong>Data de Fim:</strong> {formatDate(request.tripDetails.endDate)}</div>
          <div><strong>Duração:</strong> {request.tripDetails.duration} dias</div>
          <div><strong>Tamanho do Grupo:</strong> {request.tripDetails.groupSize} pessoas</div>
          <div><strong>Acompanhantes:</strong> {request.tripDetails.companions}</div>
          <div><strong>Orçamento:</strong> {formatCurrency(request.tripDetails.budget)}</div>
          <div><strong>Flexibilidade do Orçamento:</strong> {request.tripDetails.budgetFlexibility}</div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Tipo de Hospedagem:</strong> 
            <span className="ml-2">{request.preferences.accommodationType.join(", ")}</span>
          </div>
          <div>
            <strong>Atividades:</strong> 
            <span className="ml-2">{request.preferences.activities.join(", ")}</span>
          </div>
          <div>
            <strong>Transporte:</strong> 
            <span className="ml-2">{request.preferences.transportation.join(", ")}</span>
          </div>
          <div>
            <strong>Preferências Alimentares:</strong> 
            <span className="ml-2">{request.preferences.foodPreferences.join(", ")}</span>
          </div>
          {request.preferences.accessibility && request.preferences.accessibility.length > 0 && (
            <div>
              <strong>Acessibilidade:</strong> 
              <span className="ml-2">{request.preferences.accessibility.join(", ")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      {(request.specialRequirements || request.previousExperience || request.expectedHighlights) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {request.specialRequirements && (
              <div>
                <strong>Requisitos Especiais:</strong> 
                <p className="ml-2 mt-1">{request.specialRequirements}</p>
              </div>
            )}
            {request.previousExperience && (
              <div>
                <strong>Experiência Anterior:</strong> 
                <p className="ml-2 mt-1">{request.previousExperience}</p>
              </div>
            )}
            {request.expectedHighlights && (
              <div>
                <strong>Expectativas:</strong> 
                <p className="ml-2 mt-1">{request.expectedHighlights}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Administrativas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Status:</strong> 
            <Badge className={`ml-2 ${STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}`}>
              {STATUS_LABELS[request.status as keyof typeof STATUS_LABELS]}
            </Badge>
          </div>
          <div><strong>Criado em:</strong> {formatDate(new Date(request.createdAt).toISOString())}</div>
          <div><strong>Atualizado em:</strong> {formatDate(new Date(request.updatedAt).toISOString())}</div>
          {request.adminNotes && (
            <div>
              <strong>Notas Administrativas:</strong> 
              <p className="ml-2 mt-1">{request.adminNotes}</p>
            </div>
          )}
          {request.proposalDetails && (
            <div>
              <strong>Detalhes da Proposta:</strong> 
              <p className="ml-2 mt-1">{request.proposalDetails}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 