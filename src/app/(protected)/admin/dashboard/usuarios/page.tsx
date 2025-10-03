"use client";

/**
 * Página de Gerenciamento de Usuários
 * 
 * REGRAS DE NEGÓCIO:
 * - Masters: Podem ver todos os usuários do sistema
 * - Partners: Só podem ver usuários (travelers) que fizeram reservas confirmadas em seus assets
 * - Employees: Herdam as mesmas permissões do partner ao qual estão associados
 * 
 * Esta implementação garante que partners só tenham acesso aos dados de usuários que 
 * realmente interagiram com seus serviços através de reservas confirmadas.
 */

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  UserCheck, 
  Shield, 
  Mail, 
  Phone, 
  Clock,
  Building2,
  Crown,
  User,
  Ban,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { DashboardPageHeader } from "../components";

type UserRole = "master" | "admin" | "partner" | "traveler" | "customer" | "employee";

export default function UsersPage() {
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Fetch users - partners only see users who made confirmed bookings with their assets
  const users = useQuery(api.domains.users.queries.listAllUsers, {
    role: roleFilter !== "all" ? roleFilter as any : undefined,
    limit: 1000
  });
  
  // Mutations - usando as funções do admin_functions.ts
  const updateUserRole = useMutation(api.admin_functions.updateUserRole);
  const toggleUserActive = useMutation(api.admin_functions.toggleUserActive);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      // Filter by role
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      
      // Filter by status
      if (statusFilter === "active" && !user.isActive) return false;
      if (statusFilter === "inactive" && user.isActive) return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          (user.fullName || user.name)?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.clerkId?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [users, roleFilter, statusFilter, searchTerm]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!users) return { total: 0, active: 0, admins: 0, partners: 0, customers: 0, travelers: 0 };
    
    return {
      total: users.length,
      active: users.filter(u => u.isActive !== false).length,
      admins: users.filter(u => u.role === "admin" || u.role === "master").length,
      partners: users.filter(u => u.role === "partner").length,
      customers: users.filter(u => u.role === "customer").length,
      travelers: users.filter(u => u.role === "traveler").length,
    };
  }, [users]);

  const getRoleConfig = (role: UserRole) => {
    const configs = {
      master: { label: "Master", icon: Crown, color: "text-purple-600", bg: "bg-purple-50" },
      admin: { label: "Admin", icon: Crown, color: "text-purple-600", bg: "bg-purple-50" },
      partner: { label: "Parceiro", icon: Building2, color: "text-blue-600", bg: "bg-blue-50" },
      traveler: { label: "Viajante", icon: User, color: "text-green-600", bg: "bg-green-50" },
      customer: { label: "Cliente", icon: User, color: "text-green-600", bg: "bg-green-50" },
      employee: { label: "Funcionário", icon: UserCheck, color: "text-orange-600", bg: "bg-orange-50" },
    };
    
    return configs[role] || configs.traveler;
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserActive({ userId, isActive: !currentStatus });
      toast.success(currentStatus ? "Usuário desativado!" : "Usuário ativado!");
    } catch {
      toast.error("Erro ao alterar status do usuário");
      console.error(error);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole({ userId, role: newRole });
      toast.success("Papel do usuário atualizado!");
    } catch {
      toast.error("Erro ao atualizar papel do usuário");
      console.error(error);
    }
  };

  const openUserDetails = (user: any) => {
    setSelectedUser(user);
    setShowDetailsDialog(true);
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <DashboardPageHeader
        title="Gerenciar Usuários"
        description={
          user?.publicMetadata?.role === "partner" 
              ? "Visualize usuários que fizeram reservas confirmadas em seus assets"
              : "Visualize e gerencie todos os usuários da plataforma"
            }
        icon={Users}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                          <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Masters</p>
              <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
            </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Crown className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Parceiros</p>
                <p className="text-2xl font-bold text-blue-600">{stats.partners}</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Viajantes</p>
                <p className="text-2xl font-bold text-green-600">{stats.travelers}</p>
              </div>
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar usuários por nome, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-0 bg-muted/30"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px] border-0 bg-muted/30">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                <SelectItem value="master">Master</SelectItem>
                <SelectItem value="partner">Parceiro</SelectItem>
                <SelectItem value="traveler">Viajante</SelectItem>
                <SelectItem value="employee">Funcionário</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] border-0 bg-muted/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            Lista de Usuários
            {filteredUsers.length > 0 && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {filteredUsers.length} {filteredUsers.length === 1 ? "usuário" : "usuários"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!users ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário ainda"}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? `Não encontramos usuários para "${searchTerm}"`
                  : "Os usuários aparecerão aqui quando se cadastrarem"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((userItem) => {
                const roleConfig = getRoleConfig(userItem.role as UserRole);
                const IconComponent = roleConfig.icon;
                
                return (
                  <Card key={userItem._id} className="hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-5">
                      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={userItem.image} alt={(userItem.fullName || userItem.name) || "Usuário"} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                              {(userItem.fullName || userItem.name)?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-foreground">
                                {userItem.fullName || userItem.name || "Nome não informado"}
                              </h3>
                              <Badge variant="outline" className={`${roleConfig.bg} ${roleConfig.color} border-current/20`}>
                                <IconComponent className="w-3 h-3 mr-1" />
                                {roleConfig.label}
                              </Badge>
                              {userItem.isActive !== false ? (
                                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  Inativo
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              {userItem.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  {userItem.email}
                                </div>
                              )}
                              {(userItem.phoneNumber || userItem.phone) && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  {userItem.phoneNumber || userItem.phone}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {format(new Date(userItem._creationTime), "PPP", { locale: ptBR })}
                              </div>
                              {userItem.clerkId && (
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  ID: {userItem.clerkId.substring(0, 8)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUserDetails(userItem)}
                          >
                            Ver Detalhes
                          </Button>
                          
                          {user?.publicMetadata?.role === "master" && (
                            <Button
                              variant={userItem.isActive !== false ? "outline" : "default"}
                              size="sm"
                              onClick={() => handleToggleUserStatus(userItem._id, userItem.isActive !== false)}
                              className={userItem.isActive !== false 
                                ? "text-red-600 border-red-200 hover:bg-red-50" 
                                : "bg-green-600 hover:bg-green-700 text-white"
                              }
                            >
                              {userItem.isActive !== false ? (
                                <><Ban className="w-4 h-4 mr-1" /> Desativar</>
                              ) : (
                                <><CheckCircle className="w-4 h-4 mr-1" /> Ativar</>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.image} alt={selectedUser.fullName || selectedUser.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {(selectedUser.fullName || selectedUser.name)?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                Detalhes do Usuário
              </DialogTitle>
              <DialogDescription>
                Informações completas sobre {selectedUser.fullName || selectedUser.name || "este usuário"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="text-foreground">{selectedUser.fullName || selectedUser.name || "Não informado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{selectedUser.email || "Não informado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <p className="text-foreground">{selectedUser.phoneNumber || selectedUser.phone || "Não informado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Papel</label>
                  <div className="flex items-center gap-2 mt-1">
                    {user?.publicMetadata?.role === "master" ? (
                      <Select
                        value={selectedUser.role || "customer"}
                        onValueChange={(newRole) => handleUpdateRole(selectedUser._id, newRole as UserRole)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="master">Master</SelectItem>
                          <SelectItem value="partner">Parceiro</SelectItem>
                          <SelectItem value="traveler">Viajante</SelectItem>
                          <SelectItem value="employee">Funcionário</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getRoleConfig(selectedUser.role as UserRole).bg} ${getRoleConfig(selectedUser.role as UserRole).color} border-current/20`}>
                          {getRoleConfig(selectedUser.role as UserRole).icon && (
                            <>{(() => {
                              const Icon = getRoleConfig(selectedUser.role as UserRole).icon;
                              return <Icon className="w-3 h-3 mr-1" />;
                            })()}</>
                          )}
                          {getRoleConfig(selectedUser.role as UserRole).label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">(Apenas masters podem editar papéis)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID do Sistema</label>
                  <p className="text-foreground font-mono text-sm">{selectedUser._id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Clerk ID</label>
                  <p className="text-foreground font-mono text-sm">{selectedUser.clerkId || "Não informado"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
                  <p className="text-foreground">{format(new Date(selectedUser._creationTime), "PPP", { locale: ptBR })}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-foreground">
                    {selectedUser.isActive !== false ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>
                    ) : (
                      <Badge variant="destructive">Inativo</Badge>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
} 
