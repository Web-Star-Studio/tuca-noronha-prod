"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  User,
  FileText,
  MessageSquare,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { 
  STATUS_LABELS, 
  STATUS_COLORS
} from "../../../convex/domains/packages/types";
import { Id } from "@/../convex/_generated/dataModel";
import { usePackageRequestQueries } from "@/hooks/usePackageRequestQueries";

import { RequestDetailsContent } from "./package-request-details/RequestDetailsContent";
import { ProposalsTab } from "./package-request-details/ProposalsTab";
import { ChatTab } from "./package-request-details/ChatTab";
import { AdminActionsTab } from "./package-request-details/AdminActionsTab";

interface PackageRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: Id<"packageRequests"> | null;
}

const LoadingState = () => (
  <DialogContent className="bg-white max-w-6xl max-h-[90vh] flex flex-col">
    <DialogHeader>
      <DialogTitle>Carregando...</DialogTitle>
      <DialogDescription>
        Aguarde enquanto carregamos os detalhes da solicitação.
      </DialogDescription>
    </DialogHeader>
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Carregando detalhes...</p>
      </div>
    </div>
  </DialogContent>
);

export default function PackageRequestDetailsModal({ 
  isOpen, 
  onClose, 
  requestId 
}: PackageRequestDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details");

  const {
    requestDetails,
    requestMessages,
    requestProposals,
    isLoading,
    hasValidId,
  } = usePackageRequestQueries({
    requestId,
    enabled: isOpen,
  });

  if (!isOpen) return null;

  // Não renderizar nada se não temos um requestId válido
  if (!hasValidId) {
    return null;
  }

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <LoadingState />
      </Dialog>
    );
  }
  
  const unreadMessagesCount = requestMessages?.filter(msg => 
    msg.status === "sent" && 
    !msg.senderEmail?.includes("admin") && 
    !msg.senderEmail?.includes("tournarrays")
  ).length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span className="text-xl font-bold">Solicitação #{requestDetails.requestNumber}</span>
            <Badge className={`${STATUS_COLORS[requestDetails.status as keyof typeof STATUS_COLORS]} text-sm px-3 py-1`}>
              {STATUS_LABELS[requestDetails.status as keyof typeof STATUS_LABELS]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da solicitação, propostas e histórico de mensagens.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Detalhes
              </TabsTrigger>
              <TabsTrigger value="proposals" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Propostas ({requestProposals?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat ({requestMessages?.length || 0})
                {unreadMessagesCount > 0 && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {unreadMessagesCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Ações Admin
              </TabsTrigger>
            </TabsList>

            <div className="flex-grow overflow-y-auto mt-4 pr-2">
               <TabsContent value="details">
                  <RequestDetailsContent request={requestDetails} />
               </TabsContent>
               <TabsContent value="proposals">
                  <ProposalsTab 
                    requestId={requestId!} 
                    requestDetails={requestDetails}
                    proposals={requestProposals || []}
                  />
               </TabsContent>
               <TabsContent value="messages" className="h-full">
                  <ChatTab
                    requestId={requestId!}
                    requestDetails={requestDetails}
                    requestMessages={requestMessages}
                  />
               </TabsContent>
               <TabsContent value="admin">
                  <AdminActionsTab
                     requestId={requestId!}
                     requestDetails={requestDetails}
                  />
               </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
} 