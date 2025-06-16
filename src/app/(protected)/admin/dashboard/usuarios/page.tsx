"use client";

import { useState } from "react";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useRemoveEmployee, usePartnerOrganizations, useOrganizationPermissions, type Employee } from "@/lib/services/employeeService";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Plus, UserPlus, Trash2, PenSquare, Key, Shield, AlertCircle, Users, Search, Filter, Mail, Building2, Calendar, Store, Activity, Car, UserCheck, Crown } from "lucide-react";
import { toast } from "sonner";
import PermissionsManager from "@/components/dashboard/users/PermissionsManager";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import CreatePartnerModal from "@/components/dashboard/users/CreatePartnerModal";
import UserDetailsModal from "@/components/dashboard/users/UserDetailsModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SystemUser = {
  _id: Id<"users">;
  _creationTime: number;
  clerkId?: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: number;
  updatedAt?: number;
  organizationsCount?: number;
  assetsCount?: number;
};

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

export default function UsersManagementPage() {
  const { user } = useCurrentUser();
  const router = useRouter();

  // Renderiza loader enquanto verifica permissões
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Verifica se o usuário tem permissão para acessar esta página
  if (!user || !["partner", "employee", "master"].includes(user.role || "")) {
    // Apenas partners, employees e masters podem acessar
    router.push("/admin/dashboard");
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatePartnerModalOpen, setIsCreatePartnerModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null);
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false);

  // Queries
  const systemUsers = useQuery(api["domains/users/queries"].listAllUsers, {
    role: selectedRole === "all" ? undefined : selectedRole as any,
    limit: 200,
  });

  const systemStats = useQuery(api["domains/users/queries"].getSystemStatistics);

  const handleCreatePartnerSuccess = () => {
    // Refetch data would happen automatically due to Convex reactivity
    toast.success("Dados atualizados!");
  };

  const handleViewUserDetails = (userId: Id<"users">) => {
    setSelectedUserId(userId);
    setIsUserDetailsModalOpen(true);
  };

  const handleCloseUserDetails = () => {
    setIsUserDetailsModalOpen(false);
    setSelectedUserId(null);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Filtrar usuários baseado na busca
  const filteredUsers = systemUsers?.filter((user) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.clerkId?.toLowerCase().includes(searchLower)
    );
  }) || [];

  // Filtrar dados baseado no role do usuário atual
  const getFilteredData = () => {
    if (!user) return [];

    // Masters veem todos os usuários
    if (user.role === "master") {
      return filteredUsers;
    }

    // Partners veem apenas seus employees e outros partners (sem dados sensíveis de outros partners)
    if (user.role === "partner") {
      return filteredUsers.filter(u => 
        u.role === "employee" || 
        u.role === "traveler" || 
        (u.role === "partner" && u._id === user._id) // Só vê a si mesmo entre partners
      );
    }

    // Employees veem apenas travelers e outros employees da mesma organização
    if (user.role === "employee") {
      return filteredUsers.filter(u => 
        u.role === "traveler" ||
        (u.role === "employee" && u._id === user._id) // Só vê a si mesmo entre employees
      );
    }

    return [];
  };

  const visibleUsers = getFilteredData();

  // Adaptar título e descrição baseado no role
  const getPageTitle = () => {
    switch (user?.role) {
      case "master": 
        return {
          title: "Gestão de Usuários",
          description: "Visualizar e gerenciar todos os usuários do sistema"
        };
      case "partner":
        return {
          title: "Usuários",
          description: "Visualizar colaboradores e viajantes"
        };
      case "employee":
        return {
          title: "Usuários",
          description: "Visualizar viajantes e informações do sistema"
        };
      default:
        return {
          title: "Usuários",
          description: "Visualizar usuários do sistema"
        };
    }
  };

  const pageInfo = getPageTitle();

  // Adaptar filtros de role baseado nas permissões do usuário
  const getAvailableRoleFilters = () => {
    const baseFilters = [{ value: "all", label: "Todos os Usuários" }];
    
    if (user?.role === "master") {
      return [
        ...baseFilters,
        { value: "traveler", label: "Viajantes" },
        { value: "partner", label: "Parceiros" },
        { value: "employee", label: "Funcionários" },
        { value: "master", label: "Masters" },
      ];
    }
    
    if (user?.role === "partner") {
      return [
        ...baseFilters,
        { value: "traveler", label: "Viajantes" },
        { value: "employee", label: "Funcionários" },
      ];
    }
    
    if (user?.role === "employee") {
      return [
        ...baseFilters,
        { value: "traveler", label: "Viajantes" },
      ];
    }
    
    return baseFilters;
  };

  const roleFilters = getAvailableRoleFilters();

  const getRoleIcon = (role: string) => {
    const Icon = roleIcons[role] || UserCheck;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageInfo.title}</h1>
            <p className="text-sm text-gray-600">
              {pageInfo.description}
            </p>
          </div>
        </div>
        
        {/* Botão Criar Partner - apenas para masters */}
        {user?.role === "master" && (
          <Button
            onClick={() => setIsCreatePartnerModalOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Criar Partner
          </Button>
        )}
      </div>

      {/* Estatísticas */}
      {systemStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Total - sempre mostrar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user?.role === "master" ? "Total" : "Usuários Visíveis"}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visibleUsers.length}</div>
              <p className="text-xs text-muted-foreground">
                {user?.role === "master" ? "usuários registrados" : "usuários visíveis"}
              </p>
            </CardContent>
          </Card>

          {/* Viajantes - sempre mostrar para todos os roles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Viajantes</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {user?.role === "master" 
                  ? systemStats.users.travelers 
                  : visibleUsers.filter(u => u.role === "traveler").length
                }
              </div>
            </CardContent>
          </Card>

          {/* Parceiros - apenas para masters */}
          {user?.role === "master" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Parceiros</CardTitle>
                <Building2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{systemStats.users.partners}</div>
              </CardContent>
            </Card>
          )}

          {/* Funcionários - para masters e partners */}
          {(user?.role === "master" || user?.role === "partner") && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
                <Users className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {user?.role === "master" 
                    ? systemStats.users.employees 
                    : visibleUsers.filter(u => u.role === "employee").length
                  }
                </div>
              </CardContent>
            </Card>
          )}

          {/* Masters - apenas para masters */}
          {user?.role === "master" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Masters</CardTitle>
                <Crown className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{systemStats.users.masters}</div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por role" />
          </SelectTrigger>
          <SelectContent>
            {roleFilters.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários do Sistema
            {visibleUsers.length > 0 && (
              <Badge variant="secondary">
                {visibleUsers.length} {visibleUsers.length === 1 ? "usuário" : "usuários"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!systemUsers && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {systemUsers && visibleUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum usuário encontrado</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `Nenhum usuário encontrado para "${searchTerm}".`
                  : "Não há usuários no sistema no momento."
                }
              </p>
            </div>
          )}

          {visibleUsers.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organizações</TableHead>
                    <TableHead>Assets</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleUsers.map((tableUser) => (
                    <TableRow key={tableUser._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                            {getRoleIcon(tableUser.role || "traveler")}
                          </div>
                          <div>
                            <div className="font-medium">
                              {tableUser.name || "Nome não informado"}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {tableUser.clerkId?.slice(0, 8) || "N/A"}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${roleColors[tableUser.role || "traveler"]}`}>
                          {roleLabels[tableUser.role || "traveler"]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {tableUser.email || "Email não informado"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {tableUser.organizationsCount ?? 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-gray-400" />
                          {tableUser.assetsCount ?? 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(tableUser._creationTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Masters podem ver detalhes de qualquer usuário */}
                          {/* Partners e employees só podem ver detalhes de travelers */}
                          {(user?.role === "master" || 
                            ((user?.role === "partner" || user?.role === "employee") && tableUser.role === "traveler")) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewUserDetails(tableUser._id)}
                            >
                              Ver Detalhes
                            </Button>
                          )}
                          {tableUser.role === "partner" && tableUser.assetsCount > 0 && (
                            <Button variant="outline" size="sm">
                              Ver Assets
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Partners Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {systemUsers?.filter(u => u.role === "partner").length || 0}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Parceiros gerenciando {systemStats?.assets.total || 0} assets
            </p>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setSelectedRole("partner")}
            >
              Ver Parceiros
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Funcionários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {systemUsers?.filter(u => u.role === "employee").length || 0}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Employees com acesso ao sistema
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSelectedRole("employee")}>
              Ver Funcionários
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Viajantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">
              {systemUsers?.filter(u => u.role === "traveler").length || 0}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Usuários utilizando a plataforma
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSelectedRole("traveler")}>
              Ver Viajantes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Criação de Partner */}
      <CreatePartnerModal
        isOpen={isCreatePartnerModalOpen}
        onClose={() => setIsCreatePartnerModalOpen(false)}
        onSuccess={handleCreatePartnerSuccess}
      />

      {/* Modal de Detalhes do Usuário */}
      <UserDetailsModal
        isOpen={isUserDetailsModalOpen}
        onClose={handleCloseUserDetails}
        userId={selectedUserId}
      />
    </div>
  );
} 