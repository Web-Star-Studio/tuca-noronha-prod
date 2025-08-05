"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Calendar, Building2, Store, Users, Activity, Crown, UserCheck, Loader2, AlertCircle } from "lucide-react";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: Id<"users"> | null;
}

const roleLabels: Record<string, string> = {
  traveler: "Viajante",
  partner: "Parceiro",
  employee: "Funcionário",
  master: "Master Admin",
};

const roleColors: Record<string, string> = {
  traveler: "bg-blue-100 text-blue-800",
  partner: "bg-green-100 text-green-800",
  employee: "bg-yellow-100 text-yellow-800",
  master: "bg-purple-100 text-purple-800",
};

const roleIcons: Record<string, any> = {
  traveler: UserCheck,
  partner: Building2,
  employee: Users,
  master: Crown,
};

const assetTypeLabels: Record<string, string> = {
  restaurants: "Restaurantes",
  events: "Eventos",
  activities: "Atividades",
  vehicles: "Veículos",
  accommodations: "Hospedagens",
};

export default function UserDetailsModal({ isOpen, onClose, userId }: UserDetailsModalProps) {
  const userDetails = useQuery(
    api.domains.users.queries.getUserDetailsById,
    userId ? { userId } : undefined
  );

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleIcon = (role: string) => {
    const Icon = roleIcons[role] || UserCheck;
    return <Icon className="h-4 w-4" />;
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Usuário
          </DialogTitle>
        </DialogHeader>

        {!userDetails && userId && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {userDetails === null && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Usuário não encontrado</h3>
              <p className="text-gray-600">O usuário solicitado não existe ou foi removido.</p>
            </div>
          </div>
        )}

        {userDetails && (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={userDetails.image} />
                    <AvatarFallback className="text-lg">
                      {getInitials(userDetails.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {userDetails.name || "Nome não informado"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ID: {userDetails.clerkId?.slice(0, 12)}...
                        </p>
                      </div>
                      <Badge className={`${roleColors[userDetails.role || "traveler"]}`}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(userDetails.role || "traveler")}
                          {roleLabels[userDetails.role || "traveler"]}
                        </span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{userDetails.email || "Email não informado"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{userDetails.phone || "Telefone não informado"}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Criado em: {formatDate(userDetails._creationTime)}</span>
                      </div>
                      
                      {userDetails.emailVerificationTime && (
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">Último acesso: {formatDate(userDetails.emailVerificationTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações Específicas por Role */}
            
            {/* Partner Information */}
            {userDetails.role === "partner" && (
              <div className="space-y-4">
                {/* Assets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Assets do Parceiro
                    </CardTitle>
                    <CardDescription>
                      Recursos e serviços gerenciados por este parceiro
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(userDetails.assets).map(([key, value]) => {
                        if (key === "total") return null;
                        return (
                          <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900">{String(value)}</div>
                            <div className="text-sm text-gray-600">{assetTypeLabels[key]}</div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{userDetails.assets.total}</div>
                      <div className="text-sm text-gray-600">Total de Assets</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Organizações */}
                {userDetails.organizations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Organizações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {userDetails.organizations.map((org) => (
                          <div key={org._id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="font-medium">{org.name}</div>
                              <div className="text-sm text-gray-500 capitalize">{org.type}</div>
                            </div>
                            <Badge variant={org.isActive ? "default" : "secondary"}>
                              {org.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Funcionários */}
                {typeof userDetails.employeesCount === "number" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Funcionários
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{userDetails.employeesCount}</div>
                        <div className="text-sm text-gray-600">Funcionários gerenciados</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Employee Information */}
            {userDetails.role === "employee" && userDetails.partnerInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Informações de Vínculo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Vinculado ao Partner:</span>
                      <div className="text-sm text-gray-900">{userDetails.partnerInfo?.name || "Nome não informado"}</div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Email do Partner:</span>
                      <div className="text-sm text-gray-900">{userDetails.partnerInfo?.email || "Email não informado"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Status da Conta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Tipo de Conta:</span>
                    <div className="text-sm text-gray-900">
                      {userDetails.isAnonymous ? "Anônima" : "Verificada"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Email Verificado:</span>
                    <div className="text-sm text-gray-900">
                      {userDetails.emailVerificationTime ? "Sim" : "Não"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 