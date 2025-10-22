"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Trash2, Building2, Package } from "lucide-react";

interface InternalCostsManagerProps {
  packageRequestId: Id<"packageRequests">;
  internalCosts?: Array<{
    supplierId: Id<"suppliers">;
    supplierName: string;
    assetType: string;
    assetId: string;
    assetName: string;
    sellingPrice: number;
    netRate: number;
    quantity?: number;
    notes?: string;
    createdAt: number;
    updatedAt: number;
  }>;
}

interface NewCostForm {
  supplierId: string;
  supplierName: string;
  assetType: string;
  assetId: string;
  assetName: string;
  sellingPrice: string;
  netRate: string;
  quantity: string;
  notes: string;
}

const ASSET_TYPES = [
  { value: "activities", label: "Atividade" },
  { value: "events", label: "Evento" },
  { value: "restaurants", label: "Restaurante" },
  { value: "vehicles", label: "Veículo" },
  { value: "accommodation", label: "Hospedagem" },
  { value: "transfer", label: "Transfer" },
  { value: "guide", label: "Guia" },
  { value: "other", label: "Outro" },
];

export function InternalCostsManager({ packageRequestId, internalCosts = [] }: InternalCostsManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCost, setNewCost] = useState<NewCostForm>({
    supplierId: "",
    supplierName: "",
    assetType: "",
    assetId: "",
    assetName: "",
    sellingPrice: "",
    netRate: "",
    quantity: "1",
    notes: "",
  });

  const addInternalCost = useMutation(api.domains.packages.mutations.addPackageRequestInternalCost);
  const removeInternalCost = useMutation(api.domains.packages.mutations.removePackageRequestInternalCost);

  // Query suppliers
  const suppliers = useQuery(api.domains.suppliers.queries.getAllSuppliers);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers?.find(s => s._id === supplierId);
    setNewCost({
      ...newCost,
      supplierId,
      supplierName: supplier?.name || "",
    });
  };

  const handleAddCost = async () => {
    if (!newCost.supplierId || !newCost.assetType || !newCost.assetId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!newCost.sellingPrice || !newCost.netRate) {
      toast.error("Informe os valores de venda e tarifa net");
      return;
    }

    setIsSubmitting(true);
    try {
      await addInternalCost({
        packageRequestId,
        supplierId: newCost.supplierId as Id<"suppliers">,
        supplierName: newCost.supplierName,
        assetType: newCost.assetType,
        assetId: newCost.assetId,
        assetName: newCost.assetName,
        sellingPrice: parseFloat(newCost.sellingPrice),
        netRate: parseFloat(newCost.netRate),
        quantity: parseInt(newCost.quantity) || 1,
        notes: newCost.notes || undefined,
      });

      toast.success("Item adicionado com sucesso");
      setIsAddDialogOpen(false);
      setNewCost({
        supplierId: "",
        supplierName: "",
        assetType: "",
        assetId: "",
        assetName: "",
        sellingPrice: "",
        netRate: "",
        quantity: "1",
        notes: "",
      });
    } catch (error) {
      console.error("Error adding cost:", error);
      toast.error("Erro ao adicionar item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveCost = async (index: number) => {
    if (!confirm("Tem certeza que deseja remover este item?")) {
      return;
    }

    try {
      await removeInternalCost({
        packageRequestId,
        costIndex: index,
      });
      toast.success("Item removido com sucesso");
    } catch (error) {
      console.error("Error removing cost:", error);
      toast.error("Erro ao remover item");
    }
  };

  // Calculate totals
  const totalSellingPrice = internalCosts.reduce(
    (sum, cost) => sum + cost.sellingPrice * (cost.quantity || 1),
    0
  );
  const totalNetRate = internalCosts.reduce(
    (sum, cost) => sum + cost.netRate * (cost.quantity || 1),
    0
  );
  const totalMargin = totalSellingPrice - totalNetRate;
  const marginPercentage = totalSellingPrice > 0 ? (totalMargin / totalSellingPrice) * 100 : 0;

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-amber-900">Custos Internos</CardTitle>
              <CardDescription className="text-amber-700">
                Gestão de fornecedores e custos (visível apenas para admin)
              </CardDescription>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Item de Custo</DialogTitle>
                <DialogDescription>
                  Selecione o fornecedor, asset e defina os valores de venda e custo.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Fornecedor *</Label>
                    <Select value={newCost.supplierId} onValueChange={handleSupplierChange}>
                      <SelectTrigger id="supplier">
                        <SelectValue placeholder="Selecione o fornecedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier._id} value={supplier._id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetType">Tipo de Asset *</Label>
                    <Select
                      value={newCost.assetType}
                      onValueChange={(value) => setNewCost({ ...newCost, assetType: value })}
                    >
                      <SelectTrigger id="assetType">
                        <SelectValue placeholder="Selecione o tipo" />
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetId">ID do Asset *</Label>
                    <Input
                      id="assetId"
                      value={newCost.assetId}
                      onChange={(e) => setNewCost({ ...newCost, assetId: e.target.value })}
                      placeholder="Ex: k17abc123def..."
                    />
                    <p className="text-xs text-gray-500">
                      Cole o ID do Convex do asset relacionado (se aplicável)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assetName">Nome do Item *</Label>
                    <Input
                      id="assetName"
                      value={newCost.assetName}
                      onChange={(e) => setNewCost({ ...newCost, assetName: e.target.value })}
                      placeholder="Ex: Passeio de Jangada"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Preço de Venda *</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      value={newCost.sellingPrice}
                      onChange={(e) => setNewCost({ ...newCost, sellingPrice: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="netRate">Tarifa Net *</Label>
                    <Input
                      id="netRate"
                      type="number"
                      step="0.01"
                      value={newCost.netRate}
                      onChange={(e) => setNewCost({ ...newCost, netRate: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={newCost.quantity}
                      onChange={(e) => setNewCost({ ...newCost, quantity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={newCost.notes}
                    onChange={(e) => setNewCost({ ...newCost, notes: e.target.value })}
                    placeholder="Notas internas sobre este item..."
                    rows={3}
                  />
                </div>

                {newCost.sellingPrice && newCost.netRate && (
                  <div className="rounded-lg bg-blue-50 p-3 text-sm">
                    <p className="font-medium text-blue-900">Margem estimada:</p>
                    <p className="text-blue-700">
                      {formatCurrency(
                        (parseFloat(newCost.sellingPrice) - parseFloat(newCost.netRate)) *
                          (parseInt(newCost.quantity) || 1)
                      )}{" "}
                      (
                      {(
                        ((parseFloat(newCost.sellingPrice) - parseFloat(newCost.netRate)) /
                          parseFloat(newCost.sellingPrice)) *
                        100
                      ).toFixed(1)}
                      %)
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddCost} disabled={isSubmitting}>
                  {isSubmitting ? "Adicionando..." : "Adicionar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {internalCosts.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-amber-200 bg-white p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-amber-300" />
            <h3 className="mt-4 text-sm font-medium text-gray-900">Nenhum item adicionado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Adicione fornecedores e assets para gerenciar os custos internos deste pacote.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Preço Venda</TableHead>
                    <TableHead className="text-right">Tarifa Net</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {internalCosts.map((cost, index) => {
                    const quantity = cost.quantity || 1;
                    const totalSelling = cost.sellingPrice * quantity;
                    const totalNet = cost.netRate * quantity;
                    const margin = totalSelling - totalNet;
                    const marginPercent = (margin / totalSelling) * 100;

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{cost.supplierName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{cost.assetName}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {ASSET_TYPES.find(t => t.value === cost.assetType)?.label || cost.assetType}
                            </Badge>
                            {cost.notes && (
                              <p className="mt-1 text-xs text-gray-500">{cost.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(totalSelling)}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {formatCurrency(totalNet)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <p className="font-medium text-green-600">{formatCurrency(margin)}</p>
                            <p className="text-xs text-gray-500">{marginPercent.toFixed(1)}%</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCost(index)}
                            className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">Resumo Financeiro</h4>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Total Venda</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(totalSellingPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Total Net</p>
                  <p className="text-lg font-bold text-gray-700">{formatCurrency(totalNetRate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Margem Total</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(totalMargin)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Margem %</p>
                  <p className="text-lg font-bold text-green-600">{marginPercentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
