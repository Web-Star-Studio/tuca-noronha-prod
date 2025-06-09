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
  clerkId: string;
  name?: string;
  email?: string;
  role?: string;
  createdAt?: number;
  updatedAt?: number;
  organizationsCount: number;
  assetsCount: number;
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
  if (user?.role === "employee") {
    // Employees não podem acessar o gerenciamento de usuários
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

  // Queries
  const systemUsers = useQuery(api["domains/users/queries"].listAllUsers, {
    role: selectedRole === "all" ? undefined : selectedRole as any,
    limit: 200,
  });

  const systemStats = useQuery(api["domains/users/queries"].getSystemStatistics);

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
      user.clerkId.toLowerCase().includes(searchLower)
    );
  }) || [];

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
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
            <p className="text-sm text-gray-600">
              Visualizar e gerenciar todos os usuários do sistema
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {systemStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.users.total}</div>
              <p className="text-xs text-muted-foreground">usuários registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Viajantes</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{systemStats.users.travelers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Parceiros</CardTitle>
              <Building2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{systemStats.users.partners}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
              <Users className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{systemStats.users.employees}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Masters</CardTitle>
              <Crown className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{systemStats.users.masters}</div>
            </CardContent>
          </Card>
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
            <SelectItem value="all">Todos os Roles</SelectItem>
            <SelectItem value="traveler">Viajantes</SelectItem>
            <SelectItem value="partner">Parceiros</SelectItem>
            <SelectItem value="employee">Funcionários</SelectItem>
            <SelectItem value="master">Masters</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Usuários do Sistema
            {filteredUsers.length > 0 && (
              <Badge variant="secondary">
                {filteredUsers.length} {filteredUsers.length === 1 ? "usuário" : "usuários"}
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

          {systemUsers && filteredUsers.length === 0 && (
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

          {filteredUsers.length > 0 && (
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
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                            {getRoleIcon(user.role || "traveler")}
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.name || "Nome não informado"}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {user.clerkId.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${roleColors[user.role || "traveler"]}`}>
                          {roleLabels[user.role || "traveler"]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          {user.email || "Email não informado"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {user.organizationsCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-gray-400" />
                          {user.assetsCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(user._creationTime)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            Ver Detalhes
                          </Button>
                          {user.role === "partner" && user.assetsCount > 0 && (
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
            <Button variant="outline" className="w-full">
              <Select value="partner" onValueChange={setSelectedRole}>
                <SelectTrigger className="border-none p-0 h-auto">
                  <SelectValue />
                </SelectTrigger>
              </Select>
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
    </div>
  );
} 