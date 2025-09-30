"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, ArrowUp, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TaxaHistoryDrawerProps {
  partnerId: Id<"partners">;
  open: boolean;
  onClose: () => void;
}

export function TaxaHistoryDrawer({ partnerId, open, onClose }: TaxaHistoryDrawerProps) {
  const partner = useQuery(api.domains.partners.queries.getPartnerById, { partnerId });
  const feeHistory = useQuery(api.domains.partners.queries.getPartnerFeeHistory, { partnerId });

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Histórico de Taxas</SheetTitle>
          <SheetDescription>
            {partner?.metadata?.businessName || partner?.user?.name}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          <div className="flex flex-wrap gap-3 items-start sm:items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Taxa Atual</p>
              <p className="text-2xl font-bold">{partner?.feePercentage}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Efetiva desde</p>
              <p className="text-sm">
                {partner?.updatedAt
                  ? formatDistanceToNow(new Date(partner.updatedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })
                  : "Início"}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4">
              {feeHistory?.map((item, index) => {
                const previousFee = index < feeHistory.length - 1 
                  ? feeHistory[index + 1].feePercentage 
                  : null;
                
                const isIncrease = previousFee !== null && item.feePercentage > previousFee;
                
                return (
                  <div key={item._id} className="relative pl-6">
                    {index < feeHistory.length - 1 && (
                      <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-border" />
                    )}
                    
                    <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                    
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-3 items-start justify-between">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {item.feePercentage}%
                            {previousFee !== null && (
                              <Badge
                                variant={isIncrease ? "destructive" : "success"}
                                className="text-xs"
                              >
                                {isIncrease ? (
                                  <ArrowUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <ArrowDown className="h-3 w-3 mr-1" />
                                )}
                                {Math.abs(item.feePercentage - previousFee).toFixed(1)}%
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(item.effectiveDate), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {item.reason && (
                        <p className="text-sm bg-muted p-2 rounded">
                          {item.reason}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{item.createdBy?.name || "Sistema"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {(!feeHistory || feeHistory.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma alteração de taxa registrada
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
} 