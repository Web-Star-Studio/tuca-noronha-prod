"use client";

import { useState } from "react";
import { useEmployees, useCreateEmployee, useUpdateEmployee, useRemoveEmployee, usePartnerAssets, type Employee } from "@/lib/services/employeeService";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Plus, UserPlus, Trash2, PenSquare, Key, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import PermissionsManager, { type AssetPermission, type Asset } from "@/components/dashboard/users/PermissionsManager";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export default function EmployeesPage() {
  const { employees, isLoading } = useEmployees();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const removeEmployee = useRemoveEmployee();

  // Recursos (assets) do parceiro para gerenciamento de permissões
  const { assets: partnerAssets, isLoading: isLoadingAssets } = usePartnerAssets();

  // Permissões atuais - TEMPORÁRIO: usando array vazio enquanto resolvemos o erro de tipagem
  // TODO: Restaurar a linha abaixo quando o problema for resolvido
  // const permissions = useQuery(api.domains.rbac.queries.listAllAssetPermissions, {}) || [];
  const permissions: AssetPermission[] = [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] = useState<Id<"users"> | null>(null);
  const [editMode, setEditMode] = useState<Id<"users"> | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para gerenciamento de permissões
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: Id<"users">; name: string } | null>(null);

  const handleCreate = async () => {
    if (!name || (!editMode && !email)) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    try {
      setIsSubmitting(true);
      if (editMode) {
        await updateEmployee({ id: editMode, name });
        toast.success("Usuário atualizado com sucesso");
      } else {
        await createEmployee({ name, email });
        toast.success("Convite enviado com sucesso");
      }
      setDialogOpen(false);
      setName("");
      setEmail("");
      setEditMode(null);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveEmployee = async () => {
    if (!employeeToRemove) return;
    
    try {
      setIsSubmitting(true);
      await removeEmployee(employeeToRemove, true);
      toast.success("Usuário removido com sucesso");
      setConfirmDialogOpen(false);
      setEmployeeToRemove(null);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Formatar os recursos para o gerenciador de permissões
  const assets = partnerAssets ? {
    events: (partnerAssets.events || []).map((event: Asset) => ({
      _id: event._id,
      title: event.title,
      type: "events"
    })) as Asset[],
    restaurants: (partnerAssets.restaurants || []).map((restaurant: Asset) => ({
      _id: restaurant._id,
      name: restaurant.name,
      type: "restaurants"
    })) as Asset[],
    activities: (partnerAssets.activities || []).map((activity: Asset) => ({
      _id: activity._id,
      title: activity.title,
      type: "activities"
    })) as Asset[],
    media: (partnerAssets.media || []).map((item: Asset) => ({
      _id: item._id,
      name: item.name || "Mídia sem nome",
      type: "media"
    })) as Asset[],
  } : {
    events: [],
    restaurants: [],
    activities: [],
    media: []
  };

  // Filtra permissões para o funcionário selecionado
  const getEmployeePermissions = (employeeId: Id<"users">) => {
    return permissions.filter(
      (permission: AssetPermission) => permission.employeeId.toString() === employeeId.toString()
    );
  };

  // Conta permissões por funcionário
  const countPermissions = (employeeId: Id<"users">) => {
    return permissions.filter(
      (permission: AssetPermission) => permission.employeeId.toString() === employeeId.toString()
    ).length;
  };

  const openPermissions = (employee: Employee) => {
    setSelectedEmployee({
      id: employee._id,
      name: employee.name || "Sem nome"
    });
    setPermissionsOpen(true);
  };

  const isDataLoading = isLoading || isLoadingAssets;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-1">Gerencie os usuários do sistema e suas permissões</p>
        </div>
        
        <Button onClick={() => {
          setEditMode(null);
          setName("");
          setEmail("");
          setDialogOpen(true);
        }}>
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Funcionário
        </Button>
      </div>

      {isDataLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Carregando dados...</span>
        </div>
      ) : (
        <Tabs defaultValue="cards" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="cards">Cards</TabsTrigger>
            <TabsTrigger value="table">Tabela</TabsTrigger>
          </TabsList>
          
          <TabsContent value="cards" className="mt-6">
            {employees && employees.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map((emp: Employee) => (
                  <Card key={emp._id.toString()} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            {emp.image ? (
                              <AvatarImage src={emp.image} alt={emp.name || "Employee"} />
                            ) : (
                              <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg">{emp.name || "Sem nome"}</CardTitle>
                            <CardDescription className="text-sm">{emp.email}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={emp.role === "employee" ? "outline" : "secondary"}>
                          {emp.role === "employee" ? "Funcionário" : emp.role}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm pt-2">
                      <div className="mt-2">
                        <div className="flex items-center mt-2">
                          <Key className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {countPermissions(emp._id) > 0 
                              ? `${countPermissions(emp._id)} permissões atribuídas` 
                              : "Sem permissões atribuídas"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2 bg-muted/30 py-2">
                      {emp.role === "employee" && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => openPermissions(emp)}
                        >
                          <Shield className="h-3.5 w-3.5 mr-1" />
                          Permissões
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setEditMode(emp._id);
                          setName(emp.name || "");
                          setEmail(emp.email || "");
                          setDialogOpen(true);
                        }}
                      >
                        <PenSquare className="h-3.5 w-3.5 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          setEmployeeToRemove(emp._id);
                          setConfirmDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Remover
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 border rounded-lg bg-muted/10">
                <UserPlus className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhum usuário cadastrado</h3>
                <p className="text-muted-foreground mb-4">Adicione seu primeiro usuário para começar</p>
                <Button onClick={() => {
                  setEditMode(null);
                  setName("");
                  setEmail("");
                  setDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Convidar Funcionário
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="table">
            <div className="rounded-md border overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Função</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Permissões</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {employees && employees.length > 0 ? (
                    employees.map((emp: Employee) => (
                      <tr key={emp._id.toString()} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              {emp.image ? (
                                <AvatarImage src={emp.image} alt={emp.name || "Employee"} />
                              ) : (
                                <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div className="text-sm font-medium">{emp.name || "—"}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">{emp.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant={emp.role === "employee" ? "outline" : "secondary"}>
                            {emp.role === "employee" ? "Funcionário" : emp.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {countPermissions(emp._id) > 0 ? (
                            <Badge variant="outline">
                              {countPermissions(emp._id)} permissões
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">Nenhuma</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {emp.role === "employee" && (
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => openPermissions(emp)}
                            >
                              <Shield className="h-3.5 w-3.5 mr-1" />
                              Permissões
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setEditMode(emp._id);
                              setName(emp.name || "");
                              setEmail(emp.email || "");
                              setDialogOpen(true);
                            }}
                          >
                            <PenSquare className="h-3.5 w-3.5 mr-1" />
                            Editar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              setEmployeeToRemove(emp._id);
                              setConfirmDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum usuário cadastrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Dialog para criar/editar employee */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>{editMode ? "Editar usuário" : "Convidar novo funcionário"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nome</label>
              <Input 
                id="name"
                placeholder="Nome completo" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
            
            {!editMode && (
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
                <p className="text-xs text-muted-foreground">
                  Um convite será enviado para este email
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="bg-red-600 hover:cursor-pointer hover:bg-red-700 text-white">Cancelar</Button>
            <Button 
              disabled={isSubmitting} 
              onClick={handleCreate}
              className="bg-blue-600 hover:cursor-pointer hover:bg-blue-700 text-white"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editMode ? "Atualizar" : "Enviar convite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação para remover employee */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover usuário</DialogTitle>
          </DialogHeader>

          <div className="py-4 flex items-start space-x-4">
            <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            <div>
              <p>Tem certeza que deseja remover este usuário?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Esta ação irá:
              </p>
              <ul className="text-sm text-muted-foreground mt-1 list-disc ml-4">
                <li>Remover todas as permissões associadas</li>
                <li>Remover o acesso do usuário à plataforma</li>
                <li>Excluir a conta do usuário no sistema de autenticação</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-1 font-semibold">
                Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
            <Button 
              variant="destructive"
              disabled={isSubmitting} 
              onClick={handleRemoveEmployee}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gerenciador de permissões */}
      {selectedEmployee && (
        <PermissionsManager
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          open={permissionsOpen}
          onOpenChange={setPermissionsOpen}
          assets={assets}
          currentPermissions={getEmployeePermissions(selectedEmployee.id)}
          onPermissionsChange={() => {}} // Recarregar permissões (opcional)
        />
      )}
    </div>
  );
} 