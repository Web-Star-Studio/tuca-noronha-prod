"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  QrCode, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Plus
} from "lucide-react";
import { VoucherScanner } from "@/components/vouchers/VoucherScanner";
import { CreateManualVoucherForm } from "@/components/vouchers/CreateManualVoucherForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminVouchersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Get current user data
  const currentUser = useQuery(api.domains.users.queries.getCurrentUser);

  // Get vouchers based on user role
  const vouchers = useQuery(
    currentUser?.role === "master" 
      ? api.domains.vouchers.queries.getAllVouchers
      : api.domains.vouchers.queries.getPartnerVouchers,
    currentUser?.role === "master" 
      ? {} // Masters can see all vouchers
      : currentUser?._id 
      ? { partnerId: currentUser._id }
      : "skip"
  );

  // Get voucher statistics (only for partners, not masters)
  const stats = useQuery(
    api.domains.vouchers.queries.getVoucherStats,
    currentUser?._id && currentUser?.role !== "master" 
      ? { partnerId: currentUser._id } 
      : "skip"
  );

  // Filter vouchers based on search and filters
  const voucherList = vouchers?.vouchers || vouchers || [];
  const filteredVouchers = voucherList.filter(voucher => {
    const matchesSearch = voucher.voucher?.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voucher.asset?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || voucher.voucher?.status === statusFilter;
    const matchesType = typeFilter === "all" || voucher.voucher?.bookingType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate stats manually for master users
  const calculatedStats = currentUser?.role === "master" ? {
    active: voucherList.filter(v => v.voucher?.status === "active").length,
    used: voucherList.filter(v => v.voucher?.status === "used").length,
    expired: voucherList.filter(v => v.voucher?.status === "expired").length,
    cancelled: voucherList.filter(v => v.voucher?.status === "cancelled").length,
  } : null;

  // Use calculated stats for masters, or query stats for partners
  const displayStats = stats || calculatedStats;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Ativo</Badge>;
      case "used":
        return <Badge variant="secondary">Utilizado</Badge>;
      case "expired":
        return <Badge variant="destructive">Expirado</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      activity: "Atividade",
      event: "Evento", 
      restaurant: "Restaurante",
      vehicle: "Veículo",
      accommodation: "Hospedagem",
      package: "Pacote"
    };
    return labels[type] || type;
  };

  const handleVoucherClick = (voucher: any) => {
    setSelectedVoucher(voucher);
  };

  const handleScanSuccess = (voucher: any) => {
    setSelectedVoucher(voucher);
    toast.success("Voucher verificado com sucesso!");
  };

  const handleScanError = (error: string) => {
    toast.error(error);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold">Gerenciamento de Vouchers</h1>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Criar Voucher Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Voucher Manual</DialogTitle>
                <DialogDescription>
                  Preencha as informações abaixo para criar um voucher manualmente sem necessidade de reserva prévia.
                </DialogDescription>
              </DialogHeader>
              <CreateManualVoucherForm
                onSuccess={(voucherNumber) => {
                  setIsCreateDialogOpen(false);
                  toast.success(`Voucher ${voucherNumber} criado com sucesso!`);
                  // Open voucher in new tab
                  window.open(`/voucher/${voucherNumber}`, "_blank");
                }}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Button 
            onClick={() => window.open(`/admin/dashboard/vouchers/scanner`, "_blank")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" />
            Scanner QR
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {displayStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Vouchers Ativos</p>
                  <p className="text-2xl font-bold">{displayStats.active || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Utilizados</p>
                  <p className="text-2xl font-bold">{displayStats.used || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Expirados</p>
                  <p className="text-2xl font-bold">{displayStats.expired || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-gray-600">Cancelados</p>
                  <p className="text-2xl font-bold">{displayStats.cancelled || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          <TabsTrigger value="list">Lista de Vouchers</TabsTrigger>
          <TabsTrigger value="scanner">Scanner QR</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Número do voucher, cliente ou serviço..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="used">Utilizado</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="activity">Atividade</SelectItem>
                      <SelectItem value="event">Evento</SelectItem>
                      <SelectItem value="restaurant">Restaurante</SelectItem>
                      <SelectItem value="vehicle">Veículo</SelectItem>
      
                      <SelectItem value="package">Pacote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vouchers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Vouchers ({filteredVouchers?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVouchers?.map((voucherData, index) => (
                      <TableRow key={voucherData.voucher?.voucherNumber || index}>
                        <TableCell className="font-mono text-sm">
                          {voucherData.voucher?.voucherNumber}
                        </TableCell>
                        <TableCell>{voucherData.customer?.name || 'N/A'}</TableCell>
                        <TableCell>{voucherData.asset?.name || 'N/A'}</TableCell>
                        <TableCell>{getTypeLabel(voucherData.voucher?.bookingType || '')}</TableCell>
                        <TableCell>{getStatusBadge(voucherData.voucher?.status || '')}</TableCell>
                        <TableCell>{formatDate(voucherData.voucher?.generatedAt || Date.now())}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVoucherClick(voucherData)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/voucher/${voucherData.voucher?.voucherNumber}`, "_blank")}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredVouchers?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                          Nenhum voucher encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scanner">
          {currentUser._id && (
            <VoucherScanner
              partnerId={currentUser._id}
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Voucher Details Modal would go here */}
      {selectedVoucher && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Detalhes do Voucher</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Número do Voucher</Label>
                <p className="font-mono text-lg">{selectedVoucher.voucherNumber}</p>
              </div>
              <div>
                <Label>Status</Label>
                <div className="mt-1">{getStatusBadge(selectedVoucher.status)}</div>
              </div>
              <div>
                <Label>Cliente</Label>
                <p>{selectedVoucher.customer?.name}</p>
              </div>
              <div>
                <Label>Serviço</Label>
                <p>{selectedVoucher.booking?.assetName}</p>
              </div>
              <div>
                <Label>Tipo</Label>
                <p>{getTypeLabel(selectedVoucher.bookingType)}</p>
              </div>
              <div>
                <Label>Data de Geração</Label>
                <p>{formatDate(selectedVoucher.generatedAt)}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={() => setSelectedVoucher(null)} variant="outline">
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
