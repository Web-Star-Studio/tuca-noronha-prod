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
  onSuccess?: (proposalId: Id<"packageProposals">) => void;
  isEditing?: boolean;
  existingProposal?: any;
  customerName?: string;
  requestDetails?: any;
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
  paymentTerms: "",
  cancellationPolicy: "",
};

// Helper function to parse date strings without timezone issues
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatMonthLabel = (monthStr: string) => {
  const [year, month] = monthStr.split("-");
  if (!year || !month) {
    return monthStr;
  }
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
};

const formatTripPeriodFromRequest = (requestDetails?: any) => {
  if (!requestDetails?.tripDetails) {
    return "";
  }

  const trip = requestDetails.tripDetails;

  if (trip.flexibleDates) {
    if (trip.startMonth && trip.endMonth) {
      const startLabel = formatMonthLabel(trip.startMonth);
      const endLabel = formatMonthLabel(trip.endMonth);
      return startLabel === endLabel
        ? `${startLabel} (datas flexíveis)`
        : `${startLabel} - ${endLabel} (datas flexíveis)`;
    }
    return "Datas flexíveis";
  }

  if (trip.startDate && trip.endDate) {
    const start = parseLocalDate(trip.startDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const end = parseLocalDate(trip.endDate).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    return `${start} a ${end}`;
  }

  return "Período a definir";
};

// Helper to format group breakdown - currently unused but kept for future reference
// const formatGroupBreakdown = (tripDetails?: any) => {
//   if (!tripDetails) return "";
//   const adults = typeof tripDetails.adults === "number" ? tripDetails.adults : undefined;
//   const children = typeof tripDetails.children === "number" ? tripDetails.children : undefined;
//   const parts: string[] = [];

//   if (adults !== undefined) {
//     parts.push(`${adults} ${adults === 1 ? "adulto" : "adultos"}`);
//   }

//   if (children !== undefined) {
//     parts.push(`${children} ${children === 1 ? "criança" : "crianças"}`);
//   }

//   return parts.join(" e ");
// };

const buildFormDataFromRequest = (requestDetails?: any) => {
  const trip = requestDetails?.tripDetails;
  const preferences = requestDetails?.preferences;

  const travelPeriod = formatTripPeriodFromRequest(requestDetails);
  const nights = trip?.duration ? String(trip.duration) : "";
  const accommodationType = preferences?.accommodationType?.[0] || "";
  const accommodationDetails = preferences?.accommodationType?.join(", ") || "";
  const includesAirfare = trip?.includesAirfare;

  return {
    ...initialFormData,
    travelPeriod,
    nights,
    departureLocation: trip?.originCity || "",
    accommodationType,
    accommodationDetails,
    fullPackageDescription: "",
    pricePerPerson: "",
    totalPrice: "",
    additionalNotes: includesAirfare === false ? "Este pacote não inclui passagens aéreas." : "",
  };
};

function mapExistingProposalToFormData(existingProposal: any, requestDetails?: any) {
  if (!existingProposal) {
    return buildFormDataFromRequest(requestDetails);
  }

  const trip = requestDetails?.tripDetails;
  const travelPeriod = formatTripPeriodFromRequest(requestDetails);
  const nights = trip?.duration ? String(trip.duration) : "";

  // Map fields from existingProposal.metadata if available, otherwise from proposal itself
  const metadata = existingProposal.metadata || {};

  return {
    ...initialFormData,
    travelPeriod: metadata.travelPeriod || travelPeriod || "",
    nights: metadata.nights || nights || "",
    departureLocation: metadata.departureLocation || trip?.originCity || "",
    airline: metadata.airline || "",
    accommodationType: metadata.accommodationType || "",
    accommodationDetails: metadata.accommodationDetails || "",
    fullPackageDescription: existingProposal.description || metadata.fullPackageDescription || "",
    pricePerPerson: metadata.pricePerPerson || "",
    totalPrice:
      existingProposal.totalPrice !== undefined && existingProposal.totalPrice !== null
        ? String(existingProposal.totalPrice)
        : "",
    additionalNotes: metadata.additionalNotes || "",
    paymentTerms: existingProposal.paymentTerms || "",
    cancellationPolicy: existingProposal.cancellationPolicy || "",
  };
}

export function SimpleProposalModal({
  isOpen,
  onClose,
  packageRequestId,
  onSuccess,
  isEditing = false,
  existingProposal,
  customerName,
  requestDetails,
}: SimpleProposalModalProps) {
  const [formData, setFormData] = useState(() =>
    isEditing && existingProposal
      ? mapExistingProposalToFormData(existingProposal, requestDetails)
      : buildFormDataFromRequest(requestDetails)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createProposal = useMutation(api.domains.packageProposals.mutations.createPackageProposal);
  const updateProposal = useMutation(api.domains.packageProposals.mutations.updatePackageProposal);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (isEditing && existingProposal) {
      setFormData(mapExistingProposalToFormData(existingProposal, requestDetails));
    } else {
      setFormData(buildFormDataFromRequest(requestDetails));
    }
  }, [isOpen, isEditing, existingProposal, requestDetails]);

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
      fullPackageDescription,
      totalPrice,
      paymentTerms,
      cancellationPolicy,
    } = formData;
    if (!travelPeriod || !nights || !totalPrice) {
      toast.error("Preencha os campos obrigatórios: Período, Noites e Preço Total.");
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

    // Incluir nome do cliente no título
    let baseTitle = "Pacote Personalizado";
    if (requestDetails?.tripDetails?.destination) {
      baseTitle = `Pacote para ${requestDetails.tripDetails.destination}`;
    } else if (formData.accommodationType && formData.departureLocation) {
      baseTitle = `${formData.accommodationType} em ${formData.departureLocation}`;
    }
    
    const title = customerName 
      ? `Proposta para ${customerName}: ${baseTitle}`
      : existingProposal?.title ?? `Proposta de Pacote: ${baseTitle}`;

    // Resumo e descrição - apenas o que o admin digitou
    const summary = fullPackageDescription || existingProposal?.summary || `Pacote para ${requestDetails?.tripDetails?.destination || "destino selecionado"}`;
    const description = fullPackageDescription || "";
    const requiresApproval = existingProposal?.requiresApproval ?? false;
    const priority = existingProposal?.priority ?? "normal";
    const tags = existingProposal?.tags ?? ["proposta-simples"];
    const taxes = existingProposal?.taxes ?? 0;
    const fees = existingProposal?.fees ?? 0;
    const discount = existingProposal?.discount ?? 0;
    const currency = existingProposal?.currency ?? "BRL";
    // Validade até 17h30 do mesmo dia (horário de expediente até 18h)
    const getValidUntilToday = () => {
      const now = new Date();
      const deadline = new Date();
      deadline.setHours(17, 30, 0, 0);
      
      // Se já passou de 17h30, retorna 17h30 do dia seguinte
      if (now > deadline) {
        deadline.setDate(deadline.getDate() + 1);
      }
      
      return deadline.getTime();
    };
    
    const validUntil = existingProposal?.validUntil ?? getValidUntilToday();

    const subtotal = totalPriceNum;
    const totalPriceValue = subtotal + taxes + fees - discount;

    const proposalPayload = {
      title,
      description: description,
      summary,
      subtotal,
      taxes,
      fees,
      discount,
      totalPrice: totalPriceValue,
      currency,
      validUntil,
      paymentTerms: paymentTerms || "",
      cancellationPolicy: cancellationPolicy || "",
      requiresApproval,
      priority,
      tags,
      status: "draft", // Proposta começa como rascunho
      metadata: {
        travelPeriod: formData.travelPeriod,
        nights: formData.nights,
        departureLocation: formData.departureLocation,
        airline: formData.airline,
        accommodationType: formData.accommodationType,
        accommodationDetails: formData.accommodationDetails,
        fullPackageDescription: formData.fullPackageDescription,
        pricePerPerson: formData.pricePerPerson,
        additionalNotes: formData.additionalNotes,
      },
    };

    try {
      if (isEditing && existingProposal) {
        const result = await updateProposal({
          id: existingProposal._id,
          ...proposalPayload,
        });

        if (result.success) {
          toast.success("Proposta atualizada com sucesso!");
          if (onSuccess && result.proposalId) {
            onSuccess(result.proposalId);
          }
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
          if (onSuccess && result.proposalId) {
            onSuccess(result.proposalId);
          }
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
            <Label htmlFor="accommodationType">Tipo de Acomodação (opcional)</Label>
            <Input id="accommodationType" name="accommodationType" value={formData.accommodationType} onChange={handleChange} placeholder="Ex: Pousada, Hotel, Resort (opcional)" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accommodationDetails">Detalhes da acomodação (opcional)</Label>
            <Textarea id="accommodationDetails" name="accommodationDetails" value={formData.accommodationDetails} onChange={handleChange} placeholder="Ex: Pousada com piscina, café da manhã incluso (opcional)" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullPackageDescription">Descrição completa do pacote (opcional)</Label>
            <Textarea id="fullPackageDescription" name="fullPackageDescription" value={formData.fullPackageDescription} onChange={handleChange} rows={5} placeholder="Descreva o que está incluso no pacote, o roteiro, etc. (campo opcional)" />
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
              <Label htmlFor="paymentTerms">Forma de Pagamento</Label>
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
              <Label htmlFor="cancellationPolicy">Política de Cancelamento</Label>
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
