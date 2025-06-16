"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  
  // Fallback: Try to get requests by user matching (name similarity)
  const myPackageRequestsByMatch = useQuery(api.packages.getMyPackageRequestsByUserMatch);
  
  // Debug: Get all package requests to see if any exist
  const allPackageRequests = useQuery(api.packages.getAllPackageRequests);

  // Use the main query result, but if empty, fallback to the match-based query
  const finalPackageRequests = React.useMemo(() => {
    if (myPackageRequests && myPackageRequests.length > 0) {
      return myPackageRequests;
    }
    if (myPackageRequestsByMatch && myPackageRequestsByMatch.length > 0) {
      console.log("🔄 Usando requests encontradas por correspondência:", myPackageRequestsByMatch);
      return myPackageRequestsByMatch;
    }
    return myPackageRequests || [];
  }, [myPackageRequests, myPackageRequestsByMatch]);

  // Debug logs
  React.useEffect(() => {
    console.log("🔍 PackageRequestsSection: myPackageRequests state changed:", {
      isLoading: myPackageRequests === undefined,
      data: myPackageRequests,
      length: myPackageRequests?.length
    });
  }, [myPackageRequests]);

  React.useEffect(() => {
    console.log("🔍 PackageRequestsSection: allPackageRequests state changed:", {
      isLoading: allPackageRequests === undefined,
      data: allPackageRequests,
      length: allPackageRequests?.length
    });
  }, [allPackageRequests]);

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
      if (getPackageRequestByNumber) {
        setSearchResults(getPackageRequestByNumber);
        toast.success("Solicitação encontrada!");
      } else {
        toast.error("Solicitação não encontrada");
        setSearchResults(null);
      }
    } catch (error) {
      toast.error("Erro ao buscar solicitação");
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (getPackageRequestByNumber && trackingNumber.trim()) {
      setSearchResults(getPackageRequestByNumber);
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
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_review": return "bg-blue-100 text-blue-800";
      case "proposal_sent": return "bg-purple-100 text-purple-800";
      case "confirmed": return "bg-green-100 text-green-800";
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
      case "cancelled": return "Cancelado";
      default: return status;
    }
  };

  if (myPackageRequests === undefined && myPackageRequestsByMatch === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando suas solicitações...</p>
          <p className="text-xs text-gray-400 mt-2">
            {allPackageRequests === undefined 
              ? "Conectando ao banco de dados..." 
              : `${allPackageRequests?.length || 0} solicitações no total`
            }
          </p>
        </div>
      </div>
    );
  }

  const renderPackageRequestCard = (request: any) => (
    <Card key={request._id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Solicitação {request.requestNumber}</CardTitle>
          <Badge className={getStatusColor(request.status)}>
            {getStatusLabel(request.status)}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">
          Criado em {format(new Date(request._creationTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{request.tripDetails.destination}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>
                {format(new Date(request.tripDetails.startDate), "dd/MM/yyyy", { locale: ptBR })} - {" "}
                {format(new Date(request.tripDetails.endDate), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span>{request.tripDetails.groupSize} pessoas</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span>R$ {request.tripDetails.budget.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        {request.adminNotes && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-1">Nota da Administração</h5>
            <p className="text-sm text-blue-800">{request.adminNotes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => openChatModal(request._id, request.requestNumber)}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat com a Equipe
          </Button>
          {request.status === "proposal_sent" && (
            <Button size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Ver Proposta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Minhas Solicitações de Pacotes</h2>
          <Button asChild>
            <Link href="/pacotes">
              <Plus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Link>
          </Button>
        </div>
        <p className="text-gray-600">
          Aqui você pode acompanhar todas as suas solicitações de pacotes personalizados enviadas para nossa equipe.
        </p>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Solicitação Específica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Digite o número de acompanhamento (ex: PKG-1234567890-ABC)"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPackageRequest()}
            />
            <Button onClick={searchPackageRequest} disabled={isSearching}>
              {isSearching ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Solicitação {searchResults.requestNumber}</CardTitle>
              <Badge className={getStatusColor(searchResults.status)}>
                {getStatusLabel(searchResults.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Trip Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Detalhes da Viagem</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{searchResults.tripDetails.destination}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>
                      {format(new Date(searchResults.tripDetails.startDate), "dd/MM/yyyy", { locale: ptBR })} - {" "}
                      {format(new Date(searchResults.tripDetails.endDate), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>{searchResults.tripDetails.groupSize} pessoas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span>R$ {searchResults.tripDetails.budget.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Histórico de Status</h4>
                <div className="space-y-3">
                  {searchResults.statusHistory?.map((history: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        history.status === searchResults.status ? 'bg-blue-600' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {getStatusLabel(history.status)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(history.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {history.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openChatModal(searchResults._id, searchResults.requestNumber)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat com a Equipe
              </Button>
              {searchResults.status === "proposal_sent" && (
                <Button size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Proposta
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* My Package Requests */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Minhas Solicitações</h3>
        
        {finalPackageRequests && finalPackageRequests.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                              <Badge variant="secondary" className="text-sm">
                  {finalPackageRequests.length} solicitação{finalPackageRequests.length !== 1 ? 'ões' : ''} encontrada{finalPackageRequests.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              {finalPackageRequests.map((request) => renderPackageRequestCard(request))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Email mismatch warning */}
            {allPackageRequests && allPackageRequests.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-orange-900 mb-1">
                        Solicitações feitas com outro email?
                      </p>
                      <p className="text-sm text-orange-700 mb-3">
                        Encontramos {allPackageRequests.length} solicitação{allPackageRequests.length !== 1 ? 'ões' : ''} no sistema, 
                        mas elas podem ter sido feitas com um email diferente do atual ({user?.emailAddresses?.[0]?.emailAddress}).
                      </p>
                      <p className="text-xs text-orange-600">
                        Se você fez solicitações com outro email, entre em contato conosco para vinculá-las à sua conta.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="text-center py-12">
                <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Você ainda não fez nenhuma solicitação
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Crie sua primeira solicitação de pacote personalizado e nossa equipe entrará em contato com uma proposta única para você!
                </p>
                <div className="space-y-3">
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/pacotes">
                      <Plus className="h-5 w-5 mr-2" />
                      Fazer primeira solicitação
                    </Link>
                  </Button>
                  <p className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                    💡 <strong>Dica:</strong> Após enviar a solicitação, ela aparecerá aqui para acompanhamento do status
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Chat Modal */}
      <PackageRequestChatModal
        isOpen={chatModal.isOpen}
        onClose={closeChatModal}
        requestId={chatModal.requestId as any}
        requestNumber={chatModal.requestNumber || ""}
      />
    </div>
  );
};

export default PackageRequestsSection; 