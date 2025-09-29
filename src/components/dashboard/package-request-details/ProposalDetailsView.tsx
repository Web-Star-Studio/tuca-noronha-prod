"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "./helpers";
import { Package, FileText, Calendar, DollarSign, Users, Info, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export function ProposalDetailsView({ proposal }: { proposal: any }) {
  if (!proposal) return null;

  // Query attachments for this proposal
  const attachments = useQuery(
    api.domains.packageProposals.documents.getProposalAttachments,
    proposal._id ? { proposalId: proposal._id } : "skip"
  );

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = async (storageId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/download-url?storageId=${storageId}&proposalId=${proposal._id}`);
      
      if (response.ok) {
        const { url } = await response.json();
        
        if (url) {
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Proposta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-500 block">Valor Total</span>
              <span className="text-green-600 font-semibold text-lg">
                {formatCurrency(proposal.totalPrice)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-500 block">Válida até</span>
              <span>{formatDate(proposal.validUntil)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500 block">Componentes</span>
              <span>{proposal.components.length}</span>
            </div>
            <div>
              <span className="font-medium text-gray-500 block">Criada em</span>
              <span>{formatDate(proposal.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {proposal.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" /> Descrição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{proposal.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" /> Componentes Inclusos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {proposal.components && proposal.components.length > 0 ? (
            proposal.components.map((component: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg hover:bg-gray-50">
                <p className="font-semibold">{component.name}</p>
                <p className="text-sm text-gray-600 mt-1">{component.description}</p>
                <Separator className="my-2" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Qtd: {component.quantity}</span>
                  <span className="text-gray-500">Preço Unit.: {formatCurrency(component.unitPrice)}</span>
                  <span className="font-medium">Total: {formatCurrency(component.totalPrice)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Nenhum componente detalhado.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4" /> Termos de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{proposal.paymentTerms}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" /> Política de Cancelamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{proposal.cancellationPolicy}</p>
          </CardContent>
        </Card>
      </div>

      {/* Documentos Anexados */}
      {attachments && attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" /> Documentos Anexados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {attachments.map((attachment: any) => (
                <div 
                  key={attachment.storageId} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-sm">{attachment.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.fileSize)} • {formatDate(attachment.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(attachment.storageId, attachment.fileName)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inclusões e Exclusões */}
      {(proposal.inclusions?.length > 0 || proposal.exclusions?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proposal.inclusions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" /> O que está incluso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {proposal.inclusions.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {proposal.exclusions?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4" /> O que não está incluso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {proposal.exclusions.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
