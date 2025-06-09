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

const PackageRequestsSection: React.FC = () => {
  const { user } = useUser();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Pacotes Solicitados</h2>
        <Button asChild variant="outline">
          <Link href="/pacotes">
            <Plus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </Link>
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Acompanhar Solicitação
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
                  {searchResults.statusHistory.map((history: any, index: number) => (
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
              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                Entrar em Contato
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

      {/* No requests found message */}
      {!searchResults && !isSearching && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">Nenhuma solicitação encontrada</h3>
          <p className="text-gray-500 mb-6">
            Digite um número de acompanhamento para visualizar os detalhes da sua solicitação de pacote.
          </p>
          <Button asChild>
            <Link href="/pacotes">
              Solicitar Novo Pacote
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default PackageRequestsSection; 