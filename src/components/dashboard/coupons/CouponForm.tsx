"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CouponFormData {
  _id?: string;
  code: string;
  name: string;
  description: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  maxDiscountAmount?: number;
  minimumOrderValue?: number;
  usageLimit?: number;
  userUsageLimit?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  globalApplication: {
    isGlobal: boolean;
    assetTypes: string[];
  };
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
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    name: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    validFrom: new Date().toISOString().slice(0, 16),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    isActive: true,
    globalApplication: {
      isGlobal: true,
      assetTypes: ["activities", "events", "restaurants", "vehicles", "accommodations", "packages"],
    },
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
    if (!formData.globalApplication.isGlobal) {
      finalErrors.applicability = "Aplicação global deve estar habilitada";
    }

    if (formData.globalApplication.assetTypes.length === 0) {
      finalErrors.assetTypes = "Selecione pelo menos um tipo de serviço";
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
        // Adicionar campos padrão para compatibilidade
        type: "public" as const,
        isPubliclyVisible: true,
        stackable: false,
        autoApply: false,
        notifyOnExpiration: false,
        globalApplication: formData.globalApplication,
        applicableAssets: [],
        allowedUsers: [],
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error saving coupon:", error);
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

        <div className="space-y-6">
          {/* Informações básicas e desconto */}
          <div className="space-y-6">
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
                          const year = now.getFullYear();
                          const month = String(now.getMonth() + 1).padStart(2, '0');
                          const day = String(now.getDate()).padStart(2, '0');
                          const hours = String(now.getHours()).padStart(2, '0');
                          const minutes = String(now.getMinutes()).padStart(2, '0');
                          const formattedNow = `${year}-${month}-${day}T${hours}:${minutes}`;
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
          </div>

          {/* Limites e restrições */}
          <div className="space-y-6">
            {/* Regras de Uso */}
            <Card>
              <CardHeader>
                <CardTitle>Limites de Uso</CardTitle>
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
              </CardContent>
            </Card>

            {/* Tipos de Serviços */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Serviços</CardTitle>
                <CardDescription>
                  Selecione em quais tipos de serviços o cupom pode ser usado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {errors.assetTypes && (
                  <p className="text-sm text-red-500">{errors.assetTypes}</p>
                )}
                {errors.applicability && (
                  <p className="text-sm text-red-500">{errors.applicability}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

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