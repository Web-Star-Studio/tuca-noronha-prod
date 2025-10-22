"use client";

import React, { useEffect, use } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { ConfirmacaoReserva } from '@/components/proposals/ConfirmacaoReserva';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';

interface PageProps {
  params: Promise<{
    proposalId: string;
  }>;
}

export default function ConfirmacaoClientePage(props: PageProps) {
  const params = use(props.params);
  const proposalId = params.proposalId as Id<"packageProposals">;
  
  const confirmacaoData = useQuery(api.packageProposals.getConfirmacaoDataCustomer, {
    proposalId,
  });

  // Auto-print when data loads (optional)
  useEffect(() => {
    if (confirmacaoData && window.location.search.includes('auto-print=true')) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [confirmacaoData]);

  if (confirmacaoData === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando documento de confirmação...</p>
        </div>
      </div>
    );
  }

  if (confirmacaoData === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Documento não encontrado</p>
        </div>
      </div>
    );
  }

  const { proposal, packageRequest, reservationNumber, customerInfo, tripDetails } = confirmacaoData;

  // Extract participants data from proposal
  const guests = proposal.participantsData || [];

  // Build request description from packageRequest details
  const buildRequestDescription = () => {
    if (!packageRequest) return undefined;
    
    const parts: string[] = [];
    
    if (packageRequest.specialRequirements) {
      parts.push(`Requisitos Especiais: ${packageRequest.specialRequirements}`);
    }
    
    if (packageRequest.expectedHighlights) {
      parts.push(`Destaques Esperados: ${packageRequest.expectedHighlights}`);
    }
    
    if (packageRequest.previousExperience) {
      parts.push(`Experiência Anterior: ${packageRequest.previousExperience}`);
    }
    
    return parts.length > 0 ? parts.join('\n\n') : undefined;
  };

  const requestDescription = buildRequestDescription();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Action Bar - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 mr-4">
                {customerInfo.name} • Reserva {reservationNumber}
              </p>
              <Button
                onClick={handlePrint}
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Content */}
      <div className="container mx-auto py-8 print:py-0">
        <ConfirmacaoReserva
          reservationNumber={reservationNumber}
          proposalTitle={proposal.title}
          proposalDescription={proposal.description}
          components={proposal.components}
          totalPrice={proposal.totalPrice}
          taxes={proposal.taxes}
          guests={guests}
          customerName={customerInfo.name}
          customerEmail={customerInfo.email}
          inclusions={proposal.inclusions}
          exclusions={proposal.exclusions}
          validUntil={proposal.validUntil}
          paymentTerms={proposal.paymentTerms}
          cancellationPolicy={proposal.cancellationPolicy}
          createdAt={proposal.createdAt}
          tripDetails={tripDetails}
          requestDescription={requestDescription}
        />
      </div>
    </div>
  );
}
