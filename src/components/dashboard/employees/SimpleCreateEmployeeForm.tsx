"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  UserPlus, 
  Key, 
  Building2, 
  Calendar, 
  Car, 
  Home, 
  MapPin,
  Plus,
  Trash2
} from "lucide-react";
import type { Id } from "@/../convex/_generated/dataModel";

const createEmployeeSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;

// Simplified organization selection - just organization IDs
type SelectedOrganization = {
  organizationId: string;
  note?: string;
};

interface SimpleCreateEmployeeFormProps {
  onSuccess?: (employeeId: Id<"users">) => void;
  onCancel?: () => void;
}

export function SimpleCreateEmployeeForm({ onSuccess, onCancel }: SimpleCreateEmployeeFormProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    employeeId?: Id<"users">;
    permissionGranted?: boolean;
  } | null>(null);

  // Selected organizations state
  const [selectedOrganizations, setSelectedOrganizations] = useState<SelectedOrganization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const [organizationNote, setOrganizationNote] = useState("");

    // Get user's organizations
  const organizations = useQuery(api.domains.rbac.queries.listPartnerOrganizations);

  // Create employee directly with password
  const createEmployeeDirectly = useMutation(api.domains.rbac.mutations.createEmployeeDirectly);
  
  // Grant organization permission mutation
  const grantOrganizationPermission = useMutation(api.domains.rbac.mutations.grantOrganizationPermission);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeSchema),
  });

  // Organization management functions
  const addOrganization = () => {
    if (!selectedOrganizationId) {
      return;
    }

    // Check if organization is already selected
    const alreadySelected = selectedOrganizations.some(
      org => org.organizationId === selectedOrganizationId
    );

    if (alreadySelected) {
      return;
    }

    const newSelection: SelectedOrganization = {
      organizationId: selectedOrganizationId,
      note: organizationNote.trim() || undefined,
    };

    setSelectedOrganizations([...selectedOrganizations, newSelection]);
    
    // Reset form
    setSelectedOrganizationId("");
    setOrganizationNote("");
  };

  const removeOrganization = (index: number) => {
    setSelectedOrganizations(selectedOrganizations.filter((_, i) => i !== index));
  };

  const getOrganizationName = (organizationId: string) => {
    const organization = organizations?.find(org => org._id === organizationId);
    return organization?.name || `Organização (${organizationId.slice(0, 8)}...)`;
  };

  const onSubmit = async (data: CreateEmployeeFormData) => {
    setIsCreating(true);
    setResult(null);

    try {
      // Create employee first
      const response = await createEmployeeDirectly({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      let organizationsGranted = 0;
      let organizationErrors = 0;

      // Grant full access to selected organizations
      if (selectedOrganizations.length > 0) {
        for (const organization of selectedOrganizations) {
          try {
            // Grant full access permissions (all available permissions)
            await grantOrganizationPermission({
              employeeId: response.employeeId,
              organizationId: organization.organizationId,
              permissions: ["view", "edit", "manage", "full_access"], // Full permissions by default
              note: organization.note || "Acesso completo concedido automaticamente",
            });
            organizationsGranted++;
          } catch (error) {
            console.error("Error granting organization access:", error);
            organizationErrors++;
          }
        }
      }

      // Create success message based on results
      let successMessage = "Colaborador criado com sucesso!";
      
      if (organizationsGranted > 0) {
        successMessage += ` Acesso concedido a ${organizationsGranted} organização(ões).`;
      }
      
      if (organizationErrors > 0) {
        successMessage += ` Atenção: ${organizationErrors} organização(ões) não puderam ser configuradas.`;
      }

      setResult({
        success: true,
        message: successMessage,
        employeeId: response.employeeId,
        permissionGranted: organizationsGranted > 0,
      });

      if (onSuccess) {
        onSuccess(response.employeeId);
      }

      // Reset form after success
      reset();
      setSelectedOrganizations([]);
    } catch (error) {
      console.error("Erro ao criar colaborador:", error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido ao criar colaborador",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (organizations === undefined) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando organizações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (organizations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Nenhuma Organização Encontrada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Você precisa ter pelo menos uma organização ativa para criar colaboradores.
          </p>
          <Button onClick={onCancel} variant="outline">
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Criar Novo Colaborador
        </CardTitle>
        <CardDescription>
          Crie um colaborador e configure permissões de acesso às organizações.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {result && (
          <Alert>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.message}
              {result.success && !result.permissionGranted && (
                <div className="mt-2 text-sm text-orange-600">
                  ⚠️ Lembre-se de configurar permissões manualmente na página de gestão de usuários.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
            <TabsTrigger value="permissions">Acesso às Organizações</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Ex: João Silva"
                  disabled={isCreating}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Ex: joao@empresa.com"
                  disabled={isCreating}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="Ex: **********"
                  disabled={isCreating}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>


            </TabsContent>

            {/* Organizations Access Tab */}
            <TabsContent value="permissions" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Acesso às Organizações
                </h3>
                <p className="text-sm text-muted-foreground">
                  Selecione as organizações que o colaborador terá acesso completo (opcional)
                </p>
              </div>

              {/* Selected Organizations */}
              {selectedOrganizations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Organizações Selecionadas ({selectedOrganizations.length})</h4>
                  {selectedOrganizations.map((org, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                              <Building2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{getOrganizationName(org.organizationId)}</h4>
                              <p className="text-sm text-muted-foreground">
                                Acesso completo (como partner)
                              </p>
                              {org.note && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  📝 {org.note}
                                </p>
                              )}
                              <div className="flex gap-1 mt-2">
                                <Badge variant="default" className="text-xs">
                                  Acesso Total
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOrganization(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={isCreating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Separator />
                </div>
              )}

              {/* Add New Organization */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">Conceder Acesso à Organização</h4>
                
                <div className="space-y-4">
                  {/* Organization Selection */}
                  <div className="space-y-2">
                    <Label>Organização</Label>
                    <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId} disabled={isCreating}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma organização" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations?.filter(org => 
                          !selectedOrganizations.some(selected => selected.organizationId === org._id)
                        ).map((org) => (
                          <SelectItem key={org._id} value={org._id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{org.name}</span>
                              <span className="text-xs text-gray-500 capitalize">
                                {org.type.replace('_', ' ')}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedOrganizationId && (
                      <p className="text-xs text-green-600">
                        ✓ O colaborador terá acesso completo a esta organização (visualizar, editar, gerenciar)
                      </p>
                    )}
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <Label>Observações (opcional)</Label>
                    <Textarea
                      placeholder="Adicione observações sobre este acesso"
                      value={organizationNote}
                      onChange={(e) => setOrganizationNote(e.target.value)}
                      rows={2}
                      disabled={isCreating}
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={addOrganization}
                    disabled={!selectedOrganizationId || isCreating}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Conceder Acesso
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Submit Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando Colaborador...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Criar Colaborador
                    {selectedOrganizations.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        +{selectedOrganizations.length} organização(ões)
                      </Badge>
                    )}
                  </>
                )}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isCreating}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </Tabs>

        {/* Info adicional */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            Sistema Simplificado de Permissões
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• O colaborador será criado diretamente no sistema</li>
            <li>• <strong>Acesso completo:</strong> O colaborador terá os mesmos poderes que você nas organizações selecionadas</li>
            <li>• Não é necessário configurar permissões específicas - o acesso é automático e total</li>
            <li>• Poderá visualizar, editar e gerenciar tudo na organização como se fosse o próprio partner</li>
            <li>• Login imediato com email e senha fornecidos</li>
            <li>• <strong>Importante:</strong> Informe as credenciais de acesso ao colaborador</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 