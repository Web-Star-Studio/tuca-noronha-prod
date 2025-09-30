"use client";

import React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Users, Phone, Mail, Car, Package, Utensils, Activity, Calendar } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
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

  const getAssetIcon = () => {
    switch (assetType) {
      case "activity":
        return <Activity className="w-6 h-6" />;
      case "event":
        return <Calendar className="w-6 h-6" />;
      case "restaurant":
        return <Utensils className="w-6 h-6" />;
      case "vehicle":
        return <Car className="w-6 h-6" />;
      case "package":
        return <Package className="w-6 h-6" />;
      default:
        return null;
    }
  };

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
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{voucherData.asset.name || getAssetTypeLabel()}</h1>
            <p>{voucherData.partner.name}</p>
            <p className="text-gray-600 mt-1">Voucher: {voucherData.voucher.voucherNumber || "N/A"}</p>  
          </div>
          <div className="text-right">
            {voucherData.brandInfo.logoUrl ? (
              <Image src={voucherData.brandInfo.logoUrl} alt="Logo" width={64} height={64} className="h-16 mb-2" />
            ) : (
              <div className="flex items-center gap-2 mb-2">
                {getAssetIcon()}
                <span className="text-xl font-semibold">Tuca Noronha</span>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Emitido em: {formatSafeDate(voucherData.voucher.generatedAt)}
            </p>
            {voucherData.confirmationInfo && (
              <p className="text-sm text-gray-600">
                Reserva Confirmada por: {voucherData.confirmationInfo.confirmedBy}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Customer Info */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Informações do Cliente</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-lg mb-2">{voucherData.customer.name || "Atendimento Tuca Noronha"}</p>
            <div className="space-y-1 text-gray-600">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {voucherData.customer.email || "atendimentotucanoronha@gmail.com"}
              </p>
              {voucherData.customer.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {voucherData.customer.phone}
                </p>
              )}
            </div>
          </div>

          {/* Asset Info */}
          <h2 className="text-xl font-semibold mt-6 mb-4">Informações do Serviço</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium text-lg mb-2"></p>
            {renderBookingDetails(assetType, voucherData.booking)}
            {voucherData.asset.location && (
              <div className="space-y-1 mt-4 text-gray-600">
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {voucherData.asset.location}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-4">QR Code</h2>
          {voucherData.voucher.qrCode ? (
            <div className="bg-white p-4 border-2 border-gray-200 rounded-lg">
              <QRCodeSVG value={voucherData.voucher.qrCode} size={160} />
            </div>
          ) : (
            <div className="bg-gray-100 p-8 border-2 border-gray-200 rounded-lg">
              <p className="text-gray-500">QR Code não disponível</p>
            </div>
          )}
          <p className="text-sm text-gray-600 mt-2 text-center">
            Código da Reserva:<br />
            <span className="font-mono font-semibold">{voucherData.booking.confirmationCode || voucherData.voucher.voucherNumber}</span>
          </p>
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
        
        {/* Guest Names */}
        {voucherData.booking.guestNames && voucherData.booking.guestNames.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="font-medium text-gray-900 mb-3">👥 Participantes Adicionais</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {voucherData.booking.guestNames.map((name, index) => (
                <div key={`${name}-${index}`} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Requests */}
        {voucherData.booking.specialRequests && (
          <div className="bg-purple-50 p-4 rounded-lg mb-4">
            <p className="font-medium text-purple-900 mb-2">📝 Observações Especiais</p>
            <p className="text-sm text-purple-800 whitespace-pre-line">{voucherData.booking.specialRequests}</p>
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

      {/* Footer */}
      <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center text-sm text-gray-600">
        <p>Este voucher é válido apenas para a data e horário especificados.</p>
        <p>Em caso de dúvidas, entre em contato com o estabelecimento.</p>
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
          {details.participants && (
            <div>
              <p className="font-medium">Participantes:</p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {details.participants} {details.participants === 1 ? "pessoa" : "pessoas"}
              </p>
            </div>
          )}
          {details.ticketType && (
            <div>
              <p className="font-medium">Tipo de Ingresso:</p>
              <p>{details.ticketType}</p>
            </div>
          )}
          {details.totalPrice && details.totalPrice > 0 && (
            <div>
              <p className="font-medium">Valor Total:</p>
              <p className="text-lg font-semibold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(details.totalPrice)}
              </p>
            </div>
          )}
          {details.meetingPoint && (
            <div className="md:col-span-2">
              <p className="font-medium">Ponto de Encontro:</p>
              <p>{details.meetingPoint}</p>
            </div>
          )}
          {details.specialRequests && (
            <div className="md:col-span-2">
              <p className="font-medium">Observações:</p>
              <p>{details.specialRequests}</p>
            </div>
          )}
          {renderGuestNames(details.guestNames)}
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
              <p className="font-medium">Horário:</p>
              <p>{details.time}</p>
            </div>
          )}
          {details.quantity && (
            <div>
              <p className="font-medium">Quantidade:</p>
              <p>{details.quantity} {details.quantity === 1 ? "ingresso" : "ingressos"}</p>
            </div>
          )}
          {details.ticketType && (
            <div>
              <p className="font-medium">Tipo de Ingresso:</p>
              <p>{details.ticketType}</p>
            </div>
          )}
          {details.location && (
            <div className="md:col-span-2">
              <p className="font-medium">Local:</p>
              <p>{details.location}</p>
            </div>
          )}
          {details.sector && (
            <div>
              <p className="font-medium">Setor:</p>
              <p>{details.sector}</p>
            </div>
          )}
          {details.seats && (
            <div>
              <p className="font-medium">Assentos:</p>
              <p>{details.seats}</p>
            </div>
          )}
          {details.totalPrice && details.totalPrice > 0 && (
            <div className="md:col-span-2">
              <p className="font-medium">Valor Total:</p>
              <p className="text-lg font-semibold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(details.totalPrice)}
              </p>
            </div>
          )}
          {renderGuestNames(details.guestNames)}
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
              <p className="font-medium">Horário:</p>
              <p>{details.time}</p>
            </div>
          )}
          {details.partySize && (
            <div>
              <p className="font-medium">Número de Pessoas:</p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {details.partySize} {details.partySize === 1 ? "pessoa" : "pessoas"}
              </p>
            </div>
          )}
          {details.table && (
            <div>
              <p className="font-medium">Mesa:</p>
              <p>{details.table}</p>
            </div>
          )}
          {details.menuType && (
            <div className="md:col-span-2">
              <p className="font-medium">Tipo de Menu:</p>
              <p>{details.menuType}</p>
            </div>
          )}
          {details.specialRequests && (
            <div className="md:col-span-2">
              <p className="font-medium">Observações:</p>
              <p>{details.specialRequests}</p>
            </div>
          )}
          {renderGuestNames(details.guestNames)}
        </div>
      );

    case "vehicle":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium">Data de Retirada:</p>
            <p>{formatSafeDate(details.startDate)}</p>
          </div>
          <div>
            <p className="font-medium">Data de Devolução:</p>
            <p>{formatSafeDate(details.endDate)}</p>
          </div>
          {details.vehicleModel && (
            <div>
              <p className="font-medium">Modelo:</p>
              <p>{details.vehicleModel}</p>
            </div>
          )}
          {details.vehicleCategory && (
            <div>
              <p className="font-medium">Categoria:</p>
              <p>{details.vehicleCategory}</p>
            </div>
          )}
          {details.pickupLocation && (
            <div className="md:col-span-2">
              <p className="font-medium">Local de Retirada:</p>
              <p>{details.pickupLocation}</p>
            </div>
          )}
          {details.returnLocation && (
            <div className="md:col-span-2">
              <p className="font-medium">Local de Devolução:</p>
              <p>{details.returnLocation}</p>
            </div>
          )}
          {details.additionalDrivers && details.additionalDrivers > 0 && (
            <div>
              <p className="font-medium">Motoristas Adicionais:</p>
              <p>{details.additionalDrivers}</p>
            </div>
          )}
          {details.totalPrice && details.totalPrice > 0 && (
            <div>
              <p className="font-medium">Valor Total:</p>
              <p className="text-lg font-semibold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(details.totalPrice)}
              </p>
            </div>
          )}
          {renderGuestNames(details.guestNames)}
        </div>
      );

    case "package":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Período:</p>
              <p>
                {formatSafeDate(details.startDate)} até{" "}
                {formatSafeDate(details.endDate)}
              </p>
            </div>
            <div>
              <p className="font-medium">Número de Pessoas:</p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {details.guests} {details.guests === 1 ? "pessoa" : "pessoas"}
              </p>
            </div>
          </div>

          {details.includedItems && (
            <div>
              <p className="font-medium mb-2">Itens Incluídos:</p>
              <div className="pl-4 space-y-2">
                {details.includedItems.accommodation && (
                  <p>• Hospedagem: {details.includedItems.accommodation}</p>
                )}
                {details.includedItems.vehicle && (
                  <p>• Veículo: {details.includedItems.vehicle}</p>
                )}
                {details.includedItems.activities?.length > 0 && (
                  <div>
                    <p>• Atividades:</p>
                    <ul className="pl-4 list-disc">
                      {details.includedItems.activities.map((activity: string, index: number) => (
                        <li key={index}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {details.includedItems.restaurants?.length > 0 && (
                  <div>
                    <p>• Restaurantes:</p>
                    <ul className="pl-4 list-disc">
                      {details.includedItems.restaurants.map((restaurant: string, index: number) => (
                        <li key={index}>{restaurant}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {details.totalPrice > 0 && (
            <div className="pt-4 border-t">
              <p className="font-medium">Valor Total:</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(details.totalPrice)}
              </p>
            </div>
          )}
          {renderGuestNames(details.guestNames)}
        </div>
      );

    default:
      return <p>Detalhes da reserva não disponíveis.</p>;
  }
}

function renderGuestNames(guestNames?: string[]) {
  if (!guestNames || guestNames.length === 0) {
    return null;
  }

  return (
    <div className="md:col-span-2">
      <p className="font-medium">Participantes adicionais:</p>
      <ul className="list-disc list-inside text-gray-600 space-y-1 mt-1">
        {guestNames.map((name, index) => (
          <li key={`${name}-${index}`}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
