"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Search, UserCheck, Clock, AlertTriangle, Key, Trash2, UserPlus, Mail, Phone } from "lucide-react";
import { SimpleCreateEmployeeForm } from "./SimpleCreateEmployeeForm";
import { PermissionsManager } from "./PermissionsManager";

import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ui } from "@/lib/ui-config";
import { motion } from "framer-motion";

// Types
type Employee = {
  _id: Id<"users">;
  _creationTime: number;
  clerkId?: string;
  name?: string;
  email?: string;
  image?: string;
  phone?: string;
  role?: string;
  partnerId?: Id<"users">;
  organizationId?: Id<"partnerOrganizations">;
  emailVerificationTime?: number;
  isAnonymous?: boolean;
  organizationName?: string;
  creationRequestStatus?: string;
};

function EmptyEmployeesState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Users className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">
        Nenhum colaborador ainda
      </h3>
      <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed mb-8">
        Comece adicionando colaboradores para gerenciar suas organizações e assets.
      </p>
      <Button onClick={onCreateClick} className="gap-2">
        <UserPlus className="h-4 w-4" />
        Adicionar Primeiro Colaborador
      </Button>
    </div>
  );
}

function EmployeeCard({ employee, onManagePermissions, onRemove }: {
  employee: Employee;
  onManagePermissions: (employee: Employee) => void;
  onRemove: (id: Id<"users">) => void;
}) {
  const getStatusBadge = (employee: Employee) => {
    if (employee.clerkId?.startsWith("failed_")) {
      return <Badge variant="destructive" className="text-xs">Erro de Sincronização</Badge>;
    }
    if (employee.clerkId?.startsWith("temp_")) {
      return <Badge variant="secondary" className="text-xs">Aguardando Clerk</Badge>;
    }
    if (employee.clerkId) {
      return <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">Ativo</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Sem Clerk ID</Badge>;
  };

  return (
    <Card className={`border border-border/50 hover:shadow-md transition-all duration-300 ${
      employee.clerkId?.startsWith("failed_") 
        ? "border-red-200 bg-red-50/50" 
        : ""
    }`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employee.image} alt={employee.name || "Funcionário"} />
              <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                {employee.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'FU'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-foreground">
                  {employee.name || "Nome não informado"}
                </h3>
                {getStatusBadge(employee)}
                {employee.organizationName && (
                  <Badge variant="outline" className="text-xs border-gray-300">
                    {employee.organizationName}
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                {employee.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {employee.email}
                  </div>
                )}
                {employee.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {employee.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-sync status for failed employees */}
            {employee.clerkId?.startsWith("failed_") && (
              <div className="text-right mr-3">
                <Badge variant="secondary" className="text-xs mb-1">
                  Auto-Sincronização
                </Badge>
                <div className="text-xs text-muted-foreground">
                  Corrigindo automaticamente...
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onManagePermissions(employee)}
              className="gap-2"
            >
              <Key className="h-4 w-4" />
              Permissões
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(employee._id)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmployeesPage() {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);

  // Queries and mutations
  const employees = useQuery(api.domains.users.queries.listPartnerEmployees) as Employee[] | undefined;
  const stats = useQuery(api.domains.users.queries.getPartnerEmployeeStats);
  const removeEmployee = useMutation(api.domains.users.mutations.removeEmployee);

  // Filter employees based on search
  const filteredEmployees = employees?.filter(employee => {
    if (!searchTerm) return true;
    const query = searchTerm.toLowerCase();
    return (
      employee.name?.toLowerCase().includes(query) ||
      employee.email?.toLowerCase().includes(query) ||
      employee.organizationName?.toLowerCase().includes(query)
    );
  }) || [];

  // Handle creating new employee
  const handleCreateSuccess = () => {
    setIsCreateFormOpen(false);
    toast.success("Colaborador criado com sucesso!");
  };

  // Handle removing employee
  const handleRemoveEmployee = async (employeeId: Id<"users">) => {
    if (!confirm("Tem certeza que deseja remover este colaborador?")) {
      return;
    }

    try {
      await removeEmployee({ employeeId });
      toast.success("Colaborador removido com sucesso");
    } catch (error) {
      console.error("Error removing employee:", error);
      toast.error("Erro ao remover colaborador");
    }
  };

  // Handle managing permissions
  const handleManagePermissions = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsPermissionsOpen(true);
  };

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className={`${ui.typography.h1.className} ${ui.colors.text.primary}`}>
                Colaboradores
              </h1>
              <p className={`${ui.colors.text.secondary} text-sm leading-relaxed`}>
                Gerencie seus funcionários e suas permissões
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => setIsCreateFormOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Adicionar Colaborador
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
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
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Failed Employees Alert */}
      {employees && employees.some(emp => emp.clerkId?.startsWith("failed_")) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Sincronização Automática</h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  O sistema está sincronizando automaticamente alguns funcionários. 
                  A correção ocorre automaticamente a cada 30 minutos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar colaboradores por nome, email, organização..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-0 bg-muted/30"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employees List */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" />
            Lista de Colaboradores
            {filteredEmployees.length > 0 && (
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {filteredEmployees.length} {filteredEmployees.length === 1 ? "colaborador" : "colaboradores"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <EmptyEmployeesState onCreateClick={() => setIsCreateFormOpen(true)} />
          ) : (
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <EmployeeCard
                  key={employee._id}
                  employee={employee}
                  onManagePermissions={handleManagePermissions}
                  onRemove={handleRemoveEmployee}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Employee Dialog */}
      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Adicionar Novo Colaborador
            </DialogTitle>
          </DialogHeader>
          <SimpleCreateEmployeeForm 
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsCreateFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      {selectedEmployee && (
        <PermissionsManager
          employee={selectedEmployee}
          open={isPermissionsOpen}
          onOpenChange={setIsPermissionsOpen}
        />
      )}
    </motion.div>
  );
} 