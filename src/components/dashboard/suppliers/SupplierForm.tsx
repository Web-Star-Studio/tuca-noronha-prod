"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Building2, Lock, Save, X } from "lucide-react";

interface BankDetails {
  bankName?: string;
  accountType?: string;
  agency?: string;
  accountNumber?: string;
}

interface SupplierFormData {
  // Public fields
  name: string;
  address?: string;
  cnpj?: string;
  emergencyPhone?: string;

  // Private fields
  bankDetails?: BankDetails;
  financialEmail?: string;
  contactPerson?: string;
  financialPhone?: string;
  pixKey?: string;

  // Legacy/other
  phone?: string;
  email?: string;
  notes?: string;
}

interface SupplierFormProps {
  supplier?: {
    _id: Id<"suppliers">;
    name: string;
    address?: string;
    cnpj?: string;
    emergencyPhone?: string;
    bankDetails?: BankDetails;
    financialEmail?: string;
    contactPerson?: string;
    financialPhone?: string;
    pixKey?: string;
    phone?: string;
    email?: string;
    notes?: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SupplierForm({ supplier, onSuccess, onCancel }: SupplierFormProps) {
  const [isPrivateOpen, setIsPrivateOpen] = useState(false);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: supplier?.name || "",
    address: supplier?.address || "",
    cnpj: supplier?.cnpj || "",
    emergencyPhone: supplier?.emergencyPhone || "",
    bankDetails: supplier?.bankDetails || {},
    financialEmail: supplier?.financialEmail || "",
    contactPerson: supplier?.contactPerson || "",
    financialPhone: supplier?.financialPhone || "",
    pixKey: supplier?.pixKey || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    notes: supplier?.notes || "",
  });

  const createSupplier = useMutation(api.domains.suppliers.mutations.createSupplier);
  const updateSupplier = useMutation(api.domains.suppliers.mutations.updateSupplier);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 14) {
      return numbers.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        "$1.$2.$3/$4-$5"
      );
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
      }
      return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }
    return value;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nome do fornecedor é obrigatório");
      return;
    }

    setIsSubmitting(true);

    try {
      if (supplier) {
        // Update existing supplier
        await updateSupplier({
          id: supplier._id,
          name: formData.name,
          address: formData.address || undefined,
          cnpj: formData.cnpj || undefined,
          emergencyPhone: formData.emergencyPhone || undefined,
          bankDetails: formData.bankDetails,
          financialEmail: formData.financialEmail || undefined,
          contactPerson: formData.contactPerson || undefined,
          financialPhone: formData.financialPhone || undefined,
          pixKey: formData.pixKey || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          notes: formData.notes || undefined,
        });
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        // Create new supplier
        await createSupplier({
          name: formData.name,
          address: formData.address || undefined,
          cnpj: formData.cnpj || undefined,
          emergencyPhone: formData.emergencyPhone || undefined,
          bankDetails: formData.bankDetails,
          financialEmail: formData.financialEmail || undefined,
          contactPerson: formData.contactPerson || undefined,
          financialPhone: formData.financialPhone || undefined,
          pixKey: formData.pixKey || undefined,
          phone: formData.phone || undefined,
          email: formData.email || undefined,
          notes: formData.notes || undefined,
        });
        toast.success("Fornecedor criado com sucesso!");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      toast.error("Erro ao salvar fornecedor. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Public Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Informações Públicas</h3>
          <span className="text-xs text-blue-600">(aparecem no voucher)</span>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="flex items-center gap-1">
              Nome do Fornecedor <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Agência de Turismo ABC"
              required
              className="bg-white"
            />
          </div>

          <div>
            <Label htmlFor="address">Endereço</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Rua, número, bairro, cidade - UF"
              rows={2}
              className="bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => {
                  const formatted = formatCNPJ(e.target.value);
                  setFormData({ ...formData, cnpj: formatted });
                }}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                className="bg-white"
              />
            </div>

            <div>
              <Label htmlFor="emergencyPhone">Fone de Plantão</Label>
              <Input
                id="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value);
                  setFormData({ ...formData, emergencyPhone: formatted });
                }}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="bg-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Private Information Section */}
      <Collapsible open={isPrivateOpen} onOpenChange={setIsPrivateOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Dados Privados (Admin)</span>
            </div>
            {isPrivateOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
            {/* Bank Details */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="font-medium text-gray-900 mb-3">Dados Bancários</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Banco</Label>
                  <Input
                    id="bankName"
                    value={formData.bankDetails?.bankName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: {
                          ...formData.bankDetails,
                          bankName: e.target.value,
                        },
                      })
                    }
                    placeholder="Ex: Banco do Brasil"
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="accountType">Tipo de Conta</Label>
                  <Select
                    value={formData.bankDetails?.accountType || ""}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        bankDetails: {
                          ...formData.bankDetails,
                          accountType: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Corrente</SelectItem>
                      <SelectItem value="savings">Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="agency">Agência</Label>
                  <Input
                    id="agency"
                    value={formData.bankDetails?.agency || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: {
                          ...formData.bankDetails,
                          agency: e.target.value,
                        },
                      })
                    }
                    placeholder="0000"
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="accountNumber">Conta</Label>
                  <Input
                    id="accountNumber"
                    value={formData.bankDetails?.accountNumber || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: {
                          ...formData.bankDetails,
                          accountNumber: e.target.value,
                        },
                      })
                    }
                    placeholder="00000-0"
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Contato Financeiro</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactPerson">Contato (Nome)</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPerson: e.target.value })
                    }
                    placeholder="Nome da pessoa de contato"
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="financialPhone">Fone do Financeiro</Label>
                  <Input
                    id="financialPhone"
                    value={formData.financialPhone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setFormData({ ...formData, financialPhone: formatted });
                    }}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="financialEmail">E-mail do Financeiro</Label>
                  <Input
                    id="financialEmail"
                    type="email"
                    value={formData.financialEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, financialEmail: e.target.value })
                    }
                    placeholder="financeiro@empresa.com"
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="pixKey">Chave PIX</Label>
                  <Input
                    id="pixKey"
                    value={formData.pixKey}
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                    placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Internal Notes */}
            <div>
              <Label htmlFor="notes">Notas Internas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações internas sobre o fornecedor..."
                rows={3}
                className="bg-white"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? "Salvando..." : supplier ? "Atualizar" : "Criar Fornecedor"}
        </Button>
      </div>
    </form>
  );
}
