"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MapPin, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Supplier, SupplierFormValues } from "@/types/supplier";
import type { EnrichedAsset } from "@/hooks/useOptimizedAssets";

const assetTypeLabels: Record<string, string> = {
  restaurants: "Restaurantes",
  events: "Eventos",
  activities: "Atividades",
  vehicles: "Veículos",
};

const supplierFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do fornecedor"),
  phone: z.string().optional(),
  email: z
    .string()
    .trim()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
  bankDetails: z.object({
    bankName: z.string().optional(),
    agencyNumber: z.string().optional(),
    accountNumber: z.string().optional(),
    accountType: z.string().optional(),
    holderName: z.string().optional(),
    holderDocument: z.string().optional(),
    pixKey: z.string().optional(),
  }),
  assetAssociations: z.array(
    z.object({
      assetId: z.string(),
      assetType: z.string(),
      assetName: z.string().optional(),
    })
  ),
  isActive: z.boolean(),
});

type SupplierFormSchema = z.infer<typeof supplierFormSchema>;

const emptyBankDetails = {
  bankName: "",
  agencyNumber: "",
  accountNumber: "",
  accountType: "",
  holderName: "",
  holderDocument: "",
  pixKey: "",
};

const sanitizeString = (value?: string | null) => {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const sanitizeObject = <T extends Record<string, string | undefined>>(
  input: T
) => {
  const entries = Object.entries(input).reduce<Record<string, string>>((acc, [key, rawValue]) => {
    const value = sanitizeString(rawValue);
    if (value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  return Object.keys(entries).length ? (entries as T) : undefined;
};

const buildDefaultValues = (
  supplier: Supplier | null | undefined
): SupplierFormSchema => {
  if (!supplier) {
    return {
      name: "",
      phone: "",
      email: "",
      notes: "",
      bankDetails: { ...emptyBankDetails },
      assetAssociations: [],
      isActive: true,
    };
  }

  return {
    name: supplier.name,
    phone: supplier.phone ?? "",
    email: supplier.email ?? "",
    notes: supplier.notes ?? "",
    bankDetails: {
      bankName: supplier.bankDetails?.bankName ?? "",
      agencyNumber: supplier.bankDetails?.agencyNumber ?? "",
      accountNumber: supplier.bankDetails?.accountNumber ?? "",
      accountType: supplier.bankDetails?.accountType ?? "",
      holderName: supplier.bankDetails?.holderName ?? "",
      holderDocument: supplier.bankDetails?.holderDocument ?? "",
      pixKey: supplier.bankDetails?.pixKey ?? "",
    },
    assetAssociations: (supplier.assetAssociations ?? []).map((association) => ({
      assetId: association.assetId,
      assetType: association.assetType,
      assetName: association.assetName ?? "",
    })),
    isActive: supplier.isActive,
  };
};

const transformFormValues = (
  values: SupplierFormSchema,
  assetsMap: Map<string, EnrichedAsset>
): SupplierFormValues => {
  const bankDetails = values.bankDetails
    ? sanitizeObject({ ...values.bankDetails })
    : undefined;

  const assetAssociations = values.assetAssociations.map((association) => {
    const assetName = sanitizeString(association.assetName) ?? assetsMap.get(association.assetId)?.name;
    return {
      assetId: association.assetId,
      assetType: association.assetType,
      assetName,
    };
  });

  return {
    name: values.name.trim(),
    phone: sanitizeString(values.phone),
    email: sanitizeString(values.email),
    notes: sanitizeString(values.notes),
    bankDetails,
    assetAssociations,
    isActive: values.isActive,
  };
};

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
  isSubmitting: boolean;
  initialData?: Supplier | null;
  availableAssets: EnrichedAsset[];
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
  availableAssets,
}: SupplierFormDialogProps) {
  const assetsMap = useMemo(() => {
    const map = new Map<string, EnrichedAsset>();
    availableAssets.forEach((asset) => {
      map.set(asset._id, asset);
    });
    return map;
  }, [availableAssets]);

  const defaultValues = useMemo(() => buildDefaultValues(initialData ?? null), [initialData]);

  const form = useForm<SupplierFormSchema>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  const selectedAssets = form.watch("assetAssociations");

  const assetsByType = useMemo(() => {
    return availableAssets.reduce<Record<string, EnrichedAsset[]>>((acc, asset) => {
      if (!acc[asset.assetType]) {
        acc[asset.assetType] = [];
      }
      acc[asset.assetType].push(asset);
      return acc;
    }, {});
  }, [availableAssets]);

  const handleAssetToggle = (asset: EnrichedAsset, checked: boolean) => {
    const current = form.getValues("assetAssociations");

    if (checked) {
      if (current.some((association) => association.assetId === asset._id)) {
        return;
      }
      form.setValue(
        "assetAssociations",
        [...current, { assetId: asset._id, assetType: asset.assetType, assetName: asset.name }],
        { shouldDirty: true }
      );
    } else {
      form.setValue(
        "assetAssociations",
        current.filter((association) => association.assetId !== asset._id),
        { shouldDirty: true }
      );
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    form.setValue(
      "assetAssociations",
      selectedAssets.filter((association) => association.assetId !== assetId),
      { shouldDirty: true }
    );
  };

  const submitHandler = form.handleSubmit(async (values) => {
    const payload = transformFormValues(values, assetsMap);
    await onSubmit(payload);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          form.reset(defaultValues);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar fornecedor" : "Cadastrar fornecedor"}</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para {initialData ? "atualizar" : "registrar"} um fornecedor e vincular assets correspondentes.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={submitHandler} className="space-y-6">
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-6 pb-4">
                <Tabs defaultValue="general" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-1 gap-2 md:w-auto md:grid-cols-3">
                    <TabsTrigger value="general">Dados gerais</TabsTrigger>
                    <TabsTrigger value="financial">Dados bancários</TabsTrigger>
                    <TabsTrigger value="associations">Assets e notas</TabsTrigger>
                  </TabsList>

                  <TabsContent value="general" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do fornecedor *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Noronha Tours" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(81) 99999-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="contato@fornecedor.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border border-dashed border-slate-200 px-4 py-3">
                            <div className="space-y-1">
                              <FormLabel className="text-sm font-medium">Fornecedor ativo</FormLabel>
                              <p className="text-xs text-muted-foreground">
                                Controle se este fornecedor está disponível para novas associações.
                              </p>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="bankDetails.bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Banco</FormLabel>
                            <FormControl>
                              <Input placeholder="Banco do Brasil" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankDetails.accountType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de conta</FormLabel>
                            <FormControl>
                              <Input placeholder="Corrente ou Poupança" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankDetails.agencyNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Agência</FormLabel>
                            <FormControl>
                              <Input placeholder="0001-9" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankDetails.accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conta</FormLabel>
                            <FormControl>
                              <Input placeholder="123456-7" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankDetails.holderName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Titular</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankDetails.holderDocument"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Documento</FormLabel>
                            <FormControl>
                              <Input placeholder="CPF ou CNPJ" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bankDetails.pixKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chave PIX</FormLabel>
                            <FormControl>
                              <Input placeholder="E-mail, telefone ou chave aleatória" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="associations" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-700">Assets associados</h3>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                          {selectedAssets.length}
                        </Badge>
                      </div>

                      {selectedAssets.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedAssets.map((association) => (
                            <Badge
                              key={association.assetId}
                              variant="outline"
                              className="flex items-center gap-2 border-blue-200 bg-blue-50 text-blue-700"
                            >
                              <span className="text-xs font-medium">
                                {association.assetName || assetsMap.get(association.assetId)?.name || "Asset"}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-blue-600 hover:text-blue-800"
                                onClick={() => handleRemoveAsset(association.assetId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="space-y-4 rounded-xl border border-dashed border-slate-200 p-4">
                        {Object.keys(assetsByType).length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-sm text-muted-foreground">
                            <MapPin className="h-5 w-5" />
                            <span>Cadastre assets antes de vinculá-los a fornecedores.</span>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {Object.entries(assetsByType).map(([type, assets]) => (
                              <div key={type} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-semibold text-slate-700">
                                    {assetTypeLabels[type] ?? type}
                                  </h4>
                                  <Badge variant="outline" className="border-slate-200 text-xs text-slate-500">
                                    {assets.length}
                                  </Badge>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {assets.map((asset) => {
                                    const isChecked = selectedAssets.some((association) => association.assetId === asset._id);
                                    return (
                                      <label
                                        key={asset._id}
                                        className={cn(
                                          "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition",
                                          isChecked ? "border-blue-400 bg-blue-50/60" : "border-slate-200 hover:border-blue-300"
                                        )}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(event) => handleAssetToggle(asset, event.target.checked)}
                                          className="mt-1 h-4 w-4 rounded border-slate-300"
                                        />
                                        <div className="space-y-1">
                                          <p className="font-medium text-slate-800">{asset.name}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {asset.partnerName ? `Parceiro: ${asset.partnerName}` : `Tipo: ${assetTypeLabels[asset.assetType] ?? asset.assetType}`}
                                          </p>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Detalhes adicionais sobre o fornecedor, horários preferenciais, contato secundário, etc."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>

            <DialogFooter className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Salvar alterações" : "Cadastrar fornecedor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
