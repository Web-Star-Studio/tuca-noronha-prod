"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, Eye } from "lucide-react";
import { toast } from "sonner";

interface Template {
  _id: Id<"packageProposalTemplates">;
  name: string;
  description: string;
  category: string;
  titleTemplate: string;
  descriptionTemplate: string;
  summaryTemplate?: string;
  defaultComponents: any[];
  defaultPricing: {
    taxRate: number;
    feeRate: number;
    currency: string;
  };
  paymentTermsTemplate: string;
  cancellationPolicyTemplate: string;
  defaultInclusions: string[];
  defaultExclusions: string[];
  variables: string[];
  validityDays: number;
  requiresApproval: boolean;
  priority: string;
  isActive: boolean;
  isPublic: boolean;
  partnerId?: Id<"users">;
  usageCount: number;
  createdAt: number;
}

const CATEGORY_LABELS = {
  adventure: "Aventura",
  leisure: "Lazer",
  business: "Negócios",
  family: "Família",
  honeymoon: "Lua de Mel",
  luxury: "Luxo",
  budget: "Econômico",
  custom: "Personalizado",
} as const;

const CATEGORY_ICONS = {
  adventure: "🏔️",
  leisure: "🏖️",
  business: "💼",
  family: "👨‍👩‍👧‍👦",
  honeymoon: "💕",
  luxury: "🌟",
  budget: "💰",
  custom: "🎯",
} as const;

export function ProposalTemplateManager() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "custom",
    titleTemplate: "",
    descriptionTemplate: "",
    summaryTemplate: "",
    paymentTermsTemplate: "50% na reserva, 50% até 30 dias antes da viagem",
    cancellationPolicyTemplate: "Cancelamento gratuito até 30 dias antes da viagem",
    defaultInclusions: [] as string[],
    defaultExclusions: [] as string[],
    variables: [] as string[],
    validityDays: 30,
    requiresApproval: false,
    priority: "normal",
    isActive: true,
    isPublic: false,
    defaultPricing: {
      taxRate: 0.1,
      feeRate: 0.05,
      currency: "BRL",
    },
  });

  // Queries
  const templates = useQuery(api.domains.packageProposals.templates.listPackageProposalTemplates, {
    category: selectedCategory || undefined,
    isActive: undefined,
    searchTerm: searchTerm || undefined,
  });

  // Mutations
  const createTemplate = useMutation(api.domains.packageProposals.templates.createPackageProposalTemplate);
  const updateTemplate = useMutation(api.domains.packageProposals.templates.updatePackageProposalTemplate);
  const deleteTemplate = useMutation(api.domains.packageProposals.templates.deletePackageProposalTemplate);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "custom",
      titleTemplate: "",
      descriptionTemplate: "",
      summaryTemplate: "",
      paymentTermsTemplate: "50% na reserva, 50% até 30 dias antes da viagem",
      cancellationPolicyTemplate: "Cancelamento gratuito até 30 dias antes da viagem",
      defaultInclusions: [],
      defaultExclusions: [],
      variables: [],
      validityDays: 30,
      requiresApproval: false,
      priority: "normal",
      isActive: true,
      isPublic: false,
      defaultPricing: {
        taxRate: 0.1,
        feeRate: 0.05,
        currency: "BRL",
      },
    });
    setEditingTemplate(null);
  };

  const openEditDialog = (template: Template) => {
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      titleTemplate: template.titleTemplate,
      descriptionTemplate: template.descriptionTemplate,
      summaryTemplate: template.summaryTemplate || "",
      paymentTermsTemplate: template.paymentTermsTemplate,
      cancellationPolicyTemplate: template.cancellationPolicyTemplate,
      defaultInclusions: template.defaultInclusions,
      defaultExclusions: template.defaultExclusions,
      variables: template.variables,
      validityDays: template.validityDays,
      requiresApproval: template.requiresApproval,
      priority: template.priority,
      isActive: template.isActive,
      isPublic: template.isPublic,
      defaultPricing: template.defaultPricing,
    });
    setEditingTemplate(template);
    setShowCreateDialog(true);
  };

  const handleSubmit = async () => {
    try {
      if (editingTemplate) {
        await updateTemplate({
          id: editingTemplate._id,
          ...formData,
          defaultComponents: [],
        });
        toast.success("Template atualizado com sucesso!");
      } else {
        await createTemplate({
          ...formData,
          defaultComponents: [],
        });
        toast.success("Template criado com sucesso!");
      }

      resetForm();
      setShowCreateDialog(false);
    } catch {
      toast.error("Erro ao salvar template");
      console.error("Error saving template:", error);
    }
  };

  const handleDelete = async (templateId: Id<"packageProposalTemplates">) => {
    try {
      await deleteTemplate({ id: templateId });
      toast.success("Template deletado com sucesso!");
    } catch {
      toast.error("Erro ao deletar template");
      console.error("Error deleting template:", error);
    }
  };

  const filteredTemplates = templates?.templates?.filter(template => 
    !searchTerm || 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Templates de Propostas</h1>
          <p className="text-muted-foreground">
            Gerencie templates para criação rápida de propostas de pacotes
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Template" : "Novo Template"}
              </DialogTitle>
              <DialogDescription>
                {editingTemplate 
                  ? "Edite as informações do template" 
                  : "Crie um novo template para propostas de pacotes"
                }
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Template *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Pacote Aventura Fernando de Noronha"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS]} {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descrição *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o propósito e uso deste template..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                    />
                    <Label>Template ativo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isPublic}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
                    />
                    <Label>Disponível para todos os parceiros</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.requiresApproval}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requiresApproval: checked }))}
                    />
                    <Label>Requer aprovação</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label htmlFor="titleTemplate">Template do Título *</Label>
                  <Input
                    id="titleTemplate"
                    value={formData.titleTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, titleTemplate: e.target.value }))}
                    placeholder="Ex: Proposta de Pacote para {destination} - {duration} dias"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {`{variavel}`} para inserir variáveis dinâmicas
                  </p>
                </div>

                <div>
                  <Label htmlFor="descriptionTemplate">Template da Descrição *</Label>
                  <Textarea
                    id="descriptionTemplate"
                    value={formData.descriptionTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, descriptionTemplate: e.target.value }))}
                    placeholder="Ex: Proposta personalizada para {destination} com {adults} adultos..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="summaryTemplate">Template do Resumo Executivo</Label>
                  <Textarea
                    id="summaryTemplate"
                    value={formData.summaryTemplate}
                    onChange={(e) => setFormData(prev => ({ ...prev, summaryTemplate: e.target.value }))}
                    placeholder="Resumo executivo opcional..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentTerms">Termos de Pagamento</Label>
                    <Textarea
                      id="paymentTerms"
                      value={formData.paymentTermsTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentTermsTemplate: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cancellationPolicy">Política de Cancelamento</Label>
                    <Textarea
                      id="cancellationPolicy"
                      value={formData.cancellationPolicyTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, cancellationPolicyTemplate: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="validityDays">Validade (dias)</Label>
                    <Input
                      id="validityDays"
                      type="number"
                      value={formData.validityDays}
                      onChange={(e) => setFormData(prev => ({ ...prev, validityDays: parseInt(e.target.value) || 30 }))}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priority">Prioridade Padrão</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
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
                  <div>
                    <Label htmlFor="currency">Moeda</Label>
                    <Select 
                      value={formData.defaultPricing.currency} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        defaultPricing: { ...prev.defaultPricing, currency: value }
                      }))}
                    >
                      <SelectTrigger>
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxRate">Taxa de Impostos (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={formData.defaultPricing.taxRate * 100}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        defaultPricing: { 
                          ...prev.defaultPricing, 
                          taxRate: parseFloat(e.target.value) / 100 || 0 
                        }
                      }))}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="feeRate">Taxa de Serviços (%)</Label>
                    <Input
                      id="feeRate"
                      type="number"
                      value={formData.defaultPricing.feeRate * 100}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        defaultPricing: { 
                          ...prev.defaultPricing, 
                          feeRate: parseFloat(e.target.value) / 100 || 0 
                        }
                      }))}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit}>
                {editingTemplate ? "Atualizar" : "Criar"} Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS]} {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template._id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {CATEGORY_ICONS[template.category as keyof typeof CATEGORY_ICONS]}
                  </span>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Categoria:</span>
                  <Badge variant="secondary">
                    {CATEGORY_LABELS[template.category as keyof typeof CATEGORY_LABELS]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Usado:</span>
                  <span>{template.usageCount} vezes</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Validade:</span>
                  <span>{template.validityDays} dias</span>
                </div>
                <div className="flex gap-2">
                  {template.isActive && (
                    <Badge variant="default" className="text-xs">Ativo</Badge>
                  )}
                  {template.isPublic && (
                    <Badge variant="outline" className="text-xs">Público</Badge>
                  )}
                  {template.requiresApproval && (
                    <Badge variant="destructive" className="text-xs">Requer Aprovação</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview do Template</DialogTitle>
            <DialogDescription>
              {previewTemplate?.name}
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  {previewTemplate.titleTemplate}
                </div>
              </div>

              <div>
                <Label>Descrição</Label>
                <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {previewTemplate.descriptionTemplate}
                </div>
              </div>

              {previewTemplate.summaryTemplate && (
                <div>
                  <Label>Resumo Executivo</Label>
                  <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {previewTemplate.summaryTemplate}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Termos de Pagamento</Label>
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    {previewTemplate.paymentTermsTemplate}
                  </div>
                </div>
                <div>
                  <Label>Política de Cancelamento</Label>
                  <div className="p-3 bg-gray-50 rounded-md text-sm">
                    {previewTemplate.cancellationPolicyTemplate}
                  </div>
                </div>
              </div>

              {previewTemplate.variables.length > 0 && (
                <div>
                  <Label>Variáveis Disponíveis</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {previewTemplate.variables.map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 