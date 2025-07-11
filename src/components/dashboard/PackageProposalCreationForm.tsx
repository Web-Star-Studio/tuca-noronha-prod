"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, X, FileText, Calendar, DollarSign, Package, Users, Clock } from "lucide-react";
import { toast } from "sonner";

interface PackageComponent {
  type: "accommodation" | "activity" | "event" | "restaurant" | "vehicle" | "transfer" | "guide" | "insurance" | "other";
  assetId?: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  included: boolean;
  optional: boolean;
  notes?: string;
}

interface PackageProposalCreationFormProps {
  packageRequestId: Id<"packageRequests">;
  onSuccess?: (proposalId: Id<"packageProposals">) => void;
  onCancel?: () => void;
}

const COMPONENT_TYPE_LABELS = {
  accommodation: "Hospedagem",
  activity: "Atividade",
  event: "Evento",
  restaurant: "Restaurante",
  vehicle: "Veículo",
  transfer: "Transfer",
  guide: "Guia",
  insurance: "Seguro",
  other: "Outros",
} as const;

const COMPONENT_TYPE_ICONS = {
  accommodation: "🏨",
  activity: "🏃",
  event: "🎉",
  restaurant: "🍽️",
  vehicle: "🚗",
  transfer: "🚌",
  guide: "🗺️",
  insurance: "🛡️",
  other: "📋",
} as const;

export function PackageProposalCreationForm({ 
  packageRequestId, 
  onSuccess, 
  onCancel 
}: PackageProposalCreationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentStep, setCurrentStep] = useState<'basic' | 'components' | 'pricing' | 'terms' | 'review'>('basic');

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    summary: "",
    validUntil: "",
    paymentTerms: "50% na reserva, 50% até 30 dias antes da viagem",
    cancellationPolicy: "Cancelamento gratuito até 30 dias antes da viagem",
    priority: "normal" as "low" | "normal" | "high" | "urgent",
    requiresApproval: false,
    tags: [] as string[],
    inclusions: [] as string[],
    exclusions: [] as string[],
  });

  const [components, setComponents] = useState<PackageComponent[]>([]);
  const [pricing, setPricing] = useState({
    subtotal: 0,
    taxes: 0,
    fees: 0,
    discount: 0,
    totalPrice: 0,
    currency: "BRL",
  });

  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newTag, setNewTag] = useState("");
  
  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Mutations and queries
  const createProposal = useMutation(api.domains.packageProposals.mutations.createPackageProposal);
  const analyzeRequest = useMutation(api.domains.packageProposals.actions.analyzePackageRequest);
  const applyTemplate = useQuery(api.domains.packageProposals.templates.applyProposalTemplate, {
    templateId: selectedTemplate || undefined,
    packageRequestId,
    variables: templateVariables,
  }, { enabled: !!selectedTemplate });
  
  const packageRequest = useQuery(api.domains.packageRequests.queries.getPackageRequest, {
    id: packageRequestId,
  });
  
  const templates = useQuery(api.domains.packageProposals.templates.listPackageProposalTemplates, {
    isActive: true,
  });

  // Auto-analyze package request on mount
  useEffect(() => {
    if (packageRequest && !showAnalysis) {
      handleAnalyzeRequest();
    }
  }, [packageRequest]);

  // Update pricing when components change
  useEffect(() => {
    const subtotal = components.reduce((sum, comp) => sum + comp.totalPrice, 0);
    const taxes = subtotal * 0.1; // 10% tax
    const fees = subtotal * 0.05; // 5% fees
    const totalPrice = subtotal + taxes + fees - pricing.discount;

    setPricing(prev => ({
      ...prev,
      subtotal,
      taxes,
      fees,
      totalPrice,
    }));
  }, [components, pricing.discount]);

  // Apply template data when template is loaded
  useEffect(() => {
    if (applyTemplate?.success && applyTemplate.proposalData) {
      const data = applyTemplate.proposalData;
      setFormData(prev => ({
        ...prev,
        title: data.title,
        description: data.description,
        summary: data.summary || "",
        paymentTerms: data.paymentTerms,
        cancellationPolicy: data.cancellationPolicy,
        inclusions: data.inclusions,
        exclusions: data.exclusions,
        validUntil: new Date(data.validUntil).toISOString().split('T')[0],
        priority: data.priority,
        requiresApproval: data.requiresApproval,
      }));
      
      setComponents(data.components);
      setPricing(prev => ({
        ...prev,
        currency: data.currency,
      }));
      
      toast.success("Template aplicado com sucesso!");
    }
  }, [applyTemplate]);

  const handleAnalyzeRequest = async () => {
    if (!packageRequest) return;

    try {
      setShowAnalysis(true);
      const result = await analyzeRequest({ packageRequestId });
      
      if (result.success) {
        // Auto-fill form with suggestions
        setFormData(prev => ({
          ...prev,
          title: `Proposta de Pacote para ${packageRequest.destination}`,
          description: `Proposta personalizada baseada em sua solicitação para ${packageRequest.destination}`,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }));

        // Add suggested components
        const suggestedComponents: PackageComponent[] = result.suggestions.map(suggestion => ({
          type: suggestion.type as PackageComponent['type'],
          assetId: suggestion.assetId,
          name: suggestion.name,
          description: suggestion.description,
          quantity: 1,
          unitPrice: suggestion.estimatedPrice,
          totalPrice: suggestion.estimatedPrice,
          included: true,
          optional: false,
          notes: suggestion.reasoning,
        }));

        setComponents(suggestedComponents);
        toast.success(`${result.suggestions.length} componentes sugeridos com base na análise`);
      }
    } catch (error) {
      console.error("Error analyzing request:", error);
      toast.error("Erro ao analisar solicitação");
    }
  };

  const addComponent = () => {
    const newComponent: PackageComponent = {
      type: "other",
      name: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      included: true,
      optional: false,
    };
    setComponents([...components, newComponent]);
  };

  const updateComponent = (index: number, updates: Partial<PackageComponent>) => {
    const updatedComponents = [...components];
    updatedComponents[index] = {
      ...updatedComponents[index],
      ...updates,
      totalPrice: updates.quantity && updates.unitPrice 
        ? updates.quantity * updates.unitPrice
        : updatedComponents[index].totalPrice,
    };
    setComponents(updatedComponents);
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        inclusions: [...prev.inclusions, newInclusion.trim()],
      }));
      setNewInclusion("");
    }
  };

  const removeInclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index),
    }));
  };

  const addExclusion = () => {
    if (newExclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        exclusions: [...prev.exclusions, newExclusion.trim()],
      }));
      setNewExclusion("");
    }
  };

  const removeExclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exclusions: prev.exclusions.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!packageRequest) return;

    try {
      setIsSubmitting(true);

      if (!formData.title.trim()) {
        toast.error("Título é obrigatório");
        setCurrentStep('basic');
        return;
      }

      if (!formData.description.trim()) {
        toast.error("Descrição é obrigatória");
        setCurrentStep('basic');
        return;
      }

      if (components.length === 0) {
        toast.error("Adicione pelo menos um componente");
        setCurrentStep('components');
        return;
      }

      if (!formData.validUntil) {
        toast.error("Data de validade é obrigatória");
        setCurrentStep('terms');
        return;
      }

      const result = await createProposal({
        packageRequestId,
        title: formData.title,
        description: formData.description,
        summary: formData.summary,
        components,
        subtotal: pricing.subtotal,
        taxes: pricing.taxes,
        fees: pricing.fees,
        discount: pricing.discount,
        totalPrice: pricing.totalPrice,
        currency: pricing.currency,
        validUntil: new Date(formData.validUntil).getTime(),
        paymentTerms: formData.paymentTerms,
        cancellationPolicy: formData.cancellationPolicy,
        inclusions: formData.inclusions,
        exclusions: formData.exclusions,
        requiresApproval: formData.requiresApproval,
        priority: formData.priority,
        tags: formData.tags,
      });

      if (result.success && result.proposalId) {
        toast.success("Proposta criada com sucesso!");
        onSuccess?.(result.proposalId);
        router.push(`/admin/dashboard/propostas/${result.proposalId}`);
      } else {
        toast.error(result.message || "Erro ao criar proposta");
      }
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Erro ao criar proposta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-medium">Templates de Proposta</h3>
            <p className="text-sm text-muted-foreground">
              Use um template para começar rapidamente ou crie do zero
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplateSelector(!showTemplateSelector)}
          >
            {showTemplateSelector ? "Ocultar" : "Mostrar"} Templates
          </Button>
        </div>
        
        {showTemplateSelector && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates?.templates?.map((template) => (
                <div
                  key={template._id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === template._id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (selectedTemplate === template._id) {
                      setSelectedTemplate(null);
                    } else {
                      setSelectedTemplate(template._id);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Usado {template.usageCount} vezes
                  </div>
                </div>
              ))}
            </div>
            
            {selectedTemplate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Template selecionado será aplicado automaticamente aos campos abaixo.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="title">Título da Proposta *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Ex: Proposta de Pacote para Fernando de Noronha"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição Detalhada *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva os detalhes da proposta..."
          className="mt-1"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="summary">Resumo Executivo</Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
          placeholder="Resumo para apresentação executiva..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="priority">Prioridade</Label>
        <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="requiresApproval"
          checked={formData.requiresApproval}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresApproval: checked }))}
        />
        <Label htmlFor="requiresApproval">Requer aprovação antes do envio</Label>
      </div>

      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(index)} />
            </Badge>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Adicionar tag..."
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderComponentsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Componentes do Pacote</h3>
          <p className="text-sm text-muted-foreground">Adicione os serviços e produtos incluídos</p>
        </div>
        <Button onClick={addComponent} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Componente
        </Button>
      </div>

      {components.length === 0 ? (
        <Alert>
          <Package className="h-4 w-4" />
          <AlertDescription>
            Nenhum componente adicionado ainda. Adicione pelo menos um componente para continuar.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {components.map((component, index) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{COMPONENT_TYPE_ICONS[component.type]}</span>
                    <Select 
                      value={component.type} 
                      onValueChange={(value: any) => updateComponent(index, { type: value })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(COMPONENT_TYPE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeComponent(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Componente</Label>
                    <Input
                      value={component.name}
                      onChange={(e) => updateComponent(index, { name: e.target.value })}
                      placeholder="Ex: Mergulho com Cilindro"
                    />
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={component.quantity}
                      onChange={(e) => updateComponent(index, { quantity: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={component.description}
                    onChange={(e) => updateComponent(index, { description: e.target.value })}
                    placeholder="Descreva o componente..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Preço Unitário (R$)</Label>
                    <Input
                      type="number"
                      value={component.unitPrice}
                      onChange={(e) => updateComponent(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label>Preço Total (R$)</Label>
                    <Input
                      type="number"
                      value={component.totalPrice}
                      onChange={(e) => updateComponent(index, { totalPrice: parseFloat(e.target.value) || 0 })}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={component.included}
                      onCheckedChange={(checked) => updateComponent(index, { included: checked })}
                    />
                    <Label>Incluído no pacote</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={component.optional}
                      onCheckedChange={(checked) => updateComponent(index, { optional: checked })}
                    />
                    <Label>Opcional</Label>
                  </div>
                </div>

                {component.notes && (
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={component.notes}
                      onChange={(e) => updateComponent(index, { notes: e.target.value })}
                      placeholder="Observações adicionais..."
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderPricingStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Precificação</h3>
        <p className="text-sm text-muted-foreground">Configure os valores e ajustes da proposta</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Subtotal</Label>
              <div className="text-lg font-semibold">R$ {pricing.subtotal.toFixed(2)}</div>
            </div>
            <div>
              <Label>Impostos (10%)</Label>
              <div className="text-lg font-semibold">R$ {pricing.taxes.toFixed(2)}</div>
            </div>
            <div>
              <Label>Taxas (5%)</Label>
              <div className="text-lg font-semibold">R$ {pricing.fees.toFixed(2)}</div>
            </div>
            <div>
              <Label>Desconto</Label>
              <Input
                type="number"
                value={pricing.discount}
                onChange={(e) => setPricing(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">Total:</span>
            <span className="text-2xl font-bold text-green-600">R$ {pricing.totalPrice.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label htmlFor="currency">Moeda</Label>
        <Select value={pricing.currency} onValueChange={(value) => setPricing(prev => ({ ...prev, currency: value }))}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BRL">Real (BRL)</SelectItem>
            <SelectItem value="USD">Dólar (USD)</SelectItem>
            <SelectItem value="EUR">Euro (EUR)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderTermsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Termos e Condições</h3>
        <p className="text-sm text-muted-foreground">Configure os termos da proposta</p>
      </div>

      <div>
        <Label htmlFor="validUntil">Válido até *</Label>
        <Input
          id="validUntil"
          type="date"
          value={formData.validUntil}
          onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="paymentTerms">Termos de Pagamento</Label>
        <Textarea
          id="paymentTerms"
          value={formData.paymentTerms}
          onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="cancellationPolicy">Política de Cancelamento</Label>
        <Textarea
          id="cancellationPolicy"
          value={formData.cancellationPolicy}
          onChange={(e) => setFormData(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label>Inclusos</Label>
        <div className="space-y-2 mt-2">
          {formData.inclusions.map((inclusion, index) => (
            <div key={index} className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {inclusion}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeInclusion(index)} />
              </Badge>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            value={newInclusion}
            onChange={(e) => setNewInclusion(e.target.value)}
            placeholder="Ex: Transfer aeroporto"
            onKeyPress={(e) => e.key === 'Enter' && addInclusion()}
          />
          <Button type="button" variant="outline" size="sm" onClick={addInclusion}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label>Não Inclusos</Label>
        <div className="space-y-2 mt-2">
          {formData.exclusions.map((exclusion, index) => (
            <div key={index} className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                {exclusion}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeExclusion(index)} />
              </Badge>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            value={newExclusion}
            onChange={(e) => setNewExclusion(e.target.value)}
            placeholder="Ex: Refeições não mencionadas"
            onKeyPress={(e) => e.key === 'Enter' && addExclusion()}
          />
          <Button type="button" variant="outline" size="sm" onClick={addExclusion}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Revisar Proposta</h3>
        <p className="text-sm text-muted-foreground">Revise todos os detalhes antes de criar</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{formData.title}</CardTitle>
          <CardDescription>{formData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Prioridade</Label>
              <Badge variant={formData.priority === 'urgent' ? 'destructive' : 'secondary'}>
                {formData.priority === 'low' ? 'Baixa' : 
                 formData.priority === 'normal' ? 'Normal' : 
                 formData.priority === 'high' ? 'Alta' : 'Urgente'}
              </Badge>
            </div>
            <div>
              <Label>Válido até</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(formData.validUntil).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <Label>Componentes ({components.length})</Label>
            <div className="space-y-2 mt-2">
              {components.map((component, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span>{COMPONENT_TYPE_ICONS[component.type]}</span>
                    <span className="font-medium">{component.name}</span>
                    <Badge variant="outline" size="sm">
                      {component.quantity}x R$ {component.unitPrice.toFixed(2)}
                    </Badge>
                  </div>
                  <span className="font-semibold">R$ {component.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Inclusos ({formData.inclusions.length})</Label>
              <div className="space-y-1 mt-1">
                {formData.inclusions.slice(0, 3).map((inclusion, index) => (
                  <div key={index} className="text-sm text-muted-foreground">• {inclusion}</div>
                ))}
                {formData.inclusions.length > 3 && (
                  <div className="text-sm text-muted-foreground">... e mais {formData.inclusions.length - 3}</div>
                )}
              </div>
            </div>
            <div>
              <Label>Não Inclusos ({formData.exclusions.length})</Label>
              <div className="space-y-1 mt-1">
                {formData.exclusions.slice(0, 3).map((exclusion, index) => (
                  <div key={index} className="text-sm text-muted-foreground">• {exclusion}</div>
                ))}
                {formData.exclusions.length > 3 && (
                  <div className="text-sm text-muted-foreground">... e mais {formData.exclusions.length - 3}</div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">Total da Proposta:</span>
            <span className="text-2xl font-bold text-green-600">R$ {pricing.totalPrice.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const steps = [
    { key: 'basic', label: 'Informações Básicas', icon: FileText },
    { key: 'components', label: 'Componentes', icon: Package },
    { key: 'pricing', label: 'Precificação', icon: DollarSign },
    { key: 'terms', label: 'Termos', icon: Calendar },
    { key: 'review', label: 'Revisar', icon: Users },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === currentStep);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nova Proposta de Pacote</h1>
          <p className="text-muted-foreground">
            {packageRequest && `Para: ${packageRequest.destination} - ${packageRequest.adults} adultos`}
          </p>
        </div>
        {showAnalysis && (
          <Button variant="outline" size="sm" onClick={handleAnalyzeRequest}>
            <Clock className="h-4 w-4 mr-2" />
            Re-analisar Solicitação
          </Button>
        )}
      </div>

      {/* Steps Navigation */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.key === currentStep;
          const isCompleted = index < currentStepIndex;
          
          return (
            <div key={step.key} className="flex items-center">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                isActive ? 'bg-blue-100 text-blue-600' : 
                isCompleted ? 'bg-green-100 text-green-600' : 
                'bg-gray-100 text-gray-400'
              }`} onClick={() => setCurrentStep(step.key as any)}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-px mx-2 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 'basic' && renderBasicInfoStep()}
          {currentStep === 'components' && renderComponentsStep()}
          {currentStep === 'pricing' && renderPricingStep()}
          {currentStep === 'terms' && renderTermsStep()}
          {currentStep === 'review' && renderReviewStep()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          {currentStepIndex > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(steps[currentStepIndex - 1].key as any)}
            >
              Anterior
            </Button>
          )}
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {currentStepIndex < steps.length - 1 ? (
            <Button 
              onClick={() => setCurrentStep(steps[currentStepIndex + 1].key as any)}
            >
              Próximo
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando Proposta...
                </>
              ) : (
                "Criar Proposta"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}