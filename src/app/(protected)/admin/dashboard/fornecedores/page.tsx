"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import {
  BadgeCheck,
  Ban,
  Building2,
  CheckCircle2,
  Factory,
  Mail,
  MoreHorizontal,
  PencilLine,
  Phone,
} from "lucide-react";
import { DashboardPageHeader, StatsCard } from "../components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SupplierForm } from "@/components/dashboard/suppliers/SupplierForm";

type StatusFilter = "all" | "active" | "inactive";

const suppliersQueries = (api as any).domains.suppliers.queries;
const suppliersMutations = (api as any).domains.suppliers.mutations;

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export default function SuppliersPage() {
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);

  const supplierQueryArgs = useMemo(() => {
    const trimmedSearch = searchTerm.trim();
    const args: { search?: string; isActive?: boolean } = {};

    if (trimmedSearch.length) {
      args.search = trimmedSearch;
    }

    if (statusFilter !== "all") {
      args.isActive = statusFilter === "active";
    }

    return args;
  }, [searchTerm, statusFilter]);

  const suppliers = useQuery(suppliersQueries.listSuppliers, supplierQueryArgs);
  const isSuppliersLoading = suppliers === undefined;

  const setSupplierStatus = useMutation(suppliersMutations.setSupplierStatus);

  const stats = useMemo(() => {
    const list = suppliers ?? [];
    const total = list.length;
    const active = list.filter((supplier) => supplier.isActive).length;
    const inactive = total - active;
    const withAssets = list.filter((supplier) => supplier.assetAssociations.length > 0).length;

    return { total, active, inactive, withAssets };
  }, [suppliers]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setDialogOpen(true);
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setDialogOpen(false);
      setEditingSupplier(null);
    } else {
      setDialogOpen(true);
    }
  };

  const handleToggleStatus = async (supplier: any) => {
    try {
      await setSupplierStatus({ supplierId: supplier._id, isActive: !supplier.isActive });
      toast.success(
        supplier.isActive
          ? "Fornecedor movido para inativos"
          : "Fornecedor reativado com sucesso"
      );
    } catch (error) {
      console.error("Erro ao alterar status do fornecedor", error);
      toast.error("Não foi possível atualizar o status do fornecedor.");
    }
  };

  if (isUserLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!user || user.role !== "master") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Esta área está disponível apenas para administradores master.</p>
          <p>Entre em contato com o suporte caso precise de acesso.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Fornecedores"
        description="Gerencie os fornecedores associados aos assets e mantenha os dados de contato e pagamento sempre atualizados."
        icon={Factory}
        iconColorClassName="text-purple-600"
        iconBgClassName="bg-purple-50"
      >
        <Button onClick={handleOpenCreate}>
          <Building2 className="mr-2 h-4 w-4" />
          Novo fornecedor
        </Button>
      </DashboardPageHeader>

      <section className="grid gap-4 md:grid-cols-4">
        <StatsCard
          title="Fornecedores cadastrados"
          value={stats.total}
          icon={Factory}
          variant="info"
        />
        <StatsCard
          title="Ativos"
          value={stats.active}
          icon={CheckCircle2}
          variant="success"
        />
        <StatsCard
          title="Inativos"
          value={stats.inactive}
          icon={Ban}
          variant="warning"
        />
        <StatsCard
          title="Com assets vinculados"
          value={stats.withAssets}
          icon={BadgeCheck}
          variant="default"
        />
      </section>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <Input
              placeholder="Buscar por nome, email ou asset"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full md:w-80"
            />
            <div className="flex gap-2">
              {(["active", "inactive", "all"] as StatusFilter[]).map((option) => (
                <Button
                  key={option}
                  variant={statusFilter === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(option)}
                >
                  {option === "active" && "Ativos"}
                  {option === "inactive" && "Inativos"}
                  {option === "all" && "Todos"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isSuppliersLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : suppliers && suppliers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Assets vinculados</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier._id}>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{supplier.name}</span>
                          <Badge variant="outline" className="border-slate-200 text-xs text-slate-500">
                            Criado em {formatDate(supplier.createdAt)}
                          </Badge>
                        </div>
                        {supplier.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{supplier.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="space-y-1 text-sm text-slate-600">
                        {supplier.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-blue-500" />
                            <span>{supplier.email}</span>
                          </div>
                        )}
                        {supplier.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-emerald-500" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        {!supplier.email && !supplier.phone && (
                          <p className="text-xs text-muted-foreground">Sem dados de contato</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      {supplier.assetAssociations.length ? (
                        <div className="flex flex-wrap gap-1">
                          {supplier.assetAssociations.map((association) => (
                            <Badge
                              key={`${association.assetType}-${association.assetId}`}
                              variant="secondary"
                              className="bg-slate-100 text-slate-700"
                            >
                              {association.assetName || association.assetType}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Nenhum asset vinculado</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge
                        variant={supplier.isActive ? "outline" : "secondary"}
                        className={cn(
                          "flex w-fit items-center gap-1.5 text-xs",
                          supplier.isActive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-100 text-slate-600"
                        )}
                      >
                        {supplier.isActive ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
                        )}
                        {supplier.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditSupplier(supplier)}>
                            <PencilLine className="mr-2 h-4 w-4" />
                            Editar fornecedor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(supplier)}>
                            {supplier.isActive ? (
                              <Ban className="mr-2 h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            {supplier.isActive ? "Desativar" : "Reativar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <Factory className="h-10 w-10 text-slate-300" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700">Nenhum fornecedor cadastrado.</p>
                <p className="text-sm text-muted-foreground">
                  Cadastre o primeiro fornecedor para vincular assets e manter os contatos organizados.
                </p>
              </div>
              <Button onClick={handleOpenCreate}>Cadastrar fornecedor</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <SupplierForm
              supplier={editingSupplier}
              onSuccess={() => {
                setDialogOpen(false);
                setEditingSupplier(null);
              }}
              onCancel={() => {
                setDialogOpen(false);
                setEditingSupplier(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
