"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { useCurrentUser } from "@/lib/hooks/useCurrentUser"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Users, Shield, Key, CheckSquare, Trash2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

type Employee = {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
}

type Permission = {
  permissionId: string;
  assetId: string;
  assetType: string;
  permissions: string[];
  note?: string;
  asset: any;
  partner?: {
    id: string;
    name?: string;
    email?: string;
  } | null;
}

interface AssetPermissionsProps {
  assetId: string;
  assetType: string;
  assetName: string;
}

export function AssetPermissions({ assetId, assetType, assetName }: AssetPermissionsProps) {
  const { user } = useCurrentUser()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [note, setNote] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Buscar lista de employees do parceiro atual
  const employees = useQuery(api.domains.rbac.queries.listEmployees)
  const permissions = useQuery(api.domains.rbac.queries.listAllAssetPermissions)
  
  // Mutations para adicionar/remover permissões
  const grantPermission = useMutation(api.domains.rbac.mutations.grantAssetPermission)
  const revokePermission = useMutation(api.domains.rbac.mutations.revokeAssetPermission)
  
  // Filtra employees com base na pesquisa
  const filteredEmployees = employees?.filter(employee => {
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return (
      employee.name?.toLowerCase().includes(query) ||
      employee.email?.toLowerCase().includes(query)
    )
  }) || []
  
  // Verifica se um employee já tem permissão para este asset
  const hasPermission = (employeeId: string) => {
    return permissions?.some(
      p => p.assetId === assetId && 
           p.assetType === assetType && 
           // Como a propriedade employeeId não está sendo retornada no tipo Permission,
           // precisamos verificar a permissão de outra forma
           permissions.find(permission => 
             permission.assetId === assetId && 
             permission.assetType === assetType
           )
    )
  }
  
  // Concede permissão a um employee
  const handleGrantPermission = async () => {
    if (!selectedEmployeeId) {
      toast.error("Selecione um funcionário")
      return
    }
    
    if (selectedPermissions.length === 0) {
      toast.error("Selecione pelo menos uma permissão")
      return
    }
    
    try {
      await grantPermission({
        employeeId: selectedEmployeeId as any,
        assetId,
        assetType,
        permissions: selectedPermissions,
        note: note || undefined
      })
      
      toast.success("Permissão concedida com sucesso")
      setDialogOpen(false)
      setSelectedEmployeeId(null)
      setSelectedPermissions([])
      setNote("")
    } catch (error) {
      console.error("Erro ao conceder permissão:", error)
      toast.error("Erro ao conceder permissão")
    }
  }
  
  // Remove a permissão de um employee
  const handleRevokePermission = async (permissionId: string) => {
    if (!confirm("Tem certeza que deseja remover esta permissão?")) {
      return
    }
    
    try {
      await revokePermission({
        permissionId: permissionId as any
      })
      
      toast.success("Permissão removida com sucesso")
    } catch (error) {
      console.error("Erro ao remover permissão:", error)
      toast.error("Erro ao remover permissão")
    }
  }
  
  // Filtra as permissões para o asset atual
  const assetPermissions = permissions?.filter(
    p => p.assetId === assetId && p.assetType === assetType
  ) || []
  
  // Mapeia tipos de permissão para rótulos mais amigáveis
  const permissionLabels = {
    view: "Visualizar",
    edit: "Editar",
    manage: "Gerenciar"
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium">Gerenciar Permissões</h3>
          <p className="text-sm text-gray-500">
            Controle quais funcionários podem acessar {assetName}
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Acesso
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Permissão</DialogTitle>
              <DialogDescription>
                Conceda acesso a um funcionário para este {assetType === "events" ? "evento" : "asset"}.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Funcionário</Label>
                <Select
                  value={selectedEmployeeId || ""}
                  onValueChange={(value) => setSelectedEmployeeId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEmployees.map((employee) => (
                      <SelectItem key={employee._id} value={employee._id}>
                        {employee.name || employee.email || "Funcionário sem nome"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Permissões</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="permission-view"
                      checked={selectedPermissions.includes("view")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPermissions([...selectedPermissions, "view"])
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== "view"))
                        }
                      }}
                    />
                    <Label htmlFor="permission-view">Visualizar</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="permission-edit"
                      checked={selectedPermissions.includes("edit")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPermissions([...selectedPermissions, "edit"])
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== "edit"))
                        }
                      }}
                    />
                    <Label htmlFor="permission-edit">Editar</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="permission-manage"
                      checked={selectedPermissions.includes("manage")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPermissions([...selectedPermissions, "manage"])
                        } else {
                          setSelectedPermissions(selectedPermissions.filter(p => p !== "manage"))
                        }
                      }}
                    />
                    <Label htmlFor="permission-manage">Gerenciar</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="note">Observação (opcional)</Label>
                <Input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Adicione uma nota sobre esta permissão"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGrantPermission}>
                Conceder Acesso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-md">
        {assetPermissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma permissão concedida para este {assetType === "events" ? "evento" : "asset"}.
          </div>
        ) : (
          <div className="space-y-3">
            {assetPermissions.map((permission) => {
              // Busca o employee para esta permissão
              const employee = employees?.find(
                e => e._id === permission.employeeId
              ) || null
              
              return (
                <Card key={permission.permissionId}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {employee?.name || employee?.email || "Funcionário"}
                        </CardTitle>
                        <CardDescription>
                          {employee?.email || "Sem email"}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevokePermission(permission.permissionId)}
                      >
                        <Trash2 className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-wrap gap-1">
                      {permission.permissions.map((p) => (
                        <Badge key={p} variant="outline">
                          {permissionLabels[p as keyof typeof permissionLabels] || p}
                        </Badge>
                      ))}
                    </div>
                    {permission.note && (
                      <p className="text-sm text-gray-500 mt-2">
                        {permission.note}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 