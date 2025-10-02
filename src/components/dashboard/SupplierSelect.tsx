"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Factory } from "lucide-react";

interface SupplierSelectProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function SupplierSelect({
  value,
  onValueChange,
  label = "Fornecedor",
  placeholder = "Selecione um fornecedor (opcional)",
  disabled = false,
  required = false,
}: SupplierSelectProps) {
  const suppliersQueries = (api as any).domains.suppliers.queries;
  const suppliers = useQuery(suppliersQueries.listSupplierOptions, { isActive: true });

  const isLoading = suppliers === undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor="supplierId" className="text-sm font-medium flex items-center gap-2">
        <Factory className="h-4 w-4 text-purple-600" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      <Select
        value={value || "none"}
        onValueChange={(val) => onValueChange(val === "none" ? undefined : val)}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className="bg-white shadow-sm">
          <SelectValue placeholder={isLoading ? "Carregando..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-gray-500">Nenhum fornecedor</span>
          </SelectItem>
          {suppliers && suppliers.length > 0 ? (
            suppliers.map((supplier) => (
              <SelectItem key={supplier._id} value={supplier._id}>
                <div className="flex items-center gap-2">
                  <Factory className="h-3.5 w-3.5 text-purple-500" />
                  <span>{supplier.name}</span>
                  {!supplier.isActive && (
                    <span className="text-xs text-gray-400">(Inativo)</span>
                  )}
                </div>
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled>
              <span className="text-gray-400 text-sm">Nenhum fornecedor cadastrado</span>
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-slate-500">
        Associe este asset a um fornecedor para controle de pagamentos e gestão.
      </p>
    </div>
  );
}
