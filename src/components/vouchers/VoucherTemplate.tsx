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
  } catch {
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

      {/* Booking Details */}
      <div className="border-t-2 border-gray-200 pt-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Detalhes da Reserva</h2>

      </div>

      {/* Terms and Conditions */}
      {voucherData.termsAndConditions && voucherData.termsAndConditions.length > 0 && (
        <div className="border-t-2 border-gray-200 pt-6">
          <h2 className="text-xl font-semibold mb-4">Termos e Condições</h2>
          <div className="text-sm text-gray-600">
            {voucherData.termsAndConditions}
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
        </div>
      );

    default:
      return <p>Detalhes da reserva não disponíveis.</p>;
  }
} 