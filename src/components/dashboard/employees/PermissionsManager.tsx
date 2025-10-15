"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Key, 
  Search, 
  Plus, 
  Trash2, 
  Building2, 
  Calendar, 
  Car, 
  Home, 
  MapPin,
  Loader2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Types
type Employee = {
  _id: Id<"users">;
  name?: string;
  email?: string;
  image?: string;
  organizationName?: string;
  clerkId?: string;
};

type Permission = {
  _id: string;
  assetId?: string;
  assetType: string;
  permissions: string[];
  note?: string;
  asset?: any;
  partner?: any;
  type?: 'asset' | 'organization';
  organizationId?: string;
  permissionId?: string;
  organization?: any;
};

interface PermissionsManagerProps {
  employee: Employee;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Simplified asset type mapping for display purposes only
const ASSET_TYPES = {
  restaurants: { label: "Restaurantes", icon: Building2 },
  events: { label: "Eventos", icon: Calendar },
  activities: { label: "Atividades", icon: MapPin },
  vehicles: { label: "Veículos", icon: Car },
  organizations: { label: "Organizações", icon: Home }
};

export function PermissionsManager({ employee, open, onOpenChange }: PermissionsManagerProps) {
  const [activeTab, setActiveTab] = useState("permissions");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Organization access states  
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [organizationNote, setOrganizationNote] = useState("");

  // Queries
  const employeePermissions = useQuery(
    api.domains.rbac.queries.listEmployeePermissions,
    // Skip query if employee is in a failed/temp state or doesn't have a valid ID
    (employee._id && !employee.clerkId?.startsWith("failed_") && !employee.clerkId?.startsWith("temp_")) 
      ? { employeeId: employee._id }
      : undefined
  );

  const employeeOrganizationPermissions = useQuery(
    api.domains.rbac.queries.listEmployeeOrganizations,
    // Skip query if employee is in a failed/temp state or doesn't have a valid ID
    (employee._id && !employee.clerkId?.startsWith("failed_") && !employee.clerkId?.startsWith("temp_")) 
      ? { employeeId: employee._id }
      : undefined
  );

  // Get available organizations
  const organizations = useQuery(api.domains.rbac.queries.listPartnerOrganizations);

  // Mutations
  const revokePermission = useMutation(api.domains.rbac.mutations.revokeAssetPermission);
  const revokeOrganizationPermission = useMutation(api.domains.rbac.mutations.revokeOrganizationPermission);
  const grantOrganizationPermission = useMutation(api.domains.rbac.mutations.grantOrganizationPermission);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedOrganizationId("");
      setOrganizationNote("");
    }
  }, [open]);

  // Combine both asset and organization permissions
  const allPermissions = [
    ...(employeePermissions || []).map(p => ({ ...p, type: 'asset' })),
    ...(employeeOrganizationPermissions || []).map(p => ({ 
      ...p, 
      type: 'organization',
      assetType: 'organizations',
      assetId: p.organizationId,
      _id: p.permissionId,
      asset: {
        name: p.organization?.name,
        description: p.organization?.description,
        isActive: p.organization?.isActive,
        location: 'Organização'
      }
    }))
  ];

  // Filter permissions based on search
  const filteredPermissions = allPermissions.filter(permission => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (permission.assetType?.toLowerCase().includes(query)) ||
      (permission.assetId?.toLowerCase().includes(query)) ||
      (permission.permissions?.some(p => p.toLowerCase().includes(query))) ||
      (permission.asset?.name?.toLowerCase().includes(query))
    );
  });

  // Handle granting organization access (simplified)
  const handleGrantOrganizationAccess = async () => {
    if (!selectedOrganizationId) {
      toast.error("Por favor, selecione uma organização");
      return;
    }

    setIsSubmitting(true);
    try {
      await grantOrganizationPermission({
        employeeId: employee._id,
        organizationId: selectedOrganizationId,
        permissions: ["view", "edit", "manage", "full_access"], // Full access automatically
        note: organizationNote.trim() || "Acesso completo concedido automaticamente",
      });

      toast.success("Acesso à organização concedido com sucesso!");
      
      // Reset form
      setSelectedOrganizationId("");
      setOrganizationNote("");
    } catch (error) {
      console.error("Error granting organization access:", error);
      toast.error("Erro ao conceder acesso à organização");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle revoking permission
  const handleRevokePermission = async (permission: Permission) => {
    if (!confirm("Tem certeza que deseja remover esta permissão?")) {
      return;
    }

    try {
      if (permission.type === 'organization') {
        await revokeOrganizationPermission({ permissionId: permission._id });
      } else {
        await revokePermission({ permissionId: permission._id });
      }
      toast.success("Permissão removida com sucesso!");
    } catch (error) {
      console.error("Error revoking permission:", error);
      toast.error("Erro ao remover permissão");
    }
  };

  // Get asset name for display
  const getAssetName = (permission: Permission) => {
    const assetType = ASSET_TYPES[permission.assetType as keyof typeof ASSET_TYPES];
    if (permission.asset) {
      return permission.asset.name || permission.asset.title || `${assetType?.label || permission.assetType}`;
    }
    return `${assetType?.label || permission.assetType} (${permission.assetId?.slice(0, 8) || 'N/A'}...)`;
  };

  // Get permission badges
  const getPermissionBadges = (permissions: string[]) => {
    const permissionLabels: Record<string, string> = {
      view: "Visualizar",
      edit: "Editar",
      manage: "Gerenciar",
      full_access: "Acesso Total",
      reservations: "Reservas",
      bookings: "Reservas"
    };
    
    return permissions.map(permission => {
      const label = permissionLabels[permission] || permission;
      
      // Different colors for different permission levels
      const variant = permission === "manage" || permission === "full_access" ? "default" : 
                    permission === "edit" ? "secondary" : 
                    "outline";
      
      return (
        <Badge key={permission} variant={variant} className="text-xs">
          {label}
        </Badge>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gerenciar Permissões - {employee.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="permissions">Permissões Atuais</TabsTrigger>
            <TabsTrigger value="grant">Conceder Permissão</TabsTrigger>
          </TabsList>

          {/* Current Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Permissões Atuais</h3>
                <p className="text-sm text-muted-foreground">
                  Gerencie as permissões de acesso do colaborador
                </p>
              </div>
              
              <Button
                onClick={() => setActiveTab("grant")}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nova Permissão
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar permissões..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Permissions List */}
            {(employee.clerkId?.startsWith("failed_") || employee.clerkId?.startsWith("temp_")) ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este colaborador está em processo de sincronização. As permissões estarão disponíveis após a sincronização ser concluída.
                </AlertDescription>
              </Alert>
            ) : (employeePermissions === undefined || employeeOrganizationPermissions === undefined) ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredPermissions.length > 0 ? (
              <div className="space-y-3">
                {filteredPermissions.map((permission) => {
                  const assetConfig = ASSET_TYPES[permission.assetType as keyof typeof ASSET_TYPES];
                  const IconComponent = assetConfig?.icon || AlertCircle;

                  return (
                    <Card key={permission._id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                              <IconComponent className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{getAssetName(permission)}</h4>
                              <p className="text-sm text-muted-foreground">
                                {assetConfig?.label || permission.assetType}
                              </p>
                              {permission.asset?.location && (
                                <p className="text-xs text-muted-foreground">
                                  📍 {permission.asset.location}
                                </p>
                              )}
                              {permission.asset?.isActive === false && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  Inativo
                                </Badge>
                              )}
                              {permission.note && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  📝 {permission.note}
                                </p>
                              )}
                              <div className="flex gap-1 mt-2">
                                {getPermissionBadges(permission.permissions)}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokePermission(permission)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este colaborador ainda não possui permissões específicas.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Grant Permission Tab */}
          <TabsContent value="grant" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Conceder Acesso à Organização</h3>
              <p className="text-sm text-muted-foreground">
                Conceda acesso completo a uma organização para este colaborador
              </p>
            </div>

            {(employee.clerkId?.startsWith("failed_") || employee.clerkId?.startsWith("temp_")) ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este colaborador está em processo de sincronização. Aguarde a sincronização ser concluída para gerenciar permissões.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">Sistema Simplificado</h4>
                  <p className="text-sm text-green-800">
                    Selecione uma organização e o colaborador terá <strong>acesso completo</strong> automaticamente 
                    (visualizar, editar, gerenciar) - como se fosse o próprio partner.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Organization Selection */}
                  <div className="space-y-2">
                    <Label>Organização *</Label>
                    <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId} disabled={isSubmitting}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma organização" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations?.map((org) => (
                          <SelectItem key={org._id} value={org._id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{org.name}</span>
                              <span className="text-xs text-gray-500 capitalize">
                                {org.type?.replace('_', ' ')}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedOrganizationId && (
                      <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        ✓ O colaborador terá acesso completo a esta organização
                      </p>
                    )}
                  </div>

                  {/* Organization Note */}
                  <div className="space-y-2">
                    <Label>Observações (opcional)</Label>
                    <Textarea
                      placeholder="Adicione observações sobre este acesso"
                      value={organizationNote}
                      onChange={(e) => setOrganizationNote(e.target.value)}
                      rows={2}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("permissions")}
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleGrantOrganizationAccess}
                      disabled={isSubmitting || !selectedOrganizationId}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Home className="h-4 w-4 mr-2" />
                      Conceder Acesso Total
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 