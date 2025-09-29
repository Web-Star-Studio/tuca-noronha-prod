"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import type { Id } from "@/../convex/_generated/dataModel";
import { api } from "@/../convex/_generated/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface SimpleProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageRequestId: Id<"packageRequests">;
  onSuccess: () => void;
  isEditing?: boolean;
  existingProposal?: any;
}

const initialFormData = {
  travelPeriod: "",
  nights: "",
  departureLocation: "",
  airline: "",
  accommodationType: "",
  accommodationDetails: "",
  fullPackageDescription: "",
  pricePerPerson: "",
  totalPrice: "",
  additionalNotes: "",
  paymentTerms: "50% na reserva, 50% até 30 dias antes da viagem.",
  cancellationPolicy: "Cancelamento gratuito até 30 dias antes da viagem.",
  inclusions: "",
  exclusions: "",
};

function mapExistingProposalToFormData(existingProposal: any) {
  if (!existingProposal) {
    return initialFormData;
  }

  const component = existingProposal.components?.[0];
  const descriptionText: string = component?.description ?? "";

  const extractValue = (label: string) => {
    const regex = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.*)`, "i");
    const match = descriptionText.match(regex);
    return match?.[1]?.trim() ?? "";
  };

  const accommodationValue = extractValue("Acomodação");
  const [accommodationType, ...accommodationDetailsParts] = accommodationValue.split(" - ");
  const accommodationDetails = accommodationDetailsParts.join(" - ").trim();

  // Extract travel info from the main description
  const extractFromDescription = (label: string) => {
    const regex = new RegExp(`\\*\\*${label}:\\*\\*\\s*(.*)`, "i");
    const match = existingProposal.description?.match(regex);
    return match?.[1]?.trim() ?? "";
  };

  return {
    ...initialFormData,
    travelPeriod: extractFromDescription("Periodo da Viagem") || extractFromDescription("Período da Viagem") || extractValue("Período da Viagem"),
    nights: extractFromDescription("Noites") || extractValue("Noites"),
    departureLocation: extractFromDescription("Local de Saida") || extractFromDescription("Local de Saída") || extractValue("Local de Saída"),
    airline: extractFromDescription("Companhia Aerea") || extractFromDescription("Companhia Aérea") || extractValue("Companhia Aérea"),
    accommodationType: ((extractFromDescription("Acomodacao") || extractFromDescription("Acomodação"))?.split(" - ")[0] || accommodationType?.trim()) ?? "",
    accommodationDetails: (extractFromDescription("Acomodacao") || extractFromDescription("Acomodação"))?.split(" - ").slice(1).join(" - ") || accommodationDetails,
    fullPackageDescription: existingProposal.description ?? "",
    pricePerPerson:
      component?.unitPrice !== undefined && component?.unitPrice !== null
        ? String(component.unitPrice)
        : "",
    totalPrice:
      existingProposal.totalPrice !== undefined && existingProposal.totalPrice !== null
        ? String(existingProposal.totalPrice)
        : component?.totalPrice !== undefined && component?.totalPrice !== null
        ? String(component.totalPrice)
        : "",
    additionalNotes: extractFromDescription("Observacoes") || extractFromDescription("Observações") || extractValue("Observações"),
    paymentTerms: existingProposal.paymentTerms || "50% na reserva, 50% até 30 dias antes da viagem.",
    cancellationPolicy: existingProposal.cancellationPolicy || "Cancelamento gratuito até 30 dias antes da viagem.",
    inclusions: existingProposal.inclusions?.join("\n") || "",
    exclusions: existingProposal.exclusions?.join("\n") || "",
  };
}

export function SimpleProposalModal({
  isOpen,
  onClose,
  packageRequestId,
  onSuccess,
  isEditing = false,
  existingProposal,
}: SimpleProposalModalProps) {
  const [formData, setFormData] = useState(() =>
    isEditing && existingProposal
      ? mapExistingProposalToFormData(existingProposal)
      : initialFormData
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createProposal = useMutation(api.domains.packageProposals.mutations.createPackageProposal);
  const updateProposal = useMutation(api.domains.packageProposals.mutations.updatePackageProposal);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (isEditing && existingProposal) {
      setFormData(mapExistingProposalToFormData(existingProposal));
    } else {
      setFormData(initialFormData);
    }
  }, [isOpen, isEditing, existingProposal]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (
    e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e?.preventDefault();
    setIsSubmitting(true);

    const {
      travelPeriod,
      nights,
      departureLocation,
      airline,
      accommodationType,
      accommodationDetails,
      fullPackageDescription,
      totalPrice,
      additionalNotes,
      paymentTerms,
      cancellationPolicy,
      inclusions,
      exclusions,
    } = formData;
    if (!travelPeriod || !nights || !totalPrice || !fullPackageDescription || !departureLocation || !airline || !accommodationType || !accommodationDetails || !paymentTerms || !cancellationPolicy) {
      toast.error("Preencha os campos obrigatórios: Período, Noites, Descrição, Preço Total, Local de Saída, Companhia Aérea, Tipo de Acomodação, Detalhes da Acomodação, Condições de Pagamento e Política de Cancelamento.");
      setIsSubmitting(false);
      return;
    }

    const totalPriceNum = parseFloat(totalPrice);
    if (Number.isNaN(totalPriceNum)) {
      toast.error("Informe um valor numérico válido para o preço total.");
      setIsSubmitting(false);
      return;
    }

    if (isEditing && !existingProposal) {
      toast.error("Nenhuma proposta disponível para edição.");
      setIsSubmitting(false);
      return;
    }

    const title =
      formData.accommodationType && formData.departureLocation
        ? `Proposta de Pacote: ${formData.accommodationType} em ${formData.departureLocation}`
        : existingProposal?.title ?? "Proposta de Pacote";

    const summary =
      nights
        ? `Pacote de ${nights} noites.`
        : existingProposal?.summary ?? "Pacote personalizado.";

    // Build the enhanced description with travel info
    const enhancedDescription = `
${fullPackageDescription}

**Informacoes da Viagem:**
- **Periodo da Viagem:** ${travelPeriod}
- **Noites:** ${nights}
- **Local de Saida:** ${departureLocation}
- **Companhia Aerea:** ${airline}
- **Acomodacao:** ${accommodationType} - ${accommodationDetails}
- **Observacoes:** ${additionalNotes}
    `.trim();

    // Process inclusions and exclusions from textarea to array
    const inclusionsArray = inclusions ? inclusions.split('\n').filter((item: string) => item.trim()) : [];
    const exclusionsArray = exclusions ? exclusions.split('\n').filter((item: string) => item.trim()) : [];

    // Components should be actual package components, not the travel info
    const components = existingProposal?.components || [];
    const requiresApproval = existingProposal?.requiresApproval ?? false;
    const priority = existingProposal?.priority ?? "normal";
    const tags = existingProposal?.tags ?? ["proposta-simples"];
    const taxes = existingProposal?.taxes ?? 0;
    const fees = existingProposal?.fees ?? 0;
    const discount = existingProposal?.discount ?? 0;
    const currency = existingProposal?.currency ?? "BRL";
    const validUntil = existingProposal?.validUntil ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime();

    const subtotal = totalPriceNum;
    const totalPriceValue = subtotal + taxes + fees - discount;

    const proposalPayload = {
      title,
      description: enhancedDescription,
      summary,
      components: components.length > 0 ? components : [],
      subtotal,
      taxes,
      fees,
      discount,
      totalPrice: totalPriceValue,
      currency,
      validUntil,
      paymentTerms: paymentTerms || "50% na reserva, 50% até 30 dias antes da viagem.",
      cancellationPolicy: cancellationPolicy || "Cancelamento gratuito até 30 dias antes da viagem.",
      inclusions: inclusionsArray,
      exclusions: exclusionsArray,
      requiresApproval,
      priority,
      tags,
      status: "draft", // Proposta começa como rascunho
    };

    try {
      if (isEditing && existingProposal) {
        const result = await updateProposal({
          id: existingProposal._id,
          ...proposalPayload,
        });

        if (result.success) {
          toast.success("Proposta atualizada com sucesso!");
          onSuccess();
          onClose();
        } else {
          toast.error(result.message || "Falha ao atualizar proposta.");
        }
      } else {
        const result = await createProposal({
          packageRequestId,
          ...proposalPayload,
        });

        if (result.success) {
          toast.success("Proposta criada com sucesso!");
          setFormData(initialFormData);
          onSuccess();
          onClose();
        } else {
          toast.error(result.message || "Falha ao criar proposta.");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(
        isEditing
          ? "Ocorreu um erro ao atualizar a proposta."
          : "Ocorreu um erro ao criar a proposta."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Proposta" : "Criar Nova Proposta Simplificada"}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes abaixo para gerar uma nova proposta para esta solicitação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="travelPeriod">Período da viagem *</Label>
              <Input id="travelPeriod" name="travelPeriod" value={formData.travelPeriod} onChange={handleChange} placeholder="Ex: 10/12/2025 a 20/12/2025" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nights">Número de noites *</Label>
              <Input id="nights" name="nights" type="number" value={formData.nights} onChange={handleChange} placeholder="Ex: 10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departureLocation">Local de Saída</Label>
              <Input id="departureLocation" name="departureLocation" value={formData.departureLocation} onChange={handleChange} placeholder="Ex: São Paulo (GRU)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airline">Companhia Aérea</Label>
              <Input id="airline" name="airline" value={formData.airline} onChange={handleChange} placeholder="Ex: LATAM" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accommodationType">Tipo de Acomodação</Label>
            <Input id="accommodationType" name="accommodationType" value={formData.accommodationType} onChange={handleChange} placeholder="Ex: Pousada, Hotel, Resort" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accommodationDetails">Detalhes da acomodação</Label>
            <Textarea id="accommodationDetails" name="accommodationDetails" value={formData.accommodationDetails} onChange={handleChange} placeholder="Ex: Pousada com piscina, café da manhã incluso." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullPackageDescription">Descrição completa do pacote *</Label>
            <Textarea id="fullPackageDescription" name="fullPackageDescription" value={formData.fullPackageDescription} onChange={handleChange} rows={5} placeholder="Descreva o que está incluso no pacote, o roteiro, etc." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerPerson">Preço por pessoa (Adulto Pagante)</Label>
              <Input id="pricePerPerson" name="pricePerPerson" type="number" value={formData.pricePerPerson} onChange={handleChange} placeholder="Ex: 5000.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Preço total *</Label>
              <Input id="totalPrice" name="totalPrice" type="number" value={formData.totalPrice} onChange={handleChange} placeholder="Ex: 10000.00" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Observações Adicionais</Label>
            <Textarea id="additionalNotes" name="additionalNotes" value={formData.additionalNotes} onChange={handleChange} placeholder="Informações sobre pagamentos, documentos, etc." />
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Termos de Pagamento *</Label>
              <Textarea 
                id="paymentTerms" 
                name="paymentTerms" 
                value={formData.paymentTerms} 
                onChange={handleChange} 
                placeholder="Ex: 50% na reserva, 50% até 30 dias antes da viagem"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cancellationPolicy">Política de Cancelamento *</Label>
              <Textarea 
                id="cancellationPolicy" 
                name="cancellationPolicy" 
                value={formData.cancellationPolicy} 
                onChange={handleChange} 
                placeholder="Ex: Cancelamento gratuito até 30 dias antes da viagem"
                rows={3}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inclusions">Inclusões (uma por linha)</Label>
              <Textarea 
                id="inclusions" 
                name="inclusions" 
                value={formData.inclusions} 
                onChange={handleChange} 
                placeholder="Passagens aéreas&#10;Hospedagem com café da manhã&#10;Transfer in/out&#10;Seguro viagem"
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exclusions">Exclusões (uma por linha)</Label>
              <Textarea 
                id="exclusions" 
                name="exclusions" 
                value={formData.exclusions} 
                onChange={handleChange} 
                placeholder="Refeições não mencionadas&#10;Passeios opcionais&#10;Despesas pessoais&#10;Gorjetas"
                rows={5}
              />
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEditing ? (
              "Salvar Alterações"
            ) : (
              "Criar Proposta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
