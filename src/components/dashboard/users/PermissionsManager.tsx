import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGrantOrganizationPermission, useRevokeOrganizationPermission } from "@/lib/services/employeeService";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, ShieldX, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Tipos para as permissões e organizações
export type Permission = "view" | "edit" | "manage";

export type Organization = {
  _id: Id<"partnerOrganizations">;
  name: string;
  description?: string;
  type: string;
  image?: string;
  isActive: boolean;
};

export type OrganizationPermission = {
  _id: Id<"organizationPermissions">;
  organizationId: Id<"partnerOrganizations">;
  permissions: string[];
  employeeId: Id<"users">;
  partnerId: Id<"users">;
  organization?: {
    id: Id<"partnerOrganizations">;
    name: string;
    description?: string;
    type: string;
    image?: string;
  };
};

type PermissionsManagerProps = {
  employeeId: Id<"users">;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: Organization[];
  currentPermissions: OrganizationPermission[];
  onPermissionsChange?: () => void;
};

export default function PermissionsManager({
  employeeId,
  employeeName,
  open,
  onOpenChange,
  organizations,
  currentPermissions,
  onPermissionsChange
}: PermissionsManagerProps) {
  

  
  const grantPermission = useGrantOrganizationPermission();
  const revokePermission = useRevokeOrganizationPermission();
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  
  // Reset selections when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedOrganizationId("");
      setSelectedPermissions([]);
    }
  }, [open]);

  // Tradução dos tipos de organização para exibição
  const organizationTypeLabels: Record<string, string> = {
    event_service: "Serviço de Eventos",
    restaurant: "Restaurante",
    activity_service: "Serviço de Atividades",
    rental_service: "Serviço de Aluguel",
    accommodation: "Hospedagem"
  };

  // Tradução das permissões
  const permissionLabels: Record<Permission, string> = {
    view: "Visualizar",
    edit: "Editar",
    manage: "Gerenciar"
  };

  // Encontrar o nome da organização baseado no ID
  const getOrganizationName = (organizationId: string): string => {
    const organization = organizations.find(org => org._id.toString() === organizationId);
    return organization?.name || "Organização sem nome";
  };

  // Verificar se uma organização já tem permissões atribuídas
  const hasPermission = (organizationId: string): boolean => {
    return currentPermissions.some(permission => 
      permission.organizationId.toString() === organizationId
    );
  };

  // Obter organizações disponíveis (que ainda não têm permissões)
  const availableOrganizations = organizations.filter(org => 
    !hasPermission(org._id.toString())
  );

  // Adicionar permissão
  const handleAddPermission = async () => {
    if (!selectedOrganizationId || selectedPermissions.length === 0) {
      toast.error("Selecione uma organização e pelo menos uma permissão");
      return;
    }

    try {
      setIsLoading(true);
      await grantPermission({
        employeeId,
        organizationId: selectedOrganizationId as Id<"partnerOrganizations">,
        permissions: selectedPermissions
      });
      
      toast.success("Organização atribuída com sucesso");
      setSelectedOrganizationId("");
      setSelectedPermissions([]);
      
      if (onPermissionsChange) {
        onPermissionsChange();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao atribuir organização");
    } finally {
      setIsLoading(false);
    }
  };

  // Remover permissão
  const handleRemovePermission = async (permissionId: Id<"organizationPermissions">) => {
    try {
      setIsLoading(true);
      await revokePermission(permissionId);
      
      toast.success("Organização removida com sucesso");
      
      if (onPermissionsChange) {
        onPermissionsChange();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao remover organização");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle permission in selection
  const togglePermission = (permission: Permission) => {
    setSelectedPermissions(current => 
      current.includes(permission)
        ? current.filter(p => p !== permission)
        : [...current, permission]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle>Atribuir Organizações para {employeeName}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Tabs defaultValue="add" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">Atribuir Nova</TabsTrigger>
              <TabsTrigger value="current">Organizações Atuais</TabsTrigger>
            </TabsList>
            
            <TabsContent value="add" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organização</Label>
                  <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma organização" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOrganizations.length > 0 ? (
                        availableOrganizations.map((org) => (
                          <SelectItem key={org._id.toString()} value={org._id.toString()}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{org.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {organizationTypeLabels[org.type] || org.type}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          Todas as organizações já foram atribuídas
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Permissões</Label>
                  <div className="space-y-2">
                    {(["view", "edit", "manage"] as Permission[]).map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission}
                          checked={selectedPermissions.includes(permission)}
                          onCheckedChange={() => togglePermission(permission)}
                        />
                        <Label htmlFor={permission} className="text-sm">
                          {permissionLabels[permission]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={handleAddPermission}
                  disabled={isLoading || !selectedOrganizationId || selectedPermissions.length === 0}
                  className="w-full"
                >
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Atribuir Organização
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="current" className="space-y-4">
              <ScrollArea className="h-[400px] w-full">
                {currentPermissions.length > 0 ? (
                  <div className="space-y-3">
                    {currentPermissions.map((permission) => (
                      <Card key={permission._id.toString()}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <div>
                                <CardTitle className="text-sm">
                                  {permission.organization?.name || getOrganizationName(permission.organizationId.toString())}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                  {organizationTypeLabels[permission.organization?.type || ""] || permission.organization?.type}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemovePermission(permission._id)}
                              disabled={isLoading}
                            >
                              <ShieldX className="h-3 w-3 mr-1" />
                              Remover
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-1">
                            {permission.permissions.map((perm) => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {permissionLabels[perm as Permission] || perm}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma organização atribuída ainda
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 