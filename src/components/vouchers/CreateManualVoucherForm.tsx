"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

interface CreateManualVoucherFormProps {
  onSuccess?: (voucherNumber: string) => void;
  onCancel?: () => void;
}

export function CreateManualVoucherForm({
  onSuccess,
  onCancel,
}: CreateManualVoucherFormProps) {
  const createManualVoucher = useMutation(api.domains.vouchers.mutations.createManualVoucher);
  const users = useQuery(api.domains.users.queries.getAllUsers);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    partnerId: "",
    bookingType: "activity" as "activity" | "event" | "restaurant" | "vehicle" | "package" | "admin_reservation",
    assetName: "",
    assetDescription: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    bookingDate: "",
    bookingTime: "",
    participants: 1,
    specialRequests: "",
    supplierName: "",
    supplierAddress: "",
    supplierEmergencyPhone: "",
  });

  const [assetHighlights, setAssetHighlights] = useState<string[]>([""]);
  const [assetIncludes, setAssetIncludes] = useState<string[]>([""]);
  const [assetAdditionalInfo, setAssetAdditionalInfo] = useState<string[]>([""]);
  const [guestNames, setGuestNames] = useState<string[]>([""]);
  const [cancellationPolicy, setCancellationPolicy] = useState<string[]>([""]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayInput = (
    array: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) => {
    const newArray = [...array];
    newArray[index] = value;
    setter(newArray);
  };

  const addArrayItem = (
    array: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter([...array, ""]);
  };

  const removeArrayItem = (
    array: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    if (array.length > 1) {
      setter(array.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.customerId) {
        toast.error("Selecione um cliente");
        return;
      }
      if (!formData.assetName) {
        toast.error("Digite o nome do serviço");
        return;
      }
      if (!formData.customerName) {
        toast.error("Digite o nome do cliente");
        return;
      }
      if (!formData.customerEmail) {
        toast.error("Digite o email do cliente");
        return;
      }
      if (!formData.bookingDate) {
        toast.error("Selecione a data da reserva");
        return;
      }

      // Filter out empty strings from arrays
      const cleanHighlights = assetHighlights.filter((h) => h.trim() !== "");
      const cleanIncludes = assetIncludes.filter((i) => i.trim() !== "");
      const cleanAdditionalInfo = assetAdditionalInfo.filter((a) => a.trim() !== "");
      const cleanGuestNames = guestNames.filter((g) => g.trim() !== "");
      const cleanCancellationPolicy = cancellationPolicy.filter((c) => c.trim() !== "");

      const result = await createManualVoucher({
        customerId: formData.customerId as Id<"users">,
        partnerId: formData.partnerId ? (formData.partnerId as Id<"users">) : undefined,
        bookingType: formData.bookingType,
        assetName: formData.assetName,
        assetDescription: formData.assetDescription || undefined,
        assetHighlights: cleanHighlights.length > 0 ? cleanHighlights : undefined,
        assetIncludes: cleanIncludes.length > 0 ? cleanIncludes : undefined,
        assetAdditionalInfo: cleanAdditionalInfo.length > 0 ? cleanAdditionalInfo : undefined,
        cancellationPolicy: cleanCancellationPolicy.length > 0 ? cleanCancellationPolicy : undefined,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || undefined,
        bookingDate: formData.bookingDate,
        bookingTime: formData.bookingTime || undefined,
        participants: formData.participants || undefined,
        guestNames: cleanGuestNames.length > 0 ? cleanGuestNames : undefined,
        specialRequests: formData.specialRequests || undefined,
        supplierName: formData.supplierName || undefined,
        supplierAddress: formData.supplierAddress || undefined,
        supplierEmergencyPhone: formData.supplierEmergencyPhone || undefined,
      });

      toast.success(`Voucher criado: ${result.voucherNumber}`);
      if (onSuccess) {
        onSuccess(result.voucherNumber);
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar voucher");
      console.error("Error creating manual voucher:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerUsers = users?.filter((u) => u.role === "customer" || u.role === "user") || [];
  const partnerUsers = users?.filter((u) => u.role === "partner" || u.role === "master") || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cliente e Parceiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerId">Cliente *</Label>
          <Select
            value={formData.customerId}
            onValueChange={(value) => handleInputChange("customerId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cliente" />
            </SelectTrigger>
            <SelectContent>
              {customerUsers.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="partnerId">Parceiro (Opcional)</Label>
          <Select
            value={formData.partnerId}
            onValueChange={(value) => handleInputChange("partnerId", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o parceiro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {partnerUsers.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tipo de Reserva e Nome do Serviço */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bookingType">Tipo de Reserva *</Label>
          <Select
            value={formData.bookingType}
            onValueChange={(value: any) => handleInputChange("bookingType", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activity">Atividade</SelectItem>
              <SelectItem value="event">Evento</SelectItem>
              <SelectItem value="restaurant">Restaurante</SelectItem>
              <SelectItem value="vehicle">Veículo</SelectItem>
              <SelectItem value="package">Pacote</SelectItem>
              <SelectItem value="admin_reservation">Reserva Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="assetName">Nome do Serviço *</Label>
          <Input
            id="assetName"
            value={formData.assetName}
            onChange={(e) => handleInputChange("assetName", e.target.value)}
            placeholder="Ex: Passeio de Barco"
          />
        </div>
      </div>

      {/* Descrição do Serviço */}
      <div className="space-y-2">
        <Label htmlFor="assetDescription">Descrição do Serviço</Label>
        <Textarea
          id="assetDescription"
          value={formData.assetDescription}
          onChange={(e) => handleInputChange("assetDescription", e.target.value)}
          placeholder="Descrição detalhada do serviço"
          rows={3}
        />
      </div>

      {/* Destaques */}
      <div className="space-y-2">
        <Label>Destaques do Serviço</Label>
        {assetHighlights.map((highlight, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={highlight}
              onChange={(e) => handleArrayInput(assetHighlights, setAssetHighlights, index, e.target.value)}
              placeholder="Ex: Vista panorâmica incrível"
            />
            {assetHighlights.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeArrayItem(assetHighlights, setAssetHighlights, index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addArrayItem(assetHighlights, setAssetHighlights)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Destaque
        </Button>
      </div>

      {/* Inclusões */}
      <div className="space-y-2">
        <Label>O Que Está Incluído</Label>
        {assetIncludes.map((include, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={include}
              onChange={(e) => handleArrayInput(assetIncludes, setAssetIncludes, index, e.target.value)}
              placeholder="Ex: Transporte ida e volta"
            />
            {assetIncludes.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeArrayItem(assetIncludes, setAssetIncludes, index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addArrayItem(assetIncludes, setAssetIncludes)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Inclusão
        </Button>
      </div>

      {/* Informações Adicionais */}
      <div className="space-y-2">
        <Label>Informações Importantes</Label>
        {assetAdditionalInfo.map((info, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={info}
              onChange={(e) => handleArrayInput(assetAdditionalInfo, setAssetAdditionalInfo, index, e.target.value)}
              placeholder="Ex: Trazer protetor solar"
            />
            {assetAdditionalInfo.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeArrayItem(assetAdditionalInfo, setAssetAdditionalInfo, index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addArrayItem(assetAdditionalInfo, setAssetAdditionalInfo)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Informação
        </Button>
      </div>

      {/* Política de Cancelamento */}
      <div className="space-y-2">
        <Label>Política de Cancelamento</Label>
        {cancellationPolicy.map((policy, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={policy}
              onChange={(e) => handleArrayInput(cancellationPolicy, setCancellationPolicy, index, e.target.value)}
              placeholder="Ex: Cancelamento gratuito até 24h antes"
            />
            {cancellationPolicy.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeArrayItem(cancellationPolicy, setCancellationPolicy, index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addArrayItem(cancellationPolicy, setCancellationPolicy)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Política
        </Button>
      </div>

      {/* Dados do Cliente */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Informações do Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nome do Cliente *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => handleInputChange("customerName", e.target.value)}
              placeholder="Nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email do Cliente *</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => handleInputChange("customerEmail", e.target.value)}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Telefone do Cliente</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone}
              onChange={(e) => handleInputChange("customerPhone", e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>
      </div>

      {/* Dados da Reserva */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Detalhes da Reserva</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bookingDate">Data da Reserva *</Label>
            <Input
              id="bookingDate"
              type="date"
              value={formData.bookingDate}
              onChange={(e) => handleInputChange("bookingDate", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bookingTime">Horário de Saída</Label>
            <Input
              id="bookingTime"
              type="time"
              value={formData.bookingTime}
              onChange={(e) => handleInputChange("bookingTime", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Número de Participantes</Label>
            <Input
              id="participants"
              type="number"
              min="1"
              value={formData.participants}
              onChange={(e) => handleInputChange("participants", parseInt(e.target.value))}
            />
          </div>
        </div>

        {/* Convidados */}
        <div className="space-y-2 mt-4">
          <Label>Convidados Adicionais</Label>
          {guestNames.map((guest, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={guest}
                onChange={(e) => handleArrayInput(guestNames, setGuestNames, index, e.target.value)}
                placeholder="Nome do convidado"
              />
              {guestNames.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeArrayItem(guestNames, setGuestNames, index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem(guestNames, setGuestNames)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Convidado
          </Button>
        </div>

        {/* Observações Especiais */}
        <div className="space-y-2 mt-4">
          <Label htmlFor="specialRequests">Observações Especiais</Label>
          <Textarea
            id="specialRequests"
            value={formData.specialRequests}
            onChange={(e) => handleInputChange("specialRequests", e.target.value)}
            placeholder="Alguma observação ou pedido especial"
            rows={3}
          />
        </div>
      </div>

      {/* Dados do Fornecedor */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Informações do Fornecedor (Opcional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supplierName">Nome do Fornecedor</Label>
            <Input
              id="supplierName"
              value={formData.supplierName}
              onChange={(e) => handleInputChange("supplierName", e.target.value)}
              placeholder="Nome da empresa fornecedora"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplierEmergencyPhone">Telefone de Plantão</Label>
            <Input
              id="supplierEmergencyPhone"
              value={formData.supplierEmergencyPhone}
              onChange={(e) => handleInputChange("supplierEmergencyPhone", e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="supplierAddress">Endereço do Fornecedor</Label>
            <Input
              id="supplierAddress"
              value={formData.supplierAddress}
              onChange={(e) => handleInputChange("supplierAddress", e.target.value)}
              placeholder="Endereço completo"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 justify-end pt-6 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            "Criar Voucher"
          )}
        </Button>
      </div>
    </form>
  );
}
