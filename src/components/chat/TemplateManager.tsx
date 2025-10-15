"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Search, FileText, Languages, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  _id: Id<"chatMessageTemplates">;
  name: string;
  category: string;
  assetType?: string;
  subject: string;
  content: string;
  variables: string[];
  isActive: boolean;
  partnerId?: Id<"users">;
  language?: string;
  createdAt: number;
}

const TEMPLATE_CATEGORIES = [
  { value: "greeting", label: "Saudação" },
  { value: "booking_confirmation", label: "Confirmação de Reserva" },
  { value: "booking_modification", label: "Modificação de Reserva" },
  { value: "cancellation", label: "Cancelamento" },
  { value: "payment_reminder", label: "Lembrete de Pagamento" },
  { value: "special_request", label: "Solicitação Especial" },
  { value: "follow_up", label: "Follow-up" },
  { value: "escalation", label: "Escalação" },
  { value: "closing", label: "Encerramento" }
];

const ASSET_TYPES = [
  { value: "general", label: "Geral" },
  { value: "activities", label: "Atividades" },
  { value: "events", label: "Eventos" },
  { value: "restaurants", label: "Restaurantes" },
  { value: "vehicles", label: "Veículos" },
  { value: "accommodations", label: "Hospedagens" },
  { value: "packages", label: "Pacotes" }
];

const LANGUAGES = [
  { value: "pt", label: "Português" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" }
];

export function TemplateManager() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedAssetType, setSelectedAssetType] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("pt");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    assetType: "general",
    subject: "",
    content: "",
    variables: [] as string[],
    isActive: true,
    language: "pt"
  });

  const { toast } = useToast();

  // Queries
  const templates = useQuery(api.domains.chat.templates.listMessageTemplates, {
    category: selectedCategory || undefined,
    assetType: selectedAssetType || undefined,
    language: selectedLanguage || undefined,
    isActive: undefined
  });

  // Mutations
  const createTemplate = useMutation(api.domains.chat.templates.createMessageTemplate);
  const updateTemplate = useMutation(api.domains.chat.templates.updateMessageTemplate);
  const deleteTemplate = useMutation(api.domains.chat.templates.deleteMessageTemplate);

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      assetType: "general",
      subject: "",
      content: "",
      variables: [],
      isActive: true,
      language: "pt"
    });
    setEditingTemplate(null);
  };

  const handleCreateTemplate = async () => {
    try {
      await createTemplate({
        name: formData.name,
        category: formData.category as any,
        assetType: formData.assetType as any,
        subject: formData.subject,
        content: formData.content,
        variables: formData.variables,
        isActive: formData.isActive,
        language: formData.language
      });

      toast({
        title: "Template criado",
        description: "Template criado com sucesso"
      });

      resetForm();
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Erro ao criar template",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      await updateTemplate({
        id: editingTemplate._id,
        name: formData.name,
        category: formData.category as any,
        assetType: formData.assetType as any,
        subject: formData.subject,
        content: formData.content,
        variables: formData.variables,
        isActive: formData.isActive,
        language: formData.language
      });

      toast({
        title: "Template atualizado",
        description: "Template atualizado com sucesso"
      });

      resetForm();
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error updating template:", error);
      toast({
        title: "Erro ao atualizar template",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (templateId: Id<"chatMessageTemplates">) => {
    try {
      await deleteTemplate({ id: templateId });
      toast({
        title: "Template deletado",
        description: "Template deletado com sucesso"
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Erro ao deletar template",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  };

  const handleEditTemplate = (template: Template) => {
    setFormData({
      name: template.name,
      category: template.category,
      assetType: template.assetType || "general",
      subject: template.subject,
      content: template.content,
      variables: template.variables,
      isActive: template.isActive,
      language: template.language || "pt"
    });
    setEditingTemplate(template);
    setShowCreateDialog(true);
  };

  const extractVariables = (text: string): string[] => {
    const matches = text.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
      variables: extractVariables(content)
    }));
  };

  const filteredTemplates = templates?.filter(template =>
    !searchTerm || 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Templates</h2>
          <p className="text-muted-foreground">
            Crie e gerencie templates de mensagem para comunicação rápida
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Template" : "Criar Novo Template"}
              </DialogTitle>
              <DialogDescription>
                Configure as informações do template de mensagem
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Confirmação de Reserva Restaurante"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assetType">Tipo de Asset</Label>
                  <Select
                    value={formData.assetType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assetType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="language">Idioma</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Ex: Confirmação da sua reserva"
                />
              </div>

              <div>
                <Label htmlFor="content">Conteúdo do Template</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Use {variavel} para inserir variáveis dinâmicas. Ex: Olá {customerName}, sua reserva para {assetTitle} foi confirmada."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use chaves {} para variáveis dinâmicas
                </p>
              </div>

              {formData.variables.length > 0 && (
                <div>
                  <Label>Variáveis Detectadas</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.variables.map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Template ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}>
                {editingTemplate ? "Atualizar" : "Criar"} Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Tabs value="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">
            <FileText className="w-4 h-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Nome ou conteúdo..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Categoria</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas as categorias</SelectItem>
                      {TEMPLATE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de Asset</Label>
                  <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      {ASSET_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Idioma</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <div className="grid gap-4">
            {filteredTemplates?.map((template) => (
              <Card key={template._id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{template.name}</h3>
                        <Badge variant="outline">
                          {TEMPLATE_CATEGORIES.find(c => c.value === template.category)?.label}
                        </Badge>
                        <Badge variant="secondary">
                          {ASSET_TYPES.find(t => t.value === template.assetType)?.label}
                        </Badge>
                        {template.language && (
                          <Badge variant="outline">
                            <Languages className="w-3 h-3 mr-1" />
                            {template.language.toUpperCase()}
                          </Badge>
                        )}
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Assunto:</strong> {template.subject}
                      </p>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.content}
                      </p>
                      
                      {template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variables.map((variable) => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum template encontrado</p>
              <p className="text-sm">Crie um novo template ou ajuste os filtros</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
                <Label>Assunto</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  {previewTemplate.subject}
                </div>
              </div>

              <div>
                <Label>Conteúdo</Label>
                <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                  {previewTemplate.content}
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