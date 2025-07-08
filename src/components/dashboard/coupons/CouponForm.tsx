"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, HelpCircle, Plus, X, Settings, Users, Package, ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CouponAssetSelection from "./CouponAssetSelection";
import CouponUserAssignment from "./CouponUserAssignment";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

interface CouponFormData {
  _id?: string;
  code: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  maxDiscountAmount?: number;
  minimumOrderValue?: number;
  maximumOrderValue?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  validFrom: string;
  validUntil: string;
  type: "public" | "private" | "first_purchase" | "returning_customer";
  isActive: boolean;
  isPubliclyVisible: boolean;
  stackable: boolean;
  autoApply: boolean;
  notifyOnExpiration: boolean;
  globalApplication: {
    isGlobal: boolean;
    assetTypes: string[];
  };
  applicableAssets: Array<{
    assetType: string;
    assetId: string;
    isActive: boolean;
  }>;
  allowedUsers: string[];
}

// Type for submission data with timestamps
interface CouponSubmissionData extends Omit<CouponFormData, 'validFrom' | 'validUntil'> {
  validFrom: number;
  validUntil: number;
}

interface CouponFormProps {
  initialData?: Partial<CouponFormData>;
  onSubmit: (data: CouponSubmissionData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

const ASSET_TYPES = [
  { value: "activities", label: "Atividades" },
  { value: "events", label: "Eventos" },
  { value: "restaurants", label: "Restaurantes" },
  { value: "vehicles", label: "Veículos" },
  { value: "accommodations", label: "Hospedagens" },
  { value: "packages", label: "Pacotes" },
];

export default function CouponForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  title = "Criar Cupom",
  description = "Configure os detalhes do cupom de desconto",
}: CouponFormProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    name: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    type: "public",
    isActive: true,
    isPubliclyVisible: true,
    stackable: false,
    autoApply: false,
    notifyOnExpiration: true,
    globalApplication: {
      isGlobal: true,
      assetTypes: [],
    },
    applicableAssets: [],
    allowedUsers: [],
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Buscar usuários já atribuídos ao cupom (para edição)
  const assignedUsersData = initialData?.allowedUsers && initialData.allowedUsers.length > 0
    ? initialData.allowedUsers.map(userId => ({ _id: userId, name: "", email: "", profileImage: "" }))
    : [];

  // Auto-gerar código do cupom
  const generateCouponCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code: result }));
  };

  // Validação em tempo real
  const validateField = (name: string, value: any) => {
    const newErrors = { ...errors };

    switch (name) {
      case "code":
        if (!value || value.trim().length === 0) {
          newErrors.code = "Código é obrigatório";
        } else if (value.length < 3) {
          newErrors.code = "Código deve ter pelo menos 3 caracteres";
        } else if (!/^[A-Z0-9-]+$/.test(value.toUpperCase())) {
          newErrors.code = "Código deve conter apenas letras, números e hífen";
        } else {
          delete newErrors.code;
        }
        break;

      case "name":
        if (!value || value.trim().length === 0) {
          newErrors.name = "Nome é obrigatório";
        } else {
          delete newErrors.name;
        }
        break;

      case "discountValue":
        if (value <= 0) {
          newErrors.discountValue = "Valor deve ser maior que zero";
        } else if (formData.discountType === "percentage" && value > 100) {
          newErrors.discountValue = "Desconto percentual não pode ser maior que 100%";
        } else {
          delete newErrors.discountValue;
        }
        break;

      case "validFrom":
      case "validUntil":
        if (formData.validFrom && formData.validUntil) {
          const fromDate = new Date(formData.validFrom);
          const untilDate = new Date(formData.validUntil);
          
          if (fromDate >= untilDate) {
            newErrors.validUntil = "Data de fim deve ser posterior à data de início";
          } else {
            delete newErrors.validFrom;
            delete newErrors.validUntil;
          }
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleAssetTypeToggle = (assetType: string, checked: boolean) => {
    const newAssetTypes = checked
      ? [...formData.globalApplication.assetTypes, assetType]
      : formData.globalApplication.assetTypes.filter(type => type !== assetType);

    setFormData(prev => ({
      ...prev,
      globalApplication: {
        ...prev.globalApplication,
        assetTypes: newAssetTypes,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação final
    const finalErrors: Record<string, string> = {};

    if (!formData.code.trim()) finalErrors.code = "Código é obrigatório";
    if (!formData.name.trim()) finalErrors.name = "Nome é obrigatório";
    if (!formData.description.trim()) finalErrors.description = "Descrição é obrigatória";
    if (formData.discountValue <= 0) finalErrors.discountValue = "Valor de desconto inválido";
    if (!formData.validFrom) finalErrors.validFrom = "Data de início é obrigatória";
    if (!formData.validUntil) finalErrors.validUntil = "Data de fim é obrigatória";

    // Validar aplicabilidade
    if (!formData.globalApplication.isGlobal && formData.applicableAssets.length === 0) {
      finalErrors.applicability = "Selecione pelo menos um tipo de aplicação";
    }

    // Validar usuários permitidos para cupons privados
    if (formData.type === "private" && formData.allowedUsers.length === 0) {
      finalErrors.allowedUsers = "Cupons privados devem ter pelo menos um usuário permitido";
    }

    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os erros no formulário.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Converter datas para timestamp
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        validFrom: new Date(formData.validFrom).getTime(),
        validUntil: new Date(formData.validUntil).getTime(),
      };

      await onSubmit(submitData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o cupom. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Regras</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Serviços</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Geral - Informações básicas e desconto */}
          <TabsContent value="general" className="space-y-6 mt-6">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Configure o código, nome e descrição do cupom
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">
                      Código do Cupom *
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="inline w-4 h-4 ml-1 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Código único que os clientes usarão para aplicar o desconto</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
                        placeholder="Ex: DESCONTO20"
                        className={errors.code ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateCouponCode}
                        disabled={isLoading}
                      >
                        Gerar
                      </Button>
                    </div>
                    {errors.code && (
                      <p className="text-sm text-red-500">{errors.code}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Cupom *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Ex: Desconto de Verão"
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Descreva os detalhes e condições do cupom..."
                    rows={3}
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500">{errors.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Configuração de Desconto */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Desconto</CardTitle>
                <CardDescription>
                  Defina o tipo e valor do desconto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Tipo de Desconto</Label>
                  <RadioGroup
                    value={formData.discountType}
                    onValueChange={(value: "percentage" | "fixed_amount") =>
                      handleInputChange("discountType", value)
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="percentage" id="percentage" />
                      <Label htmlFor="percentage">Percentual (%)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fixed_amount" id="fixed_amount" />
                      <Label htmlFor="fixed_amount">Valor Fixo (R$)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountValue">
                      Valor do Desconto *
                    </Label>
                    <div className="relative">
                      <Input
                        id="discountValue"
                        type="number"
                        min="0"
                        max={formData.discountType === "percentage" ? "100" : undefined}
                        step={formData.discountType === "percentage" ? "1" : "0.01"}
                        value={formData.discountValue}
                        onChange={(e) => handleInputChange("discountValue", parseFloat(e.target.value) || 0)}
                        className={errors.discountValue ? "border-red-500" : ""}
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                        {formData.discountType === "percentage" ? "%" : "R$"}
                      </span>
                    </div>
                    {errors.discountValue && (
                      <p className="text-sm text-red-500">{errors.discountValue}</p>
                    )}
                  </div>

                  {formData.discountType === "percentage" && (
                    <div className="space-y-2">
                      <Label htmlFor="maxDiscountAmount">
                        Valor Máximo de Desconto (R$)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="inline w-4 h-4 ml-1 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Limite máximo do desconto para evitar valores muito altos</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Input
                        id="maxDiscountAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.maxDiscountAmount || ""}
                        onChange={(e) => handleInputChange("maxDiscountAmount", parseFloat(e.target.value) || undefined)}
                        placeholder="Opcional"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Status e Ativação */}
            <Card>
              <CardHeader>
                <CardTitle>Status e Ativação</CardTitle>
                <CardDescription>
                  Configure quando e como o cupom estará ativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                  />
                  <Label htmlFor="isActive">Cupom ativo</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="validFrom">Data de Início *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const now = new Date();
                          const formattedNow = now.toISOString().slice(0, 16);
                          handleInputChange("validFrom", formattedNow);
                        }}
                        className="text-xs"
                      >
                        Ativar Agora
                      </Button>
                    </div>
                    <Input
                      id="validFrom"
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={(e) => handleInputChange("validFrom", e.target.value)}
                      className={errors.validFrom ? "border-red-500" : ""}
                    />
                    {errors.validFrom && (
                      <p className="text-sm text-red-500">{errors.validFrom}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Data de Fim *</Label>
                    <Input
                      id="validUntil"
                      type="datetime-local"
                      value={formData.validUntil}
                      onChange={(e) => handleInputChange("validUntil", e.target.value)}
                      className={errors.validUntil ? "border-red-500" : ""}
                    />
                    {errors.validUntil && (
                      <p className="text-sm text-red-500">{errors.validUntil}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Regras - Limites e restrições */}
          <TabsContent value="rules" className="space-y-6 mt-6">
            {/* Regras de Aplicação */}
            <Card>
              <CardHeader>
                <CardTitle>Regras de Aplicação</CardTitle>
                <CardDescription>
                  Configure as condições para uso do cupom
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minimumOrderValue">
                      Valor Mínimo do Pedido (R$)
                    </Label>
                    <Input
                      id="minimumOrderValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minimumOrderValue || ""}
                      onChange={(e) => handleInputChange("minimumOrderValue", parseFloat(e.target.value) || undefined)}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maximumOrderValue">
                      Valor Máximo do Pedido (R$)
                    </Label>
                    <Input
                      id="maximumOrderValue"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maximumOrderValue || ""}
                      onChange={(e) => handleInputChange("maximumOrderValue", parseFloat(e.target.value) || undefined)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usageLimit">
                      Limite Total de Uso
                    </Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      value={formData.usageLimit || ""}
                      onChange={(e) => handleInputChange("usageLimit", parseInt(e.target.value) || undefined)}
                      placeholder="Ilimitado"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userUsageLimit">
                      Limite por Usuário
                    </Label>
                    <Input
                      id="userUsageLimit"
                      type="number"
                      min="1"
                      value={formData.userUsageLimit || ""}
                      onChange={(e) => handleInputChange("userUsageLimit", parseInt(e.target.value) || undefined)}
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tipo e Visibilidade */}
            <Card>
              <CardHeader>
                <CardTitle>Tipo e Visibilidade</CardTitle>
                <CardDescription>
                  Configure quem pode usar o cupom
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Tipo de Cupom</Label>
                  <RadioGroup
                    value={formData.type}
                    onValueChange={(value: any) => handleInputChange("type", value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public">Público - Qualquer pessoa pode usar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private">Privado - Apenas usuários específicos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="first_purchase" id="first_purchase" />
                      <Label htmlFor="first_purchase">Primeira Compra - Novos clientes apenas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="returning_customer" id="returning_customer" />
                      <Label htmlFor="returning_customer">Cliente Recorrente - Clientes que já compraram</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPubliclyVisible"
                    checked={formData.isPubliclyVisible}
                    onCheckedChange={(checked) => handleInputChange("isPubliclyVisible", checked)}
                  />
                  <Label htmlFor="isPubliclyVisible">Visível publicamente na listagem de cupons</Label>
                </div>
              </CardContent>
            </Card>

            {/* Configurações Avançadas */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações Avançadas</CardTitle>
                <CardDescription>
                  Opções adicionais para o cupom
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="stackable"
                      checked={formData.stackable}
                      onCheckedChange={(checked) => handleInputChange("stackable", checked)}
                    />
                    <Label htmlFor="stackable">
                      Empilhável - Pode ser usado com outros cupons
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="autoApply"
                      checked={formData.autoApply}
                      onCheckedChange={(checked) => handleInputChange("autoApply", checked)}
                    />
                    <Label htmlFor="autoApply">
                      Aplicação automática - Aplicar automaticamente quando elegível
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="notifyOnExpiration"
                      checked={formData.notifyOnExpiration}
                      onCheckedChange={(checked) => handleInputChange("notifyOnExpiration", checked)}
                    />
                    <Label htmlFor="notifyOnExpiration">
                      Notificar sobre expiração próxima
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Serviços - Seleção de assets */}
          <TabsContent value="assets" className="space-y-6 mt-6">
            {/* Aplicabilidade Global */}
            <Card>
              <CardHeader>
                <CardTitle>Aplicabilidade</CardTitle>
                <CardDescription>
                  Defina em quais serviços o cupom pode ser usado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isGlobal"
                    checked={formData.globalApplication.isGlobal}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        globalApplication: { ...prev.globalApplication, isGlobal: checked }
                      }))
                    }
                  />
                  <Label htmlFor="isGlobal">Aplicar globalmente em tipos de serviços</Label>
                </div>

                {formData.globalApplication.isGlobal && (
                  <div className="space-y-3">
                    <Label>Tipos de Serviços</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {ASSET_TYPES.map((assetType) => (
                        <div key={assetType.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={assetType.value}
                            checked={formData.globalApplication.assetTypes.includes(assetType.value)}
                            onCheckedChange={(checked) => 
                              handleAssetTypeToggle(assetType.value, checked as boolean)
                            }
                          />
                          <Label htmlFor={assetType.value}>{assetType.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.applicability && (
                  <p className="text-sm text-red-500">{errors.applicability}</p>
                )}
              </CardContent>
            </Card>

            {/* Seleção de Assets Específicos */}
            {!formData.globalApplication.isGlobal && (
              <CouponAssetSelection
                selectedAssets={formData.applicableAssets}
                onAssetsChange={(assets) => setFormData(prev => ({ ...prev, applicableAssets: assets }))}
                globalApplication={formData.globalApplication}
              />
            )}
          </TabsContent>

          {/* Tab Usuários - Atribuição de usuários */}
          <TabsContent value="users" className="space-y-6 mt-6">
            {formData.type === "private" ? (
              <CouponUserAssignment
                couponId={initialData?._id || ""}
                currentUsers={assignedUsersData}
                onUpdate={() => {
                  // Atualizar lista de usuários permitidos
                }}
              />
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-medium">Atribuição de Usuários</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        A atribuição de usuários está disponível apenas para cupons do tipo "Privado".
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Altere o tipo do cupom na aba "Regras" para habilitar esta funcionalidade.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : initialData ? "Atualizar Cupom" : "Criar Cupom"}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  );
} 