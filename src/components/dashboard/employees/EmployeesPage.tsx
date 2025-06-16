"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, UserCheck, Clock, AlertCircle, Mail, Phone, Loader2, AlertTriangle, Key, Trash2, UserPlus } from "lucide-react";
import { SimpleCreateEmployeeForm } from "./SimpleCreateEmployeeForm";
import { PermissionsManager } from "./PermissionsManager";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <div className="text-center py-12">
      <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Users className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Nenhum colaborador ainda
      </h3>
      <p className="text-gray-600 mb-6 max-w-sm mx-auto">
        Comece adicionando colaboradores para gerenciar suas organizações e assets.
      </p>
      <Button onClick={onCreateClick} className="flex items-center gap-2">
        <UserPlus className="w-4 h-4" />
        Adicionar Primeiro Colaborador
      </Button>
    </div>
  );
}

export function EmployeesPage() {
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);

  // Queries and mutations
  const employees = useQuery(api.domains.users.queries.listPartnerEmployees) as Employee[] | undefined;
  const stats = useQuery(api.domains.users.queries.getPartnerEmployeeStats);

  const removeEmployee = useMutation(api.domains.users.mutations.removeEmployee);

  const isLoading = employees === undefined;

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

  // Get status badge
  const getStatusBadge = (employee: Employee) => {
    if (employee.clerkId?.startsWith("failed_")) {
      return <Badge variant="destructive" className="text-xs">Erro de Sincronização</Badge>;
    }
    if (employee.clerkId?.startsWith("temp_")) {
      return <Badge variant="secondary" className="text-xs">Aguardando Clerk</Badge>;
    }
    if (employee.clerkId) {
      return <Badge variant="default" className="text-xs bg-green-600">Ativo</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Sem Clerk ID</Badge>;
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
            <h1 className="text-2xl font-bold text-gray-900">Colaboradores</h1>
            <p className="text-sm text-gray-600">
              Gerencie seus funcionários e suas permissões
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => setIsCreateFormOpen(true)}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Adicionar Colaborador
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Colaboradores cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Com acesso ao sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Aguardando criação</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Failed Employees Alert */}
      {employees && employees.some(emp => emp.clerkId?.startsWith("failed_")) && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Informação:</strong> O sistema está sincronizando automaticamente alguns funcionários. 
            A correção ocorre automaticamente a cada 30 minutos.
          </AlertDescription>
        </Alert>
      )}

      {/* Employees List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Colaboradores</CardTitle>
              <CardDescription>
                Gerencie permissões e acesso dos seus funcionários
              </CardDescription>
            </div>
            
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar colaboradores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <Card key={employee._id} className={`${
                  employee.clerkId?.startsWith("failed_") ? "border-red-200 bg-red-50" : ""
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.image} alt={employee.name || "Funcionário"} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {employee.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'FU'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {employee.name || "Nome não informado"}
                          </h3>
                          <p className="text-sm text-gray-600">{employee.email}</p>
                          {employee.phone && (
                            <p className="text-sm text-gray-500">{employee.phone}</p>
                          )}
                          
                          {/* Status Badges */}
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(employee)}
                            
                            {employee.organizationName && (
                              <Badge variant="outline" className="text-xs">
                                {employee.organizationName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Auto-sync status for failed employees */}
                        {employee.clerkId?.startsWith("failed_") && (
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="secondary" className="text-xs">
                              Auto-Sincronização
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Corrigindo automaticamente...
                            </span>
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManagePermissions(employee)}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Permissões
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEmployee(employee._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyEmployeesState onCreateClick={() => setIsCreateFormOpen(true)} />
          )}
        </CardContent>
      </Card>

      {/* Create Employee Dialog */}
      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Colaborador</DialogTitle>
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
    </div>
  );
} 