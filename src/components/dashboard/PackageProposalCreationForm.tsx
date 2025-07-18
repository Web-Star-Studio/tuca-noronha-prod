"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useAction } from "convex/react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Plus, X, FileText, Calendar, DollarSign, Package, Users, Wand2, Check, ArrowRight, ArrowLeft, Info, Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/utils";


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
  existingProposal?: any;
  isEditing?: boolean;
  onSuccess?: (proposalId: Id<"packageProposals">) => void;
  onCancel?: () => void;
}

const COMPONENT_TYPE_LABELS: Record<PackageComponent['type'], string> = {
  accommodation: "Hospedagem",
  activity: "Atividade",
  event: "Evento",
  restaurant: "Restaurante",
  vehicle: "Veículo",
  transfer: "Transfer",
  guide: "Guia",
  insurance: "Seguro",
  other: "Outros",
};

const COMPONENT_TYPE_ICONS: Record<PackageComponent['type'], React.ReactNode> = {
  accommodation: <FileText className="h-4 w-4" />,
  activity: <Users className="h-4 w-4" />,
  event: <Calendar className="h-4 w-4" />,
  restaurant: <Package className="h-4 w-4" />,
  vehicle: <DollarSign className="h-4 w-4" />,
  transfer: <DollarSign className="h-4 w-4" />,
  guide: <DollarSign className="h-4 w-4" />,
  insurance: <DollarSign className="h-4 w-4" />,
  other: <DollarSign className="h-4 w-4" />,
};

// Main component for creating a package proposal
export function PackageProposalCreationForm({ 
  packageRequestId, 
  existingProposal,
  isEditing = false,
  onSuccess, 
  onCancel 
}: PackageProposalCreationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize form data with existing proposal if editing
  const [formData, setFormData] = useState({
    title: existingProposal?.title || "",
    description: existingProposal?.description || "",
    summary: existingProposal?.summary || "",
    validUntil: existingProposal?.validUntil ? new Date(existingProposal.validUntil).toISOString().split('T')[0] : "",
    paymentTerms: existingProposal?.paymentTerms || "50% na reserva, 50% até 30 dias antes da viagem.",
    cancellationPolicy: existingProposal?.cancellationPolicy || "Cancelamento gratuito até 30 dias antes da viagem. Após esse período, multas podem ser aplicadas conforme o contrato.",
    priority: existingProposal?.priority || "normal" as "low" | "normal" | "high" | "urgent",
    requiresApproval: existingProposal?.requiresApproval || false,
    tags: existingProposal?.tags || [] as string[],
    inclusions: existingProposal?.inclusions || [] as string[],
    exclusions: existingProposal?.exclusions || [] as string[],
  });

  const [components, setComponents] = useState<PackageComponent[]>(
    existingProposal?.components || []
  );
  const [pricing, setPricing] = useState({
    subtotal: existingProposal?.subtotal || 0,
    taxes: existingProposal?.taxes || 0,
    fees: existingProposal?.fees || 0,
    discount: existingProposal?.discount || 0,
    totalPrice: existingProposal?.totalPrice || 0,
    currency: existingProposal?.currency || "BRL",
  });

  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");
  const [newTag, setNewTag] = useState("");
  
  // Mutations and queries
  const createProposal = useMutation(api.domains.packageProposals.mutations.createPackageProposal);
  const updateProposal = useMutation(api.domains.packageProposals.mutations.updatePackageProposal);
  const analyzeRequest = useAction(api.domains.packageProposals.actions.analyzePackageRequest);
  
  const packageRequest = useQuery(api.domains.packageRequests.queries.getPackageRequest, {
    id: packageRequestId,
  });
  
  // Auto-analyze package request on mount (only if not editing and no existing components)
  useEffect(() => {
    if (!isEditing && packageRequest && components.length === 0) {
      handleAnalyzeRequest();
    }
  }, [packageRequest, isEditing]);

  // Update pricing when components change
  useEffect(() => {
    const subtotal = components.reduce((sum, comp) => sum + (comp.included ? comp.totalPrice : 0), 0);
    const totalPrice = subtotal + pricing.taxes + pricing.fees - pricing.discount;

    setPricing(prev => ({
      ...prev,
      subtotal,
      totalPrice,
    }));
  }, [components, pricing.discount, pricing.taxes, pricing.fees]);


  const handleAnalyzeRequest = async () => {
    if (!packageRequest) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeRequest({ packageRequestId });
      
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          title: `Proposta de Pacote para ${packageRequest.customerInfo.name} em ${packageRequest.tripDetails.destination}`,
          description: `Uma proposta de viagem exclusiva para ${packageRequest.tripDetails.destination}, pensada para ${packageRequest.tripDetails.groupSize} pessoa(s), com duração de ${packageRequest.tripDetails.duration} dias.`,
          summary: `Pacote para ${packageRequest.tripDetails.destination} incluindo as melhores atividades e hospedagens.`,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }));

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
        toast.success("Análise concluída!", {
          description: `${result.suggestions.length} componentes foram sugeridos com base no pedido.`,
        });
      }
    } catch (error) {
      console.error("Error analyzing request:", error);
      toast.error("Erro ao analisar solicitação.");
    } finally {
      setIsAnalyzing(false);
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
    const newComponents = [...components];
    const currentComponent = newComponents[index];
    
    const updatedComponent = { ...currentComponent, ...updates };

    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
        updatedComponent.totalPrice = updatedComponent.quantity * updatedComponent.unitPrice;
    }
    
    newComponents[index] = updatedComponent;
    setComponents(newComponents);
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };
  
  const handleListAction = (
    list: string[], 
    setList: (list: string[]) => void, 
    newItem: string, 
    setNewItem: (item: string) => void
  ) => {
    if (newItem.trim() && !list.includes(newItem.trim())) {
      setList([...list, newItem.trim()]);
      setNewItem("");
    }
  };

  const addInclusion = () => handleListAction(formData.inclusions, (l) => setFormData(p => ({...p, inclusions: l})), newInclusion, setNewInclusion);
  const removeInclusion = (index: number) => setFormData(p => ({...p, inclusions: p.inclusions.filter((_, i) => i !== index)}));

  const addExclusion = () => handleListAction(formData.exclusions, (l) => setFormData(p => ({...p, exclusions: l})), newExclusion, setNewExclusion);
  const removeExclusion = (index: number) => setFormData(p => ({...p, exclusions: p.exclusions.filter((_, i) => i !== index)}));

  const addTag = () => handleListAction(formData.tags, (l) => setFormData(p => ({...p, tags: l})), newTag, setNewTag);
  const removeTag = (index:number) => setFormData(p => ({...p, tags: p.tags.filter((_, i) => i !== index)}));


  const validateStep = (stepIndex: number): boolean => {
    switch(stepIndex) {
      case 0: // Basic Info
        if (!formData.title.trim() || !formData.description.trim()) {
          toast.error("Título e Descrição são obrigatórios.");
          return false;
        }
        break;
      case 1: // Components
        if (components.length === 0) {
          toast.error("Adicione pelo menos um componente ao pacote.");
          return false;
        }
        if (components.some(c => !c.name.trim() || c.unitPrice <= 0)) {
           toast.error("Todos os componentes devem ter nome e preço unitário maior que zero.");
           return false;
        }
        break;
      case 2: // Terms
        if (!formData.validUntil) {
           toast.error("A data de validade da proposta é obrigatória.");
           return false;
        }
        break;
      default:
        break;
    }
    return true;
  }

  const handleSubmit = async () => {
    for (let i = 0; i < steps.length; i++) {
        if (!validateStep(i)) {
            setCurrentStep(i);
            return;
        }
    }

    setIsSubmitting(true);
    try {
      if (isEditing && existingProposal) {
        // Update existing proposal
        const result = await updateProposal({
          id: existingProposal._id,
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

        if (result.success) {
          toast.success("Proposta atualizada com sucesso!");
          onSuccess?.(existingProposal._id);
        } else {
          toast.error(result.message || "Erro ao atualizar proposta");
        }
      } else {
        // Create new proposal
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
        } else {
          toast.error(result.message || "Erro ao criar proposta");
        }
      }
    } catch (error) {
      console.error("Error submitting proposal:", error);
      toast.error(`Ocorreu um erro inesperado ao ${isEditing ? 'atualizar' : 'criar'} a proposta.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { name: 'Informações', fields: ['title', 'description'] },
    { name: 'Componentes', fields: ['components'] },
    { name: 'Termos', fields: ['validUntil', 'paymentTerms'] },
    { name: 'Valores', fields: ['pricing'] },
    { name: 'Revisão' }
  ];

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const StepContent = useMemo(() => {
    switch (currentStep) {
      case 0: return <StepBasicInfo formData={formData} setFormData={setFormData} newTag={newTag} setNewTag={setNewTag} addTag={addTag} removeTag={removeTag} />;
      case 1: return <StepComponents components={components} addComponent={addComponent} updateComponent={updateComponent} removeComponent={removeComponent} />;
      case 2: return <StepTerms formData={formData} setFormData={setFormData} newInclusion={newInclusion} setNewInclusion={setNewInclusion} addInclusion={addInclusion} removeInclusion={removeInclusion} newExclusion={newExclusion} setNewExclusion={setNewExclusion} addExclusion={addExclusion} removeExclusion={removeExclusion} />;
      case 3: return <StepPricing pricing={pricing} setPricing={setPricing} />;
      case 4: return <StepReview formData={formData} components={components} pricing={pricing} />;
      default: return null;
    }
  }, [currentStep, formData, components, pricing, newTag, newInclusion, newExclusion]);

  return (
    <div className="space-y-8">
       {!isEditing && (
         <Alert className="bg-blue-50 border-blue-200 text-blue-800">
           <Wand2 className="h-4 w-4 !text-blue-800" />
           <AlertTitle>Assistente de IA</AlertTitle>
           <AlertDescription className="flex items-center justify-between">
             <p>Analisamos a solicitação do cliente para sugerir componentes e preencher informações. Você pode ajustá-las a qualquer momento.</p>
             <Button variant="outline" size="sm" onClick={handleAnalyzeRequest} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Search className="h-4 w-4 mr-2" />}
               Re-analisar
             </Button>
           </AlertDescription>
         </Alert>
       )}

       <div>
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <React.Fragment key={step.name}>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-semibold transition-all duration-300
                    ${index === currentStep ? 'bg-blue-600 text-white scale-110' : ''}
                    ${index < currentStep ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                    ${index > currentStep ? 'bg-gray-200 text-gray-500 hover:bg-gray-300' : ''}
                  `}
                >
                  {index < currentStep ? <Check size={24} /> : index + 1}
                </button>
                <p className={`text-xs font-semibold ${index === currentStep ? 'text-blue-600' : 'text-gray-500'}`}>{step.name}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-auto h-1 mx-2 transition-colors duration-500 ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      <Card className="shadow-lg border-t-4 border-blue-600">
        <CardContent className="p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {StepContent}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 0}
          className="group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
          Anterior
        </Button>
        
        <div className="flex items-center gap-4">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="text-gray-600">
              Cancelar
            </Button>
          )}

          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} className="group">
              Próximo
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isEditing ? "Atualizando Proposta..." : "Criando Proposta..."}
                </>
              ) : (
                <>
                  {isEditing ? "Atualizar Proposta" : "Criar Proposta"}
                  <Check className="h-4 w-4 ml-2 transition-transform group-hover:scale-125" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step Components
const StepBasicInfo = ({ formData, setFormData, newTag, setNewTag, addTag, removeTag }: any) => (
   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
     <div className="space-y-6">
       <Card>
          <CardHeader>
            <CardTitle>Informações Principais</CardTitle>
            <CardDescription>Defina o título e a descrição da proposta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title" className="font-semibold">Título da Proposta *</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Pacote Essencial Noronha" />
            </div>
            <div>
              <Label htmlFor="description" className="font-semibold">Descrição Detalhada *</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descreva os detalhes da proposta, o que a torna especial." rows={5} />
            </div>
            <div>
              <Label htmlFor="summary" className="font-semibold">Resumo (Opcional)</Label>
              <Textarea id="summary" value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} placeholder="Um resumo curto para o cliente." rows={2} />
            </div>
          </CardContent>
        </Card>
     </div>
     <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                 <Label>Requer aprovação?</Label>
                 <p className="text-xs text-muted-foreground">Se ativo, a proposta precisará ser aprovada por um administrador antes do envio.</p>
              </div>
              <Switch checked={formData.requiresApproval} onCheckedChange={(c) => setFormData({ ...formData, requiresApproval: c })} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="secondary">{tag} <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeTag(index)} /></Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Ex: Família, Aventura" onKeyPress={(e) => e.key === 'Enter' && addTag()} />
              <Button type="button" variant="outline" size="icon" onClick={addTag}><Plus className="h-4 w-4" /></Button>
            </div>
          </CardContent>
        </Card>
     </div>
   </div>
);

const StepComponents = ({ components, addComponent, updateComponent, removeComponent }: any) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Componentes do Pacote</h3>
          <p className="text-sm text-muted-foreground">Adicione os serviços e produtos que compõem a proposta.</p>
        </div>
        <Button onClick={addComponent} size="sm" className="group">
          <Plus className="h-4 w-4 mr-2 transition-transform group-hover:rotate-90" />
          Adicionar Componente
        </Button>
      </div>
      
      {components.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum componente</h3>
          <p className="mt-1 text-sm text-gray-500">Adicione o primeiro item do pacote.</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-2">
          {components.map((component: PackageComponent, index: number) => (
            <AccordionItem value={`item-${index}`} key={index} className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-all duration-300">
               <AccordionPrimitive.Header className="flex items-center w-full">
                  <AccordionPrimitive.Trigger className="group flex flex-1 items-center gap-3 px-4 py-3 text-sm font-medium text-left transition-all rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                      <div className="flex items-center gap-3 flex-1">
                        {COMPONENT_TYPE_ICONS[component.type] || <Package className="h-4 w-4 text-muted-foreground" />}
                        <span className="font-semibold">{component.name || "Novo Componente"}</span>
                        <Badge variant="outline">{COMPONENT_TYPE_LABELS[component.type]}</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-base text-green-600">{formatCurrency(component.totalPrice)}</span>
                        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 text-muted-foreground" />
                      </div>
                  </AccordionPrimitive.Trigger>
                  <div className="pr-4">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-8 w-8" 
                      onClick={() => removeComponent(index)}
                      aria-label="Remover componente"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
              </AccordionPrimitive.Header>
              <AccordionContent className="px-4 pb-4 space-y-6 border-t pt-4 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Componente</Label>
                      <Select value={component.type} onValueChange={(v: any) => updateComponent(index, { type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(COMPONENT_TYPE_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                     <div>
                      <Label>Nome do Componente *</Label>
                      <Input value={component.name} onChange={(e) => updateComponent(index, { name: e.target.value })} placeholder="Ex: Mergulho com Cilindro" />
                    </div>
                 </div>
                <Textarea value={component.description} onChange={(e) => updateComponent(index, { description: e.target.value })} placeholder="Descreva o que está incluso neste componente..." rows={3} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <Label>Quantidade</Label>
                        <Input type="number" value={component.quantity} onChange={(e) => updateComponent(index, { quantity: parseInt(e.target.value) || 1 })} min="1" />
                    </div>
                    <div>
                        <Label>Preço Unitário (R$) *</Label>
                        <Input type="number" value={component.unitPrice} onChange={(e) => updateComponent(index, { unitPrice: parseFloat(e.target.value) || 0 })} step="0.01" min="0" />
                    </div>
                    <div>
                        <Label>Preço Total (R$)</Label>
                        <Input type="number" value={component.totalPrice} disabled className="bg-gray-100 font-semibold" />
                    </div>
                </div>
                <Textarea value={component.notes} onChange={(e) => updateComponent(index, { notes: e.target.value })} placeholder="Notas internas sobre este componente (opcional)..." rows={2} />
                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2"><Switch checked={component.included} onCheckedChange={(c) => updateComponent(index, { included: c })} /><Label>Incluído no preço final</Label></div>
                  <div className="flex items-center space-x-2"><Switch checked={component.optional} onCheckedChange={(c) => updateComponent(index, { optional: c })} /><Label>Opcional para o cliente</Label></div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
);

const StepTerms = ({ formData, setFormData, newInclusion, setNewInclusion, addInclusion, removeInclusion, newExclusion, setNewExclusion, addExclusion, removeExclusion }: any) => {
  const renderListEditor = (title: string, items: string[], newItem: string, setNewItem: (val: string) => void, addItem: () => void, removeItem: (i: number) => void) => (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length > 0 && (
          <div className="space-y-2 mb-3">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <p className="text-sm">{item}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(index)}><X className="h-3 w-3"/></Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={`Adicionar item...`} onKeyPress={(e) => e.key === 'Enter' && addItem()} />
          <Button type="button" variant="outline" size="icon" onClick={addItem}><Plus className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Validade e Pagamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
             <div>
              <Label htmlFor="validUntil">Proposta válida até *</Label>
              <Input id="validUntil" type="date" value={formData.validUntil} onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="paymentTerms">Termos de Pagamento</Label>
              <Textarea id="paymentTerms" value={formData.paymentTerms} onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })} rows={4} />
            </div>
            <div>
              <Label htmlFor="cancellationPolicy">Política de Cancelamento</Label>
              <Textarea id="cancellationPolicy" value={formData.cancellationPolicy} onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })} rows={4} />
            </div>
          </CardContent>
        </Card>
      </div>
       <div className="space-y-6">
        {renderListEditor("Itens Inclusos", formData.inclusions, newInclusion, setNewInclusion, addInclusion, removeInclusion)}
        {renderListEditor("Itens Não Inclusos", formData.exclusions, newExclusion, setNewExclusion, addExclusion, removeExclusion)}
      </div>
    </div>
  );
};

const StepPricing = ({ pricing, setPricing }: any) => (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">Detalhamento Financeiro</CardTitle>
          <CardDescription className="text-center">Ajuste os valores finais da proposta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-gray-50">
            <span className="text-muted-foreground">Subtotal dos Componentes</span>
            <span className="font-medium">{formatCurrency(pricing.subtotal)}</span>
          </div>
          <div className="flex justify-between items-center p-2">
            <Label htmlFor="taxes" className="text-sm text-muted-foreground">Impostos (R$)</Label>
            <Input
              id="taxes"
              type="number"
              value={pricing.taxes}
              onChange={(e) => setPricing({ ...pricing, taxes: parseFloat(e.target.value) || 0 })}
              className="w-32 text-right text-sm"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div className="flex justify-between items-center p-2">
            <Label htmlFor="fees" className="text-sm text-muted-foreground">Taxas de Serviço (R$)</Label>
            <Input
              id="fees"
              type="number"
              value={pricing.fees}
              onChange={(e) => setPricing({ ...pricing, fees: parseFloat(e.target.value) || 0 })}
              className="w-32 text-right text-sm"
              placeholder="0.00"
              step="0.01"
            />
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-center p-2">
            <Label htmlFor="discount" className="font-semibold">Desconto (R$)</Label>
            <Input
              id="discount"
              type="number"
              value={pricing.discount}
              onChange={(e) => setPricing({ ...pricing, discount: parseFloat(e.target.value) || 0 })}
              className="w-32 text-right font-semibold"
              placeholder="0.00"
            />
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg">
            <span className="text-xl font-bold text-green-800">Total Geral</span>
            <span className="text-2xl font-bold text-green-800">{formatCurrency(pricing.totalPrice)}</span>
          </div>
          
           <div>
            <Label htmlFor="currency">Moeda</Label>
            <Select value={pricing.currency} onValueChange={(v) => setPricing({ ...pricing, currency: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real Brasileiro (BRL)</SelectItem>
                <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
);

const StepReview = ({ formData, components, pricing }: any) => (
    <div className="space-y-6">
      <div className="text-center">
         <h2 className="text-2xl font-bold">Quase lá!</h2>
         <p className="text-muted-foreground">Revise todas as informações antes de criar a proposta.</p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>{formData.title}</CardTitle><CardDescription>{formData.summary}</CardDescription></CardHeader>
            <CardContent className="text-sm space-y-2">
                <p><strong className="text-muted-foreground">Válido até:</strong> {formatDate(formData.validUntil)}</p>
                <p><strong className="text-muted-foreground">Prioridade:</strong> {formData.priority}</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col justify-center items-center bg-green-50 text-green-800">
             <CardHeader className="text-center">
                <CardTitle className="text-green-800">Valor Total</CardTitle>
             </CardHeader>
             <CardContent>
                <p className="text-4xl font-bold">{formatCurrency(pricing.totalPrice)}</p>
             </CardContent>
          </Card>
       </div>
       
       <Card>
         <CardHeader><CardTitle>Componentes ({components.length})</CardTitle></CardHeader>
         <CardContent>
            <div className="space-y-2">
              {components.map((c: PackageComponent, i: number) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                  <p>{c.quantity}x {c.name}</p>
                  <p className="font-semibold">{formatCurrency(c.totalPrice)}</p>
                </div>
              ))}
            </div>
         </CardContent>
       </Card>
    </div>
);