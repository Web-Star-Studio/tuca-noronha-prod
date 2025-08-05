"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Edit, History, MoreHorizontal, Search, InfoIcon, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaxaPartnerModal } from "./TaxaPartnerModal";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface TaxasPartnersListProps {
  selectedPartners: Id<"partners">[];
  onSelectionChange: (partners: Id<"partners">[]) => void;
  onViewHistory: (partnerId: Id<"partners">) => void;
}

export function TaxasPartnersList({
  selectedPartners,
  onSelectionChange,
  onViewHistory,
}: TaxasPartnersListProps) {
  const [search, setSearch] = useState("");
  const [editingPartner, setEditingPartner] = useState<Id<"partners"> | null>(null);
  
  const partners = useQuery(api.domains.partners.queries.listPartners);
  const transactions = useQuery(api.domains.partners.queries.listPartnerTransactions);

  const filteredPartners = partners?.filter(partner => {
    const searchLower = search.toLowerCase();
    return (
      partner.metadata?.businessName?.toLowerCase().includes(searchLower) ||
      partner.user?.name?.toLowerCase().includes(searchLower) ||
      partner.user?.email?.toLowerCase().includes(searchLower)
    );
  });

  const togglePartner = (partnerId: Id<"partners">) => {
    if (selectedPartners.includes(partnerId)) {
      onSelectionChange(selectedPartners.filter(id => id !== partnerId));
    } else {
      onSelectionChange([...selectedPartners, partnerId]);
    }
  };

  const toggleAll = () => {
    if (selectedPartners.length === filteredPartners?.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredPartners?.map(p => p._id) || []);
    }
  };

  const getPartnerRevenue = (partnerId: Id<"partners">) => {
    const partnerTransactions = transactions?.filter(t => 
      t.partnerId === partnerId && t.status === "completed"
    );
    
    if (!partnerTransactions?.length) return 0;
    
    return partnerTransactions.reduce((sum, t) => sum + (t.platformFee || 0), 0);
  };

  return (
    <>
      <Card>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar parceiros..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    filteredPartners?.length > 0 &&
                    selectedPartners.length === filteredPartners?.length
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Parceiro</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Taxa Atual</TableHead>
              <TableHead className="text-right">Receita Gerada</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!partners ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Carregando parceiros...
                </TableCell>
              </TableRow>
            ) : partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">Nenhum parceiro encontrado</p>
                      <p className="text-sm text-muted-foreground">
                        Não há parceiros cadastrados no sistema ainda.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href="/admin/dashboard/configuracoes/taxas/debug">
                        <Button variant="outline" size="sm">
                          <InfoIcon className="h-4 w-4 mr-2" />
                          Ver Diagnóstico
                        </Button>
                      </Link>
                      <Link href="/admin/dashboard/usuarios">
                        <Button size="sm">
                          Gerenciar Usuários
                        </Button>
                      </Link>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPartners?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum parceiro encontrado com os filtros aplicados
                </TableCell>
              </TableRow>
            ) : (
              filteredPartners?.map((partner) => (
              <TableRow key={partner._id}>
                <TableCell>
                  <Checkbox
                    checked={selectedPartners.includes(partner._id)}
                    onCheckedChange={() => togglePartner(partner._id)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {partner.metadata?.businessName || partner.user?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {partner.user?.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {partner.metadata?.businessType === "company" ? "PJ" : "PF"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={partner.onboardingStatus === "completed" ? "default" : "secondary"}
                  >
                    {partner.onboardingStatus === "completed" ? "Ativo" : "Pendente"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-mono font-medium">{partner.feePercentage}%</span>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(getPartnerRevenue(partner._id) / 100)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setEditingPartner(partner._id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Taxa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onViewHistory(partner._id)}>
                        <History className="h-4 w-4 mr-2" />
                        Ver Histórico
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled>
                        Desativar Parceiro
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )))}
          </TableBody>
        </Table>

        {filteredPartners?.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum parceiro encontrado
          </div>
        )}
      </Card>

      {editingPartner && (
        <TaxaPartnerModal
          partnerId={editingPartner}
          open={!!editingPartner}
          onClose={() => setEditingPartner(null)}
        />
      )}
    </>
  );
} 