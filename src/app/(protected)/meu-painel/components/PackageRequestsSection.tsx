"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseDateInput } from "@/lib/utils";
import { Search, Plus, Package, MapPin, Calendar, Users, DollarSign, MessageCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import PackageRequestChatModal from "@/components/customer/PackageRequestChatModal";

const PackageRequestsSection: React.FC = () => {
  const { user } = useUser();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Chat modal state
  const [chatModal, setChatModal] = useState<{
    isOpen: boolean;
    requestId?: string;
    requestNumber?: string;
  }>({
    isOpen: false,
  });

  // Debug user info
  React.useEffect(() => {
    console.log("👤 PackageRequestsSection: User info:", {
      isSignedIn: !!user,
      email: user?.emailAddresses?.[0]?.emailAddress,
      id: user?.id,
      firstName: user?.firstName
    });
  }, [user]);

  // Get all user package requests
  const myPackageRequests = useQuery(api.packages.getMyPackageRequests);

  // Debug logs
  React.useEffect(() => {
    console.log("🔍 PackageRequestsSection: myPackageRequests state changed:", {
      isLoading: myPackageRequests === undefined,
      data: myPackageRequests,
      length: myPackageRequests?.length
    });
  }, [myPackageRequests]);

  const getPackageRequestByNumber = useQuery(
    api.packages.getPackageRequestByNumber,
    trackingNumber.trim() ? { requestNumber: trackingNumber.trim() } : "skip"
  );

  const searchPackageRequest = async () => {
    if (!trackingNumber.trim()) {
      toast.error("Digite um número de acompanhamento");
      return;
    }

    setIsSearching(true);
    try {
      // The query will automatically update when trackingNumber changes
      // Just trigger a state update to show the search is happening
      setTimeout(() => {
        setIsSearching(false);
      }, 100);
    } catch {
      toast.error("Erro ao buscar solicitação");
      setSearchResults(null);
      setIsSearching(false);
    }
  };


  useEffect(() => {
    if (getPackageRequestByNumber && trackingNumber.trim()) {
      setSearchResults(getPackageRequestByNumber);
      setIsSearching(false);
      if (getPackageRequestByNumber) {
        toast.success("Solicitação encontrada!");
      }
    } else if (trackingNumber.trim() && getPackageRequestByNumber === null) {
      toast.error("Solicitação não encontrada");
      setSearchResults(null);
      setIsSearching(false);
    }
  }, [getPackageRequestByNumber, trackingNumber]);

  const openChatModal = (requestId: string, requestNumber: string) => {
    setChatModal({
      isOpen: true,
      requestId,
      requestNumber,
    });
  };

  const closeChatModal = () => {
    setChatModal({
      isOpen: false,
      requestId: undefined,
      requestNumber: undefined,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_review": return "bg-blue-100 text-blue-800";
      case "proposal_sent": return "bg-purple-100 text-purple-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "requires_revision": return "bg-orange-100 text-orange-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "in_review": return "Em Análise";
      case "proposal_sent": return "Proposta Enviada";
      case "confirmed": return "Confirmado";
      case "requires_revision": return "Requer Revisão";
      case "cancelled": return "Cancelado";
      default: return status;
    }
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
          return format(date, "MMMM 'de' yyyy", { locale: ptBR });
        };
        
        if (startMonth === endMonth) {
          return `${formatMonth(startMonth)} (datas flexíveis)`;
        } else {
          return `${formatMonth(startMonth)} - ${formatMonth(endMonth)} (datas flexíveis)`;
        }
      }
      return "Datas flexíveis";
    } else {
      // For specific dates
      if (tripDetails.startDate && tripDetails.endDate) {
        const startDate = parseDateInput(tripDetails.startDate);
        const endDate = parseDateInput(tripDetails.endDate);

        if (startDate && endDate) {
          return `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`;
        }
      }
      return "Datas a definir";
    }
  };

  if (myPackageRequests === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando suas solicitações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Solicitações de Pacotes</h2>
          <p className="text-gray-600">
            Acompanhe suas solicitações de pacotes personalizados
          </p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/pacotes">
            <Plus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Link>
        </Button>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side - Search and Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Search Card */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Buscar Solicitação
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="Número de acompanhamento..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPackageRequest()}
                  className="border-gray-200"
                />
                <Button 
                  onClick={searchPackageRequest} 
                  disabled={isSearching}
                  className="w-full"
                  variant="outline"
                >
                  {isSearching ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total</span>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    {myPackageRequests?.length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Pendentes</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-600">
                    {myPackageRequests?.filter(r => r.status === 'pending').length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Em Análise</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-600">
                    {myPackageRequests?.filter(r => r.status === 'in_review').length || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Results */}
          {searchResults && (
            <Card className="bg-white shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Solicitação {searchResults.requestNumber}
                  </CardTitle>
                  <Badge className={getStatusColor(searchResults.status)}>
                    {getStatusLabel(searchResults.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-6">
                {/* Trip Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Detalhes da Viagem</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {formatTripDates(searchResults.tripDetails)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{searchResults.tripDetails.groupSize} pessoas</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">R$ {searchResults.tripDetails.budget.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Histórico</h4>
                    <div className="space-y-3">
                      {searchResults.statusHistory?.map((history: any, index: number) => (
                        <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            history.status === searchResults.status ? 'bg-blue-600' : 'bg-gray-300'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {getStatusLabel(history.status)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(history.timestamp), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <Button 
                    asChild
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Link href={`/meu-painel/solicitacao/${searchResults._id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openChatModal(searchResults._id, searchResults.requestNumber)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* My Package Requests */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Minhas Solicitações</h3>
            
            {myPackageRequests && myPackageRequests.length > 0 ? (
              <div className="space-y-4">
                {myPackageRequests.map((request) => (
                  <Card key={request._id} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          Solicitação {request.requestNumber}
                        </CardTitle>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Criado em {format(new Date(request._creationTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                      {/* Trip Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{request.tripDetails.destination}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {formatTripDates(request.tripDetails)}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{request.tripDetails.groupSize} pessoas</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">R$ {request.tripDetails.budget.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Admin Notes */}
                      {request.adminNotes && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h5 className="font-medium text-blue-900 mb-1">Nota da Administração</h5>
                          <p className="text-sm text-blue-800">{request.adminNotes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <Button 
                          asChild
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Link href={`/meu-painel/solicitacao/${request._id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openChatModal(request._id, request.requestNumber)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Chat
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Nenhuma solicitação encontrada
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Crie sua primeira solicitação de pacote personalizado
                    </p>
                    <Button asChild size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                      <Link href="/pacotes">
                        <Plus className="h-5 w-5 mr-2" />
                        Fazer Solicitação
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <PackageRequestChatModal
        isOpen={chatModal.isOpen}
        onClose={closeChatModal}
        requestId={chatModal.requestId ? (chatModal.requestId as any) : null}
        requestNumber={chatModal.requestNumber || ""}
      />
    </div>
  );
};

export default PackageRequestsSection; 
