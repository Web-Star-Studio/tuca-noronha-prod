"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, MapPin, Heart, Info, Users, Calendar, DollarSign, Briefcase, Mail, Phone } from "lucide-react";
import { formatCurrency, formatDate } from "./helpers";

const DetailItem = ({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) => (
  <div className="flex items-start gap-3 transition-colors duration-200 hover:bg-gray-50 p-2 rounded-md">
    <div className="text-gray-500 mt-1">{icon}</div>
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <div className="text-sm text-gray-600">{children}</div>
    </div>
  </div>
);

// Helper function to format trip dates (handles both specific and flexible dates)
const formatTripDates = (tripDetails: any) => {
  if (tripDetails.flexibleDates) {
    // For flexible dates, show months
    const startMonth = tripDetails.startMonth;
    const endMonth = tripDetails.endMonth;
    
    if (startMonth && endMonth) {
      const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      };
      
      if (startMonth === endMonth) {
        return `${formatMonth(startMonth)} (datas flexíveis)`;
      } else {
        return `${formatMonth(startMonth)} - ${formatMonth(endMonth)} (datas flexíveis)`;
      }
    }
    return "Datas flexíveis";
  } else {
    // For specific dates
    if (tripDetails.startDate && tripDetails.endDate) {
      return `${formatDate(tripDetails.startDate)} - ${formatDate(tripDetails.endDate)}`;
    }
    return "Datas a definir";
  }
};

export function RequestDetailsContent({ request }: { request: any }) {
  if (!request) return null;

  const accommodationTypes = request.preferences?.accommodationType ?? [];
  const activities = request.preferences?.activities ?? [];
  const transportation = request.preferences?.transportation ?? [];
  const foodPreferences = request.preferences?.foodPreferences ?? [];
  const accessibility = request.preferences?.accessibility ?? [];

  const formatList = (values: string[] | undefined, emptyLabel = "Não informado") => {
    if (!values || values.length === 0) return emptyLabel;
    return values.join(", ");
  };

  return (
    <div className="space-y-6 p-1">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3 text-gray-700">
                <User className="h-5 w-5 text-blue-600" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailItem icon={<User className="h-4 w-4"/>} label="Nome">
                {request.customerInfo.name}
              </DetailItem>
              <DetailItem icon={<Mail className="h-4 w-4" />} label="Email">
                <a href={`mailto:${request.customerInfo.email}`} className="text-blue-600 hover:underline">
                  {request.customerInfo.email}
                </a>
              </DetailItem>
              <DetailItem icon={<Phone className="h-4 w-4" />} label="Telefone">
                <a href={`tel:${request.customerInfo.phone}`} className="text-blue-600 hover:underline">
                  {request.customerInfo.phone}
                </a>
              </DetailItem>
              <DetailItem icon={<Users className="h-4 w-4"/>} label="Idade">
                {request.customerInfo.age ? `${request.customerInfo.age} anos` : 'Não informado'}
              </DetailItem>
              <DetailItem icon={<Briefcase className="h-4 w-4"/>} label="Profissão">
                {request.customerInfo.occupation || 'Não informado'}
              </DetailItem>
            </CardContent>
          </Card>

          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3 text-gray-700">
                <MapPin className="h-5 w-5 text-blue-600" />
                Detalhes da Viagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DetailItem icon={<MapPin className="h-4 w-4"/>} label="Destino">
                {request.tripDetails.destination}
              </DetailItem>
               <DetailItem icon={<Calendar className="h-4 w-4"/>} label="Datas da Viagem">
                {formatTripDates(request.tripDetails)}
              </DetailItem>
              <DetailItem icon={<Users className="h-4 w-4"/>} label="Tamanho do Grupo">
                {request.tripDetails.groupSize} pessoas ({request.tripDetails.companions})
              </DetailItem>
              <DetailItem 
                icon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                } 
                label="Passagem Aérea"
              >
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  request.tripDetails.includesAirfare === true 
                    ? 'bg-green-100 text-green-800' 
                    : request.tripDetails.includesAirfare === false
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {request.tripDetails.includesAirfare === true 
                    ? '✈️ Com Aéreo' 
                    : request.tripDetails.includesAirfare === false
                    ? '🚫 Sem Aéreo'
                    : 'Não informado'}
                </span>
              </DetailItem>
               <DetailItem icon={<DollarSign className="h-4 w-4"/>} label="Orçamento">
                {formatCurrency(request.tripDetails.budget)} ({request.tripDetails.budgetFlexibility})
              </DetailItem>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="border-none shadow-none">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3 text-gray-700">
                <Heart className="h-5 w-5 text-blue-600" />
                Preferências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><strong>Tipo de Hospedagem:</strong> <span className="ml-2">{formatList(accommodationTypes)}</span></p>
              <p><strong>Atividades:</strong> <span className="ml-2">{formatList(activities)}</span></p>
              <p><strong>Transporte:</strong> <span className="ml-2">{formatList(transportation)}</span></p>
              <p><strong>Preferências Alimentares:</strong> <span className="ml-2">{formatList(foodPreferences)}</span></p>
              {accessibility.length > 0 && (
                <p><strong>Acessibilidade:</strong> <span className="ml-2">{formatList(accessibility)}</span></p>
              )}
            </CardContent>
          </Card>

          {(request.specialRequirements || request.previousExperience || request.expectedHighlights) && (
            <Card className="border-none shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-3 text-gray-700">
                  <Info className="h-5 w-5 text-blue-600" />
                  Informações Adicionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.specialRequirements && (
                  <div>
                    <strong className="font-semibold">Requisitos Especiais:</strong> 
                    <p className="ml-2 mt-1 text-gray-700 bg-gray-50 p-2 rounded-md">{request.specialRequirements}</p>
                  </div>
                )}
                {request.previousExperience && (
                  <div>
                    <strong className="font-semibold">Experiência Anterior:</strong> 
                    <p className="ml-2 mt-1 text-gray-700 bg-gray-50 p-2 rounded-md">{request.previousExperience}</p>
                  </div>
                )}
                {request.expectedHighlights && (
                  <div>
                    <strong className="font-semibold">Expectativas:</strong> 
                    <p className="ml-2 mt-1 text-gray-700 bg-gray-50 p-2 rounded-md">{request.expectedHighlights}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}