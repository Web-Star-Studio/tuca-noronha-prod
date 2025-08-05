"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Copy, Edit, Eye, MoreHorizontal, Percent, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface CouponCardProps {
  coupon: {
    _id: string;
    code: string;
    name: string;
    description: string;
    discountType: "percentage" | "fixed_amount";
    discountValue: number;
    maxDiscountAmount?: number;
    usageCount: number;
    usageLimit?: number;
    validFrom: number;
    validUntil: number;
    type: "public" | "private" | "first_purchase" | "returning_customer";
    isActive: boolean;
    isPubliclyVisible: boolean;
    globalApplication: {
      isGlobal: boolean;
      assetTypes: string[];
    };
    applicableAssets: Array<{
      assetType: string;
      assetId: string;
      isActive: boolean;
    }>;
    createdAt: number;
  };
  onEdit?: (coupon: any) => void;
  onDelete?: (couponId: string) => void;
  onToggleStatus?: (couponId: string, isActive: boolean) => void;
  onViewDetails?: (coupon: any) => void;
  onViewUsage?: (coupon: any) => void;
}

export default function CouponCard({
  coupon,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetails,
  onViewUsage,
}: CouponCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const formatDiscountValue = () => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    }
    return `R$ ${coupon.discountValue.toFixed(2)}`;
  };

  const getStatusBadge = () => {
    const now = Date.now();
    
    if (!coupon.isActive) {
      return <Badge variant="secondary">Inativo</Badge>;
    }
    
    if (coupon.validUntil < now) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    
    if (coupon.validFrom > now) {
      return <Badge variant="outline">Agendado</Badge>;
    }
    
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return <Badge variant="destructive">Esgotado</Badge>;
    }
    
    return <Badge variant="default">Ativo</Badge>;
  };

  const getTypeBadge = () => {
    const typeLabels = {
      public: "Público",
      private: "Privado",
      first_purchase: "Primeira Compra",
      returning_customer: "Cliente Recorrente",
    };

    const typeColors = {
      public: "default",
      private: "secondary",
      first_purchase: "outline",
      returning_customer: "outline",
    } as const;

    return (
      <Badge variant={typeColors[coupon.type]}>
        {typeLabels[coupon.type]}
      </Badge>
    );
  };

  const getUsageProgress = () => {
    if (!coupon.usageLimit) return 0;
    return Math.min(100, (coupon.usageCount / coupon.usageLimit) * 100);
  };

  const getApplicationScope = () => {
    if (coupon.globalApplication.isGlobal) {
      if (coupon.globalApplication.assetTypes.length === 0) {
        return "Todos os serviços";
      }
      return `Global: ${coupon.globalApplication.assetTypes.join(", ")}`;
    }
    
    if (coupon.applicableAssets.length === 0) {
      return "Nenhum serviço específico";
    }
    
    const activeAssets = coupon.applicableAssets.filter(asset => asset.isActive);
    return `${activeAssets.length} serviço(s) específico(s)`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const copyCodeToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      toast({
        title: "Código copiado!",
        description: "O código do cupom foi copiado para a área de transferência.",
      });
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o código do cupom.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async () => {
    if (!onToggleStatus) return;
    
    setIsLoading(true);
    try {
      await onToggleStatus(coupon._id, !coupon.isActive);
      toast({
        title: coupon.isActive ? "Cupom desativado" : "Cupom ativado",
        description: `O cupom foi ${coupon.isActive ? "desativado" : "ativado"} com sucesso.`,
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do cupom.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (!confirm("Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await onDelete(coupon._id);
      toast({
        title: "Cupom excluído",
        description: "O cupom foi excluído com sucesso.",
      });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o cupom.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Card className="w-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-semibold">
                  {coupon.name}
                </CardTitle>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                  {coupon.code}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={copyCodeToClipboard}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewDetails?.(coupon)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onViewUsage?.(coupon)}>
                  <Percent className="mr-2 h-4 w-4" />
                  Ver uso
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit?.(coupon)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleToggleStatus}
                  disabled={isLoading}
                >
                  {coupon.isActive ? (
                    <ToggleLeft className="mr-2 h-4 w-4" />
                  ) : (
                    <ToggleRight className="mr-2 h-4 w-4" />
                  )}
                  {coupon.isActive ? "Desativar" : "Ativar"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {coupon.description}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Desconto</p>
              <p className="text-xl font-bold text-green-600">
                {formatDiscountValue()}
                {coupon.discountType === "percentage" && coupon.maxDiscountAmount && (
                  <span className="text-xs text-muted-foreground ml-1">
                    (máx. R$ {coupon.maxDiscountAmount.toFixed(2)})
                  </span>
                )}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tipo</p>
              {getTypeBadge()}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Uso</span>
              <span>
                {coupon.usageCount} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : ""}
              </span>
            </div>
            {coupon.usageLimit && (
              <Progress value={getUsageProgress()} className="h-2" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground">Válido de</p>
              <p className="font-medium">{formatDate(coupon.validFrom)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Válido até</p>
              <p className="font-medium">{formatDate(coupon.validUntil)}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Aplicabilidade</p>
            <p className="text-sm">{getApplicationScope()}</p>
          </div>
        </CardContent>

        <CardFooter className="pt-3">
          <div className="flex w-full justify-between items-center text-xs text-muted-foreground">
            <span>
              {coupon.isPubliclyVisible ? "Visível publicamente" : "Não público"}
            </span>
            <span>
              Criado em {formatDate(coupon.createdAt)}
            </span>
          </div>
        </CardFooter>
      </Card>
    </TooltipProvider>
  );
}