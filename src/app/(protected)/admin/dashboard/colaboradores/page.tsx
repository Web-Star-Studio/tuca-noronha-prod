"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../../../convex/_generated/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2, UserPlus, Users, Mail, Phone, Calendar, Shield, Key, Building2 } from "lucide-react"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { useOrganization } from "@/lib/providers/organization-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useEmployees, useGrantOrganizationPermission, useRevokeOrganizationPermission, useOrganizationPermissions, usePartnerOrganizations } from "@/lib/services/employeeService"
import PermissionsManager from "@/components/dashboard/users/PermissionsManager"
import type { Id } from "../../../../../../convex/_generated/dataModel"

interface CreateEmployeeForm {
  name: string
  email: string
}

export default function ColaboradoresPage() {
  const { toast } = useToast()
  const { user } = useCurrentUser()
  const { activeOrganization } = useOrganization()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permissionsOpen, setPermissionsOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: Id<"users">; name: string } | null>(null)
  const [form, setForm] = useState<CreateEmployeeForm>({
    name: "",
    email: ""
  })

  // Hooks para employees e permissões
  const { employees, isLoading: isLoadingEmployees } = useEmployees()
  const { organizations, isLoading: isLoadingOrganizations } = usePartnerOrganizations()
  const { permissions, isLoading: isLoadingPermissions } = useOrganizationPermissions()
  
  // Mutation para criar colaborador
  const createEmployee = useMutation(api.domains.rbac.mutations.createEmployee)

  // Mutation para remover colaborador
  const removeEmployee = useMutation(api.domains.rbac.mutations.removeEmployee)

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name.trim() || !form.email.trim()) {
      toast({
        title: "Erro",
        description: "Nome e e-mail são obrigatórios",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      await createEmployee({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase()
      })

      toast({
        title: "Sucesso",
        description: "Colaborador criado com sucesso! Um convite foi enviado por e-mail.",
        variant: "default"
      })

      setForm({ name: "", email: "" })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error("Erro ao criar colaborador:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar colaborador. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveEmployee = async (employeeId: Id<"users">) => {
    if (!confirm("Tem certeza que deseja remover este colaborador?")) {
      return
    }

    try {
      await removeEmployee({ 
        id: employeeId,
        includeClerk: true
      })
      toast({
        title: "Sucesso",
        description: "Colaborador removido com sucesso!",
        variant: "default"
      })
    } catch (error) {
      console.error("Erro ao remover colaborador:", error)
      toast({
        title: "Erro",
        description: "Erro ao remover colaborador. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  // Função para obter permissões de um employee específico
  const getEmployeePermissions = (employeeId: Id<"users">) => {
    return (permissions || []).filter(
      (permission: any) => permission.employeeId.toString() === employeeId.toString()
    );
  }

  // Função para contar organizações atribuídas
  const countAssignedOrganizations = (employeeId: Id<"users">) => {
    return getEmployeePermissions(employeeId).length;
  }

  // Função para obter resumo dos tipos de organizações
  const getOrganizationTypesSummary = (employeeId: Id<"users">) => {
    const employeePermissions = getEmployeePermissions(employeeId);
    const orgTypes = new Set(employeePermissions.map((p: any) => p.organization?.type).filter(Boolean));
    const typeLabels: Record<string, string> = {
      event_service: "Eventos",
      restaurant: "Restaurantes", 
      activity_service: "Atividades",
      rental_service: "Aluguel",
      accommodation: "Hospedagens"
    };
    
    return Array.from(orgTypes).map(type => typeLabels[type as string] || type).join(", ");
  }

  // Função para abrir o modal de permissões
  const openPermissions = (employee: any) => {
    setSelectedEmployee({
      id: employee._id,
      name: employee.name || "Sem nome"
    });
    setPermissionsOpen(true);
  }

  if (!user || (user.role !== "partner" && user.role !== "master")) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-600">Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  const isDataLoading = isLoadingEmployees || isLoadingOrganizations || isLoadingPermissions;

  return (
          <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Colaboradores</h1>
          <p className="text-slate-600">
            Gerencie seus colaboradores e atribua empreendimentos específicos
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Convidar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreateEmployee}>
              <DialogHeader>
                <DialogTitle>Convidar Novo Colaborador</DialogTitle>
                <DialogDescription>
                  Convide um colaborador que terá acesso aos empreendimentos que você atribuir.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite o nome completo"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Digite o e-mail"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    disabled={isLoading}
                    required
                  />
                </div>

              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando convite...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {isDataLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="animate-pulse bg-slate-200 h-4 w-32 rounded"></div>
                <div className="animate-pulse bg-slate-200 h-4 w-4 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse bg-slate-200 h-8 w-16 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees?.length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Com Empreendimentos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees?.filter(emp => countAssignedOrganizations(emp._id) > 0).length || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Convites Pendentes</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {employees?.filter(emp => !(emp as any).clerkId).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employees List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Colaboradores</CardTitle>
          <CardDescription>
            Gerencie todos os colaboradores e atribua empreendimentos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isDataLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : !employees || employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Nenhum colaborador encontrado
              </h3>
              <p className="text-slate-600 mb-4">
                Convide o primeiro colaborador para começar.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Empreendimentos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[150px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.image} alt={employee.name || ""} />
                          <AvatarFallback>
                            {employee.name?.substring(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {employee.name || "Nome não informado"}
                          </div>
                          {(employee as any).phone && (
                            <div className="text-sm text-slate-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {(employee as any).phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {employee.email || "E-mail não informado"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {countAssignedOrganizations(employee._id) > 0 ? (
                        <div className="space-y-1">
                          <Badge variant="outline">
                            {countAssignedOrganizations(employee._id)} empreendimentos
                          </Badge>
                          <div className="text-xs text-slate-500">
                            {getOrganizationTypesSummary(employee._id)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">Nenhum empreendimento</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(employee as any).clerkId ? (
                        <Badge variant="default">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Convite Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPermissions(employee)}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          Atribuir
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Permissões */}
      {selectedEmployee && (
        <PermissionsManager
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          open={permissionsOpen}
          onOpenChange={setPermissionsOpen}
          organizations={organizations || []}
          currentPermissions={getEmployeePermissions(selectedEmployee.id)}
          onPermissionsChange={() => {}} // Os dados já são reativos
        />
      )}
    </div>
  )
} 