"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  DocumentTextIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClockIcon,
  ChartBarIcon,
  PencilIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface ProposalStats {
  total: number;
  pending: number;
  sent: number;
  accepted: number;
  rejected: number;
  totalValue: number;
  conversionRate: number;
}

interface ProposalFilters {
  status?: string;
  priority?: string;
  searchTerm?: string;
  partnerId?: string;
}

export default function PackageProposalsPage() {
  const { user } = useCurrentUser();
  const [filters, setFilters] = useState<ProposalFilters>({});
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  // Queries
  const proposals = useQuery(api.domains.packageProposals.queries.listPackageProposals, {
    limit: 50,
    status: filters.status,
    priority: filters.priority,
    searchTerm: filters.searchTerm,
    partnerId: filters.partnerId,
  });

  const proposalStats = useQuery(api.domains.packageProposals.queries.getProposalStats, {});

  const packageRequests = useQuery(api.domains.packageRequests.queries.listPendingRequests, {
    limit: 20,
  });

  const templates = useQuery(api.domains.packageProposals.templates.listPackageProposalTemplates, {
    limit: 10,
    isActive: true,
  });

  // Mutations
  const sendProposal = useMutation(api.domains.packageProposals.mutations.sendPackageProposal);
  const deleteProposal = useMutation(api.domains.packageProposals.mutations.deletePackageProposal);

  const statusConfig = {
    draft: { label: "Rascunho", color: "bg-gray-500", icon: DocumentTextIcon },
    review: { label: "Em Revisão", color: "bg-yellow-500", icon: ClockIcon },
    sent: { label: "Enviada", color: "bg-blue-500", icon: PaperAirplaneIcon },
    viewed: { label: "Visualizada", color: "bg-purple-500", icon: EyeIcon },
    under_negotiation: { label: "Em Negociação", color: "bg-orange-500", icon: ClockIcon },
    accepted: { label: "Aceita", color: "bg-green-500", icon: CheckCircleIcon },
    rejected: { label: "Rejeitada", color: "bg-red-500", icon: XMarkIcon },
    expired: { label: "Expirada", color: "bg-gray-500", icon: ClockIcon },
    withdrawn: { label: "Retirada", color: "bg-gray-500", icon: XMarkIcon },
  };

  const priorityConfig = {
    low: { label: "Baixa", color: "bg-gray-500" },
    normal: { label: "Normal", color: "bg-blue-500" },
    high: { label: "Alta", color: "bg-orange-500" },
    urgent: { label: "Urgente", color: "bg-red-500" },
  };

  // Check if user can edit/delete a proposal
  const canEditProposal = (proposal: any) => {
    if (!user) return false;
    return user.role === "master" || proposal.adminId === user._id;
  };

  const canDeleteProposal = (proposal: any) => {
    if (!user) return false;
    return (user.role === "master" || (user.role === "partner" && proposal.adminId === user._id)) 
           && !proposal.convertedToBooking;
  };

  const handleSendProposal = async (proposalId: Id<"packageProposals">) => {
    try {
      await sendProposal({
        id: proposalId,
        sendEmail: true,
        sendNotification: true,
        customMessage: "Sua proposta personalizada está pronta! Confira todos os detalhes e entre em contato se tiver dúvidas.",
      });
      toast.success("Proposta enviada com sucesso!");
    } catch (error) {
      console.error("Error sending proposal:", error);
      toast.error("Erro ao enviar proposta");
    }
  };

  const handleViewProposal = (proposal: any) => {
    setSelectedProposal(proposal);
    setShowViewDialog(true);
  };

  const handleEditProposal = (proposal: any) => {
    // Navigate to edit page
    window.open(`/admin/dashboard/propostas-pacotes/editar/${proposal._id}`, '_blank');
  };

  const handleDeleteProposal = (proposal: any) => {
    setSelectedProposal(proposal);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedProposal) return;

    setIsDeleting(true);
    try {
      await deleteProposal({
        id: selectedProposal._id,
        reason: deleteReason.trim() || "Excluída pelo administrador",
      });
      toast.success("Proposta excluída com sucesso!");
      setShowDeleteDialog(false);
      setSelectedProposal(null);
      setDeleteReason("");
    } catch (error) {
      console.error("Error deleting proposal:", error);
      toast.error("Erro ao excluir proposta");
    } finally {
      setIsDeleting(false);
    }
  };

  const stats: ProposalStats = proposalStats || {
    total: 0,
    pending: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    totalValue: 0,
    conversionRate: 0,
  };

  // Get active filters count
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Propostas de Pacotes"
        description="Gerencie propostas de pacotes personalizados para seus clientes"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Total de Propostas</CardTitle>
            <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <ClockIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-2 sm:flex-nowrap sm:items-center">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="create">Criar Proposta</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Pesquisar propostas..."
                    value={filters.searchTerm || ""}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    className="pl-10"
                  />
                </div>

                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === "all" ? undefined : value }))}
                >
                  <SelectTrigger className={filters.status ? "bg-blue-50 border-blue-200" : ""}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Todos os Status</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="draft">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Rascunho</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.filter(p => p.status === "draft").length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="review">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Em Revisão</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.filter(p => p.status === "review").length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="sent">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Enviada</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.filter(p => p.status === "sent").length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewed">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Visualizada</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.filter(p => p.status === "viewed").length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="under_negotiation">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Em Negociação</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.filter(p => p.status === "under_negotiation").length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="accepted">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Aceita</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.filter(p => p.status === "accepted").length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Rejeitada</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.filter(p => p.status === "rejected").length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.priority || "all"}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value === "all" ? undefined : value }))}
                >
                  <SelectTrigger className={filters.priority ? "bg-blue-50 border-blue-200" : ""}>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Todas as Prioridades</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Baixa</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.filter(p => p.priority === "low").length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="normal">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Normal</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.filter(p => p.priority === "normal").length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Alta</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.filter(p => p.priority === "high").length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between w-full">
                        <span>Urgente</span>
                        <Badge variant="secondary" className="ml-2">
                          {proposals?.proposals?.filter(p => p.priority === "urgent").length || 0}
                        </Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button onClick={() => window.open('/admin/dashboard/propostas-pacotes/criar', '_blank')} className="flex-1">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Nova Proposta
                  </Button>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setFilters({})}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposals Table */}
          <Card>
            <CardHeader>
              <CardTitle>Propostas</CardTitle>
              <CardDescription>
                Lista de todas as propostas de pacotes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposals?.proposals?.map((proposal) => {
                  const status = statusConfig[proposal.status as keyof typeof statusConfig];
                  const priority = priorityConfig[proposal.priority as keyof typeof priorityConfig];
                  const isExpired = proposal.validUntil < Date.now();

                  return (
                    <div key={proposal._id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex flex-wrap gap-3 items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{proposal.title}</h3>
                            <Badge className={`${status.color} text-white`}>
                              {status.label}
                            </Badge>
                            <Badge className={`${priority.color} text-white`}>
                              {priority.label}
                            </Badge>
                            {isExpired && (
                              <Badge variant="destructive">
                                Expirada
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            Proposta #{proposal.proposalNumber}
                          </p>
                          
                          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 md:grid-cols-4">
                            <div>
                              <span className="font-medium">Valor: </span>
                              <span className="text-green-600 font-semibold">
                                {formatCurrency(proposal.totalPrice)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">Válida até: </span>
                              <span>{formatDate(proposal.validUntil)}</span>
                            </div>
                            <div>
                              <span className="font-medium">Componentes: </span>
                              <span>{proposal.components.length}</span>
                            </div>
                            <div>
                              <span className="font-medium">Criada: </span>
                              <span>{formatDate(proposal.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProposal(proposal)}
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          
                          {canEditProposal(proposal) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProposal(proposal)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <PencilIcon className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          )}
                          
                          {canDeleteProposal(proposal) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProposal(proposal)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Excluir
                            </Button>
                          )}
                          
                          {proposal.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() => handleSendProposal(proposal._id)}
                            >
                              <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                              Enviar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {proposals?.proposals?.length === 0 && (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhuma proposta encontrada
                    </h3>
                    <p className="text-gray-500">
                      Comece criando sua primeira proposta de pacote.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Proposta</CardTitle>
              <CardDescription>
                Selecione uma solicitação de pacote para criar uma proposta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Solicitações de Pacote Pendentes</h3>
                  <div className="space-y-2">
                    {packageRequests?.requests?.map((request: any) => (
                      <div key={request._id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => window.open(`/admin/dashboard/propostas-pacotes/criar/${request._id}`, '_blank')}>
                        <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                          <div>
                            <h4 className="font-medium">{request.destination}</h4>
                            <p className="text-sm text-gray-600">
                              {request.tripDetails?.groupSize} pessoas • {request.tripDetails?.duration} dias
                            </p>
                            <p className="text-xs text-gray-500">
                              Criada em {formatDate(request.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              Orçamento: {request.tripDetails?.budget ? formatCurrency(request.tripDetails.budget) : 'N/A'}
                            </p>
                            <Badge variant="outline">
                              {request.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {packageRequests?.requests?.length === 0 && (
                      <p className="text-gray-500 text-center py-8">
                        Nenhuma solicitação de pacote pendente encontrada.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Propostas</CardTitle>
              <CardDescription>
                Gerencie templates reutilizáveis para propostas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates?.templates?.map((template) => (
                  <Card key={template._id} className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{template.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-xs">
                        <div className="flex flex-wrap gap-3 justify-between">
                          <span>Categoria:</span>
                          <Badge variant="outline" className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-between">
                          <span>Componentes:</span>
                          <span>{template.defaultComponents.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-between">
                          <span>Usos:</span>
                          <span>{template.usageCount}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="w-full mt-3">
                        Usar Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                <Card className="border-dashed border-2 flex items-center justify-center min-h-[200px]">
                  <Button variant="ghost" className="h-full w-full">
                    <div className="text-center">
                      <PlusIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Criar Novo Template
                      </p>
                    </div>
                  </Button>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a proposta &quot;{selectedProposal?.title}&quot;?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo da exclusão (opcional)</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Descreva o motivo da exclusão..."
                className="w-full mt-1 p-2 border rounded-md text-sm"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Excluir Proposta"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Proposal Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProposal?.title}
            </DialogTitle>
            <DialogDescription>
              Proposta #{selectedProposal?.proposalNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="space-y-6">
              {/* Proposal Details */}
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="font-medium">Status: </span>
                  <Badge className={`${statusConfig[selectedProposal.status as keyof typeof statusConfig]?.color} text-white`}>
                    {statusConfig[selectedProposal.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Prioridade: </span>
                  <Badge className={`${priorityConfig[selectedProposal.priority as keyof typeof priorityConfig]?.color} text-white`}>
                    {priorityConfig[selectedProposal.priority as keyof typeof priorityConfig]?.label}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Valor Total: </span>
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(selectedProposal.totalPrice)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Válida até: </span>
                  <span>{formatDate(selectedProposal.validUntil)}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Descrição</h4>
                <p className="text-sm text-gray-600">{selectedProposal.description}</p>
              </div>

              {/* Components */}
              <div>
                <h4 className="font-medium mb-2">Componentes ({selectedProposal.components.length})</h4>
                <div className="space-y-2">
                  {selectedProposal.components.map((component: any, index: number) => (
                    <div key={index} className="border rounded p-3 text-sm">
                      <div className="flex flex-wrap gap-3 justify-between items-start mb-1">
                        <span className="font-medium">{component.name}</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(component.totalPrice)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs mb-1">{component.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {component.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {component.quantity}x {formatCurrency(component.unitPrice)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => window.open(`/propostas/${selectedProposal._id}`, '_blank')}
                >
                  Ver Página Pública
                </Button>
                {selectedProposal.status === "draft" && (
                  <Button
                    onClick={() => {
                      handleSendProposal(selectedProposal._id);
                      setShowViewDialog(false);
                    }}
                  >
                    Enviar Proposta
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 
