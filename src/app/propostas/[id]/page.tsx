"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, MapPinIcon, UsersIcon, CurrencyDollarIcon, ClockIcon, PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

interface ProposalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { id } = await params;
  const { userId } = useAuth();
  
  // Query to get proposal by ID
  const proposal = useQuery(api.domains.packageProposals.queries.getProposalForCustomer, {
    proposalId: id as Id<"packageProposals">,
  });

  // Query to get package request details
  const packageRequest = useQuery(
    api.domains.packageRequests.queries.get,
    proposal ? { id: proposal.packageRequestId } : "skip"
  );

  // Query to get admin details
  const admin = useQuery(
    api.domains.users.queries.getUserDetailsById,
    proposal ? { userId: proposal.adminId } : "skip"
  );

  if (proposal === undefined || packageRequest === undefined || admin === undefined) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (proposal === null) {
    notFound();
  }

  const isExpired = proposal.validUntil < Date.now();
  const canAccept = proposal.status === "sent" && !isExpired;

  const statusConfig = {
    draft: { label: "Rascunho", color: "bg-gray-500" },
    review: { label: "Em Revisão", color: "bg-yellow-500" },
    sent: { label: "Enviada", color: "bg-blue-500" },
    viewed: { label: "Visualizada", color: "bg-purple-500" },
    under_negotiation: { label: "Em Negociação", color: "bg-orange-500" },
    accepted: { label: "Aceita", color: "bg-green-500" },
    rejected: { label: "Rejeitada", color: "bg-red-500" },
    expired: { label: "Expirada", color: "bg-gray-500" },
    withdrawn: { label: "Retirada", color: "bg-gray-500" },
  };

  const currentStatus = isExpired ? "expired" : proposal.status;
  const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
              <p className="text-gray-600 mt-1">Proposta #{proposal.proposalNumber}</p>
            </div>
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.label}
            </Badge>
          </div>
          
          {proposal.summary && (
            <p className="text-lg text-gray-700 mb-4">{proposal.summary}</p>
          )}
          
          <p className="text-gray-600">{proposal.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Components */}
            <Card>
              <CardHeader>
                <CardTitle>Componentes do Pacote</CardTitle>
                <CardDescription>
                  Detalhes de todos os serviços incluídos na sua proposta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proposal.components.map((component, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg">{component.name}</h4>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(component.totalPrice)}</p>
                          <p className="text-sm text-gray-500">
                            {component.quantity}x {formatCurrency(component.unitPrice)}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{component.description}</p>
                      <div className="flex gap-2">
                        {component.included && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Incluído
                          </Badge>
                        )}
                        {component.optional && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            Opcional
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-gray-600">
                          {component.type}
                        </Badge>
                      </div>
                      {component.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">{component.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Inclusions and Exclusions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    O que está incluído
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {proposal.inclusions.map((inclusion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{inclusion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                    O que NÃO está incluído
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {proposal.exclusions.map((exclusion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <XCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{exclusion}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Terms and Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Termos de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{proposal.paymentTerms}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Política de Cancelamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{proposal.cancellationPolicy}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Preços</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(proposal.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impostos</span>
                  <span>{formatCurrency(proposal.taxes)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxas</span>
                  <span>{formatCurrency(proposal.fees)}</span>
                </div>
                {proposal.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(proposal.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(proposal.totalPrice)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Validity and Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Proposta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Válida até</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(proposal.validUntil)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Responsável</p>
                    <p className="text-sm text-gray-600">{admin?.name}</p>
                  </div>
                </div>

                {admin?.email && (
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Contato</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                  </div>
                )}

                <Separator />

                {canAccept ? (
                  <div className="space-y-2">
                    <Button className="w-full" size="lg">
                      Aceitar Proposta
                    </Button>
                    <Button variant="outline" className="w-full">
                      Fazer Pergunta
                    </Button>
                  </div>
                ) : isExpired ? (
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <p className="text-red-600 font-medium">Proposta Expirada</p>
                    <p className="text-sm text-red-500 mt-1">
                      Entre em contato para renovar
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 font-medium">
                      Status: {statusInfo.label}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Package Request Info */}
            {packageRequest && (
              <Card>
                <CardHeader>
                  <CardTitle>Sua Solicitação Original</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Destino</p>
                      <p className="text-sm text-gray-600">{packageRequest.destination}</p>
                    </div>
                  </div>

                  {packageRequest.tripDetails && (
                    <>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Período</p>
                          <p className="text-sm text-gray-600">
                            {packageRequest.tripDetails.duration} dias
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Pessoas</p>
                          <p className="text-sm text-gray-600">
                            {packageRequest.tripDetails.groupSize} pessoas
                          </p>
                        </div>
                      </div>

                      {packageRequest.tripDetails.budget && (
                        <div className="flex items-center gap-2">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">Orçamento</p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(packageRequest.tripDetails.budget)}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Tem alguma dúvida sobre esta proposta?
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/ajuda" className="text-blue-600 hover:underline">
                Central de Ajuda
              </Link>
              <Link href="/contact" className="text-blue-600 hover:underline">
                Fale Conosco
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 