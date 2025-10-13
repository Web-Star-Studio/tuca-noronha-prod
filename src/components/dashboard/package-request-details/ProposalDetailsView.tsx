"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "./helpers";
import { Package, FileText, Calendar, DollarSign, Info, Download, Plane, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export function ProposalDetailsView({ proposal }: { proposal: any }) {
  // Query attachments for this proposal
  const attachments = useQuery(
    api.domains.packageProposals.documents.getProposalAttachments,
    proposal?._id ? { proposalId: proposal._id } : "skip"
  );

  if (!proposal) return null;

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

      {/* Dados dos Participantes */}
      {proposal.participantsData && proposal.participantsData.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-purple-900">
              <Users className="h-5 w-5" /> Dados dos Participantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proposal.participantsData.map((participant: any, index: number) => (
                <div key={index} className="bg-white border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                      {index + 1}
                    </div>
                    <h4 className="font-semibold text-gray-900">{participant.fullName}</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 block">Data de Nascimento</span>
                      <span className="font-medium">{participant.birthDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">CPF</span>
                      <span className="font-medium">{participant.cpf}</span>
                    </div>
                    {participant.email && (
                      <div>
                        <span className="text-gray-500 block">Email</span>
                        <span className="font-medium">{participant.email}</span>
                      </div>
                    )}
                    {participant.phone && (
                      <div>
                        <span className="text-gray-500 block">Telefone</span>
                        <span className="font-medium">{participant.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {proposal.participantsDataSubmittedAt && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <p className="text-sm text-purple-600">
                  Dados enviados em {formatDate(proposal.participantsDataSubmittedAt)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações de Voos */}
      {(proposal.flightDetails || proposal.flightBookingNotes) && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-blue-900">
              <Plane className="h-5 w-5" /> Informações dos Voos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposal.flightDetails && (
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Detalhes da Confirmação</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{proposal.flightDetails}</p>
              </div>
            )}
            {proposal.flightBookingNotes && (
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Observações</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{proposal.flightBookingNotes}</p>
              </div>
            )}
            {proposal.flightBookingCompletedAt && (
              <div className="flex items-center gap-2 text-sm text-blue-600 pt-2 border-t border-blue-200">
                <Package className="h-4 w-4" />
                <span>Voos confirmados em {formatDate(proposal.flightBookingCompletedAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documentos do Contrato */}
      {proposal.contractDocuments && proposal.contractDocuments.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-purple-900">
              <FileText className="h-5 w-5" /> Documentos do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {proposal.contractDocuments.map((doc: any, index: number) => (
                <div key={index} className="bg-white border border-purple-200 rounded-lg p-4 flex items-center justify-between hover:bg-purple-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.fileName}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                        <span>•</span>
                        <span>Enviado em {formatDate(doc.uploadedAt)}</span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                    onClick={() => {
                      // TODO: Implement document download
                      console.log("Download document:", doc.fileName);
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              ))}
            </div>
            {proposal.documentsUploadedAt && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <p className="text-sm text-purple-600">
                  Documentos enviados em {formatDate(proposal.documentsUploadedAt)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
