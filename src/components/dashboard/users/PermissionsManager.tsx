import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGrantAssetPermission, useRevokeAssetPermission } from "@/lib/services/employeeService";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import type { Id } from "@/../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Tipos para as permissões e assets
export type AssetType = "events" | "restaurants" | "activities" | "media";
export type Permission = "view" | "edit" | "manage";

type AssetId = Id<"events"> | Id<"restaurants"> | Id<"activities"> | Id<"media">;

export type Asset = {
  _id: AssetId;
  title?: string;
  name?: string;
  description?: string;
  type: AssetType;
};

export type AssetPermission = {
  _id: Id<"assetPermissions">;
  assetId: string;
  assetType: AssetType;
  permissions: string[];
  employeeId: Id<"users">;
  partnerId: Id<"users">;
};

type PermissionsManagerProps = {
  employeeId: Id<"users">;
  employeeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: {
    events?: Asset[];
    restaurants?: Asset[];
    activities?: Asset[];
    media?: Asset[];
  };
  currentPermissions: AssetPermission[];
  onPermissionsChange?: () => void;
};

export default function PermissionsManager({
  employeeId,
  employeeName,
  open,
  onOpenChange,
  assets,
  currentPermissions,
  onPermissionsChange
}: PermissionsManagerProps) {
  const grantPermission = useGrantAssetPermission();
  const revokePermission = useRevokeAssetPermission();
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedAssetType, setSelectedAssetType] = useState<AssetType>("events");
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  
  // Reset selections when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedAssetType("events");
      setSelectedAssetId("");
      setSelectedPermissions([]);
    }
  }, [open]);

  // Update asset ID when asset type changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setSelectedAssetId("");
  }, [selectedAssetType]);

  // Agrupar permissões por tipo de asset
  const permissionsByType: Record<AssetType, AssetPermission[]> = {
    events: [],
    restaurants: [],
    activities: [],
    media: []
  };

  for (const permission of currentPermissions) {
    if (permissionsByType[permission.assetType as AssetType]) {
      permissionsByType[permission.assetType as AssetType].push(permission);
    }
  }

  // Tradução dos tipos de asset para exibição
  const assetTypeLabels: Record<AssetType, string> = {
    events: "Eventos",
    restaurants: "Restaurantes",
    activities: "Atividades",
    media: "Mídias"
  };

  // Tradução das permissões
  const permissionLabels: Record<Permission, string> = {
    view: "Visualizar",
    edit: "Editar",
    manage: "Gerenciar"
  };

  // Encontrar o nome do asset baseado no ID
  const getAssetName = (assetId: string, assetType: AssetType): string => {
    const assetList = assets[assetType] || [];
    const asset = assetList.find(a => a._id.toString() === assetId);
    return asset?.title || asset?.name || "Asset sem nome";
  };

  // Adicionar permissão
  const handleAddPermission = async () => {
    if (!selectedAssetId || selectedPermissions.length === 0) {
      toast.error("Selecione um asset e pelo menos uma permissão");
      return;
    }

    try {
      setIsLoading(true);
      await grantPermission({
        employeeId,
        assetId: selectedAssetId,
        assetType: selectedAssetType,
        permissions: selectedPermissions
      });
      
      toast.success("Permissão concedida com sucesso");
      setSelectedAssetId("");
      setSelectedPermissions([]);
      
      if (onPermissionsChange) {
        onPermissionsChange();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao conceder permissão");
    } finally {
      setIsLoading(false);
    }
  };

  // Remover permissão
  const handleRemovePermission = async (permissionId: Id<"assetPermissions">) => {
    try {
      setIsLoading(true);
      await revokePermission(permissionId);
      
      toast.success("Permissão revogada com sucesso");
      
      if (onPermissionsChange) {
        onPermissionsChange();
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao revogar permissão");
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
          <DialogTitle>Gerenciar permissões para {employeeName}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Tabs defaultValue="add" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">Adicionar permissão</TabsTrigger>
              <TabsTrigger value="view">Permissões atuais</TabsTrigger>
            </TabsList>
            
            <TabsContent value="add" className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assetType">Tipo de asset</Label>
                  <Select 
                    value={selectedAssetType}
                    onValueChange={(value) => setSelectedAssetType(value as AssetType)}
                  >
                    <SelectTrigger id="assetType">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(assetTypeLabels).map(([type, label]) => (
                        <SelectItem key={type} value={type}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assetId">Asset</Label>
                  <Select 
                    value={selectedAssetId}
                    onValueChange={setSelectedAssetId}
                    disabled={!assets[selectedAssetType]?.length}
                  >
                    <SelectTrigger id="assetId">
                      <SelectValue placeholder="Selecione o asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {(assets[selectedAssetType] || []).map((asset) => (
                        <SelectItem key={asset._id.toString()} value={asset._id.toString()}>
                          {asset.title || asset.name || "Asset sem nome"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="block mb-3">Permissões</Label>
                <div className="flex flex-col gap-3">
                  {Object.entries(permissionLabels).map(([perm, label]) => (
                    <div className="flex items-center space-x-2" key={perm}>
                      <Checkbox 
                        id={`perm-${perm}`}
                        checked={selectedPermissions.includes(perm as Permission)}
                        onCheckedChange={() => togglePermission(perm as Permission)}
                      />
                      <Label 
                        htmlFor={`perm-${perm}`}
                        className="font-normal cursor-pointer"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleAddPermission}
                  disabled={!selectedAssetId || selectedPermissions.length === 0 || isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Conceder permissão
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="view">
              <Tabs defaultValue="events" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  {Object.entries(assetTypeLabels).map(([type, label]) => (
                    <TabsTrigger key={type} value={type}>
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {Object.entries(permissionsByType).map(([type, permissions]) => (
                  <TabsContent key={type} value={type} className="py-4">
                    {permissions.length > 0 ? (
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                          {permissions.map((permission) => (
                            <Card key={permission._id.toString()} className="overflow-hidden">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-md">
                                  {getAssetName(permission.assetId, type as AssetType)}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="flex justify-between items-center">
                                  <div className="flex flex-wrap gap-1">
                                    {permission.permissions.map((perm) => (
                                      <Badge 
                                        key={perm} 
                                        variant="outline"
                                        className="mr-1"
                                      >
                                        <ShieldCheck className="mr-1 h-3 w-3 text-green-500" />
                                        {permissionLabels[perm as Permission] || perm}
                                      </Badge>
                                    ))}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemovePermission(permission._id)}
                                    disabled={isLoading}
                                  >
                                    <ShieldX className="h-4 w-4 mr-1" />
                                    Revogar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhuma permissão para {assetTypeLabels[type as AssetType]}
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
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