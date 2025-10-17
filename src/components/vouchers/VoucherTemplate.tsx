"use client";

import React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone } from "lucide-react";
import type { VoucherTemplateData, VoucherBookingType } from "../../../convex/domains/vouchers/types";

interface VoucherTemplateProps {
  voucherData: VoucherTemplateData;
  assetType: VoucherBookingType;
}

const formatSafeDate = (dateValue: any): string => {
  try {
    if (!dateValue) return "Data não disponível";

    const date = new Date(dateValue);

    if (isNaN(date.getTime()) || date.getTime() === 0) {
      return "Data inválida";
    }

    return format(date, "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Erro na data";
  }
};

export function VoucherTemplate({ voucherData, assetType }: VoucherTemplateProps) {

  const getAssetTypeLabel = () => {
    switch (assetType) {
      case "activity":
        return "Passeio";
      case "event":
        return "Evento";
      case "restaurant":
        return "Restaurante";
      case "vehicle":
        return "Veículo";
      case "package":
        return "Pacote";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto shadow-lg" id="voucher-content">
      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {/* Fornecedor - Primeiro */}
            {voucherData.supplier && (
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-blue-900">{voucherData.supplier.name}</h2>
                {voucherData.supplier.address && (
                  <p className="text-gray-700 mt-1">📍 {voucherData.supplier.address}</p>
                )}
                {voucherData.supplier.emergencyPhone && (
                  <p className="text-gray-700 mt-1 font-semibold">📞 Fone de Plantão: {voucherData.supplier.emergencyPhone}</p>
                )}
              </div>
            )}
            
            {/* Nome da Atividade - Depois */}
            <h1 className="text-3xl font-bold text-gray-800 mt-2">{voucherData.asset.name || getAssetTypeLabel()}</h1>
            <p className="text-gray-600 mt-2">Voucher: {voucherData.voucher.voucherNumber || "N/A"}</p>
            <p className="text-sm text-gray-600 mt-1">
              Emitido em: {formatSafeDate(voucherData.voucher.generatedAt)}
            </p>
            {voucherData.confirmationInfo && (
              <p className="text-sm text-gray-600">
                Reserva Confirmada por: {voucherData.confirmationInfo.confirmedBy}
              </p>
            )}
          </div>
          <div className="ml-auto">
            <Image 
              src={voucherData.brandInfo.logoUrl || "/images/tuca-logo.jpeg"} 
              alt="Tuca Noronha Logo" 
              width={120} 
              height={120} 
              className="h-24 w-auto object-contain" 
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mb-6">
        {/* Customer Info */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Informações do Cliente</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            {voucherData.customer.phone && (
              <div className="space-y-1 text-gray-600 mb-2">
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {voucherData.customer.phone}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Código da Reserva: <span className="font-mono font-semibold">{voucherData.booking.confirmationCode || voucherData.voucher.voucherNumber}</span>
            </p>
          </div>

          {/* Paxs - Primeiro campo após informações do cliente */}
          <div className="bg-gray-50 p-4 rounded-lg mt-6">
            <p className="font-medium text-gray-900 mb-3 text-lg">👥 Paxs</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Main customer */}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <span className="font-semibold">{voucherData.customer.name}</span>
                <span className="text-xs text-gray-500">(Titular)</span>
              </div>
              
              {/* Additional guests */}
              {voucherData.booking.guestNames && voucherData.booking.guestNames.length > 0 && (
                voucherData.booking.guestNames.map((name, index) => (
                  <div key={`${name}-${index}`} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 2}
                    </span>
                    <span>{name}</span>
                  </div>
                ))
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Total: {1 + (voucherData.booking.guestNames?.length || 0)} {(1 + (voucherData.booking.guestNames?.length || 0)) === 1 ? 'pax' : 'paxs'}
            </p>
          </div>

          {/* Asset Info */}
          <h2 className="text-xl font-semibold mt-6 mb-4">Informações do Serviço</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            {renderBookingDetails(assetType, voucherData.booking)}
          </div>
        </div>
      </div>

      {/* Asset Details Section */}
      <div className="border-t-2 border-gray-200 pt-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Detalhes do {getAssetTypeLabel()}</h2>
        
        {/* Asset Description */}
        {voucherData.asset.description && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="font-medium text-blue-900 mb-2">Descrição</p>
            <p className="text-sm text-blue-800 whitespace-pre-line">{voucherData.asset.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Highlights/Features */}
          {voucherData.asset.highlights && voucherData.asset.highlights.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-medium text-green-900 mb-3">🌟 Destaques do Serviço</p>
              <ul className="space-y-2 text-sm text-green-800">
                {voucherData.asset.highlights.map((highlight, index) => (
                  <li key={`${highlight}-${index}`} className="flex items-start gap-2">
                    <span className="text-green-600 text-xs mt-1">✓</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Includes/Services */}
          {voucherData.asset.includes && voucherData.asset.includes.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-900 mb-3">📋 Inclusões</p>
              <ul className="space-y-2 text-sm text-blue-800">
                {voucherData.asset.includes.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex items-start gap-2">
                    <span className="text-blue-600 text-xs mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Additional Information */}
        {voucherData.asset.additionalInfo && voucherData.asset.additionalInfo.length > 0 && (
          <div className="bg-amber-50 p-4 rounded-lg mt-4">
            <p className="font-medium text-amber-900 mb-3">ℹ️ Informações Importantes</p>
            <ul className="space-y-2 text-sm text-amber-800">
              {voucherData.asset.additionalInfo.map((item, index) => (
                <li key={`${item}-${index}`} className="flex items-start gap-2">
                  <span className="text-amber-600 text-xs mt-1">!</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Booking Details */}
      <div className="border-t-2 border-gray-200 pt-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Detalhes da Reserva</h2>

        {/* Special Requests */}
        {voucherData.booking.specialRequests && (
          <div className="bg-amber-50 p-4 rounded-lg mb-4">
            <p className="font-medium text-amber-900 mb-2">📝 Observações Especiais</p>
            <p className="text-sm text-amber-800 whitespace-pre-line">{voucherData.booking.specialRequests}</p>
          </div>
        )}
      </div>

      {/* Cancellation Policy Section */}
      {voucherData.asset.cancellationPolicy && (
        <div className="border-t-2 border-gray-200 pt-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔄 Política de Cancelamento</h2>
          <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
            <div className="text-sm text-red-800 space-y-2 whitespace-pre-line">
              {Array.isArray(voucherData.asset.cancellationPolicy)
                ? voucherData.asset.cancellationPolicy.map((policy, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-red-600 text-xs mt-1">⚠️</span>
                      <span>{policy}</span>
                    </div>
                  ))
                : <div className="flex items-start gap-2">
                    <span className="text-red-600 text-xs mt-1">⚠️</span>
                    <span>{voucherData.asset.cancellationPolicy}</span>
                  </div>
              }
            </div>
          </div>
        </div>
      )}

      {/* Instructions Section */}
      <div className="border-t-2 border-gray-200 pt-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📋 Instruções de Uso</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check-in Instructions */}
          {voucherData.instructions?.checkIn && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-medium text-green-900 mb-3">✅ Check-in</p>
              <ul className="space-y-1 text-sm text-green-800">
                {voucherData.instructions.checkIn.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 text-xs mt-1">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preparation Instructions */}
          {voucherData.instructions?.preparation && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-blue-900 mb-3">🎒 Preparação</p>
              <ul className="space-y-1 text-sm text-blue-800">
                {voucherData.instructions.preparation.map((instruction, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 text-xs mt-1">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Terms and Conditions */}
      {voucherData.termsAndConditions && voucherData.termsAndConditions.length > 0 && (
        <div className="border-t-2 border-gray-200 pt-6">
          <h2 className="text-xl font-semibold mb-4">📄 Termos e Condições</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-700 space-y-2">
              {voucherData.termsAndConditions.split('. ').map((term, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-gray-500 text-xs mt-1 font-medium">{index + 1}.</span>
                  <span>{term.replace(/\.$/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Important Information - Fees */}
      <div className="border-t-2 border-gray-200 pt-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">⚠️ Informações Importantes</h2>
        <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-400">
          <div className="space-y-3 text-sm text-amber-900">
            <div>
              <p className="font-semibold mb-1">• Não incluso taxa de Preservação Ambiental</p>
              <p className="ml-4">
                (<a href="https://www.noronha.pe.gov.br" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline hover:text-amber-800">www.noronha.pe.gov.br</a>) - <span className="font-bold">R$ 101,33</span> por noite/pessoa;
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">• Não incluso Ingresso de acesso ao parque Marinho</p>
              <p className="ml-4">
                (<a href="https://www.parnanoronha.com.br" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline hover:text-amber-800">www.parnanoronha.com.br</a>) - <span className="font-bold">R$ 186,50</span> por pessoa (brasileiros) e <span className="font-bold">R$ 373,00</span> (estrangeiros). Válido por 10 dias.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center text-sm text-gray-600">
        <p>Este voucher é válido apenas para a data e horário especificados.</p>
        <p>Em caso de dúvidas, entre em contato com a agência Tuca Noronha.</p>
      </div>
    </div>
  );
}

function renderBookingDetails(assetType: VoucherBookingType, details: any) {
  // If no details available, show a default message
  if (!details || Object.keys(details).length === 0) {
    return <p className="text-gray-600">Detalhes da reserva não disponíveis.</p>;
  }

  switch (assetType) {
    case "activity":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Data:</p>
            <p>{formatSafeDate(details.date)}</p>
          </div>
          {details.time && (
            <div>
              <p className="font-medium">Horário de saída:</p>
              <p>{details.time}</p>
            </div>
          )}
        </div>
      );

    case "event":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Data:</p>
            <p>{formatSafeDate(details.date)}</p>
          </div>
          {details.time && (
            <div>
              <p className="font-medium">Horário de saída:</p>
              <p>{details.time}</p>
            </div>
          )}
        </div>
      );

    case "restaurant":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Data:</p>
            <p>{formatSafeDate(details.date)}</p>
          </div>
          {details.time && (
            <div>
              <p className="font-medium">Horário de saída:</p>
              <p>{details.time}</p>
            </div>
          )}
        </div>
      );

    case "vehicle":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Data de Retirada:</p>
            <p>{formatSafeDate(details.startDate)}</p>
          </div>
          {details.time && (
            <div>
              <p className="font-medium">Horário de saída:</p>
              <p>{details.time}</p>
            </div>
          )}
        </div>
      );

    case "package":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Data:</p>
            <p>{formatSafeDate(details.startDate)}</p>
          </div>
          {details.time && (
            <div>
              <p className="font-medium">Horário de saída:</p>
              <p>{details.time}</p>
            </div>
          )}
        </div>
      );

    default:
      return <p>Detalhes da reserva não disponíveis.</p>;
  }
}

