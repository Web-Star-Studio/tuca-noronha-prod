"use client";

import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bed, Wrench, Plane } from 'lucide-react';

interface Guest {
  fullName: string;
  birthDate: string;
  cpf: string;
  category?: string;
}

interface PackageComponent {
  type: string;
  name: string;
  description?: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  startDate?: number;
  endDate?: number;
  details?: any;
}

interface ConfirmacaoReservaProps {
  reservationNumber: string;
  proposalTitle: string;
  proposalDescription: string;
  components?: PackageComponent[];
  totalPrice: number;
  taxes?: number;
  guests: Guest[];
  customerName: string;
  customerEmail: string;
  inclusions?: string[];
  exclusions?: string[];
  validUntil: number;
  paymentTerms: string;
  cancellationPolicy: string;
  createdAt: number;
}

export function ConfirmacaoReserva({
  reservationNumber,
  proposalTitle,
  // proposalDescription, // Not used in this component
  components,
  totalPrice,
  taxes = 0,
  guests,
  customerName,
  customerEmail,
  inclusions,
  exclusions,
  validUntil,
  paymentTerms,
  cancellationPolicy,
  // createdAt, // Not used in this component
}: ConfirmacaoReservaProps) {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const formatDateOnly = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getCategoryByAge = (age: number) => {
    if (age >= 18) return 'ADT';
    if (age >= 2) return 'CHD';
    return 'INF';
  };

  // Separar componentes por tipo - garantir que components é um array
  const safeComponents = components || [];
  const safeInclusions = inclusions || [];
  const safeExclusions = exclusions || [];
  const hotelComponents = safeComponents.filter(c => c.type === 'accommodation');
  const flightComponents = safeComponents.filter(c => c.type === 'flight');
  const serviceComponents = safeComponents.filter(c => c.type === 'service' || c.type === 'activity');

  const hasHotel = hotelComponents.length > 0;
  const hasFlight = flightComponents.length > 0;
  const hasServices = serviceComponents.length > 0;

  return (
    <div className="bg-white w-full max-w-[210mm] mx-auto p-8 print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 bg-teal-700 text-white p-6">
        <h1 className="text-2xl font-bold">Confirmação de reserva</h1>
        <div className="text-right">
          <Image 
            src="/images/tuca-logo.jpeg" 
            alt="Tuca Noronha" 
            width={120} 
            height={60}
            className="mb-2"
          />
        </div>
      </div>

      <div className="text-right mb-6">
        <p className="text-lg font-bold">Reserva Nº {reservationNumber}</p>
      </div>

      {/* Resumo da viagem */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Resumo da viagem</h2>
        
        <div className="flex items-center gap-8 mb-4">
          {hasHotel && (
            <div className="flex items-center gap-2">
              <Bed className="h-5 w-5" />
              <span className="font-medium">Hospedagem</span>
            </div>
          )}
          {hasServices && (
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              <span className="font-medium">Serviços</span>
            </div>
          )}
          {hasFlight && (
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              <span className="font-medium">Aéreo</span>
            </div>
          )}
          
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-teal-700">{formatCurrency(totalPrice)}</p>
            {taxes > 0 && (
              <p className="text-xs text-gray-600">Taxas inclusas: {formatCurrency(taxes)}</p>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Expiração: {formatDate(validUntil)}
        </p>
      </div>

      {/* Comprador */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-2">Comprador</h3>
        <div className="border-t pt-2">
          <p className="font-medium">{customerName}</p>
          <p className="text-sm text-gray-600">{customerEmail}</p>
        </div>
      </div>

      {/* Descrição do Pacote */}
      <div className="mb-8">
        <h3 className="text-base font-bold mb-3 uppercase">{proposalTitle}</h3>
        
        <div className="mb-4">
          <p className="font-bold mb-2">DESCRIÇÃO</p>
          <div className="pl-4">
            <p className="font-semibold mb-2">Inclui:</p>
            {safeInclusions.map((item, index) => (
              <p key={index} className="text-sm mb-1">* {item}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Hotel Details */}
      {hotelComponents.map((hotel, idx) => (
        <div key={idx} className="mb-8">
          <h3 className="text-lg font-bold mb-3">Hotel: {hotel.name}</h3>
          
          {hotel.details?.location && (
            <p className="text-sm text-gray-600 mb-4">{hotel.details.location}</p>
          )}

          <div className="mb-4">
            <p className="font-semibold mb-2">Quarto {idx + 1}</p>
            <div className="flex items-center gap-8 text-sm">
              {hotel.startDate && hotel.endDate && (
                <div className="flex items-center gap-2">
                  <span>📅 {format(new Date(hotel.startDate), "dd/MM/yyyy")} Até {format(new Date(hotel.endDate), "dd/MM/yyyy")}</span>
                  <span className="text-gray-600">
                    {Math.ceil((hotel.endDate - hotel.startDate) / (1000 * 60 * 60 * 24))} Noites
                  </span>
                </div>
              )}
              {hotel.details?.roomType && (
                <>
                  <span>🛏️ {hotel.details.roomType}</span>
                </>
              )}
              {hotel.details?.mealPlan && (
                <span>🍽️ {hotel.details.mealPlan}</span>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Hospedes Table */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-3">Hóspedes</h3>
        
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-teal-700 text-white">
              <th className="border border-gray-300 px-4 py-2 text-left">Nome</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Categoria</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Idade</th>
              <th className="border border-gray-300 px-4 py-2 text-center">Nascimento</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest, index) => {
              const age = calculateAge(guest.birthDate);
              const category = guest.category || getCategoryByAge(age);
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 px-4 py-2">{guest.fullName.toUpperCase()}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{category}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{age}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{formatDateOnly(guest.birthDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Flight Details */}
      {flightComponents.map((flight, idx) => (
        <div key={idx} className="mb-8 page-break-before">
          <h3 className="text-lg font-bold mb-3">Aéreo - Localizador {flight.details?.locator || 'A CONFIRMAR'}</h3>
          
          <div className="bg-teal-700 text-white px-4 py-2 flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span>✈️ {flight.details?.direction === 'outbound' ? 'Ida' : 'Volta'}</span>
              <span>{flight.quantity} {flight.quantity > 1 ? 'Adultos' : 'Adulto'}</span>
              <span>{flight.details?.baggage || 'SEM BAGAGEM'}</span>
            </div>
            <span>{flight.startDate ? format(new Date(flight.startDate), "EEE dd/MM/yyyy HH:mm", { locale: ptBR }) : ''}</span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <p className="font-semibold">{flight.details?.origin || 'Origem'}</p>
              <p className="text-gray-600">{flight.startDate ? format(new Date(flight.startDate), "dd/MM/yyyy HH:mm") : ''}</p>
            </div>
            <div className="text-center flex flex-col items-center justify-center">
              <span className="text-2xl">→</span>
            </div>
            <div className="text-right">
              <p className="font-semibold">{flight.details?.destination || 'Destino'}</p>
              <p className="text-gray-600">{flight.endDate ? format(new Date(flight.endDate), "dd/MM/yyyy HH:mm") : ''}</p>
            </div>
          </div>

          {flight.details?.airline && (
            <div className="flex items-center gap-4 text-sm">
              <span className="text-teal-700 font-semibold">✈️ {flight.details.airline}</span>
              {flight.details.flightNumber && (
                <span className="text-gray-600">Nº: {flight.details.flightNumber}</span>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Passageiros (para voos) */}
      {hasFlight && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-3">Passageiros</h3>
          
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-teal-700 text-white">
                <th className="border border-gray-300 px-4 py-2 text-left">Nome</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Tipo</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Idade</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Nascimento</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest, index) => {
                const age = calculateAge(guest.birthDate);
                const category = guest.category || getCategoryByAge(age);
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-300 px-4 py-2">{guest.fullName.toUpperCase()}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{category}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{age}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{formatDateOnly(guest.birthDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Services */}
      {serviceComponents.length > 0 && (
        <div className="mb-8 page-break-before">
          <h3 className="text-lg font-bold mb-4">Serviços</h3>
          
          {serviceComponents.map((service, idx) => (
            <div key={idx} className="mb-6 border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-base">{service.name}</p>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">{service.quantity} {service.quantity > 1 ? 'Pessoas' : 'Pessoa'}</p>
                  {service.startDate && service.endDate && (
                    <p className="text-sm text-gray-600">
                      {format(new Date(service.startDate), "dd/MM/yyyy")} à {format(new Date(service.endDate), "dd/MM/yyyy")}
                    </p>
                  )}
                </div>
              </div>

              {service.details?.provider && (
                <div className="mt-3 bg-gray-50 p-3 rounded">
                  <p className="font-semibold text-sm mb-1">Fornecedor</p>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">{service.details.provider.name}</p>
                    </div>
                    {service.details.provider.phone && (
                      <div>
                        <p className="font-medium">Telefone</p>
                        <p className="text-gray-600">{service.details.provider.phone}</p>
                      </div>
                    )}
                    {service.details.provider.address && (
                      <div>
                        <p className="font-medium">Endereço</p>
                        <p className="text-gray-600">{service.details.provider.address}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Passengers for services */}
          <h4 className="text-base font-bold mb-2">Passageiros</h4>
          <table className="w-full border-collapse mb-4">
            <thead>
              <tr className="bg-teal-700 text-white">
                <th className="border border-gray-300 px-4 py-2 text-left">Nome</th>
                <th className="border border-gray-300 px-4 py-2 text-center">Categoria</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest, index) => {
                const age = calculateAge(guest.birthDate);
                const category = guest.category || getCategoryByAge(age);
                return (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-300 px-4 py-2">{guest.fullName.toUpperCase()}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{category}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* NÃO INCLUI */}
      {safeExclusions.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-3">NÃO INCLUI:</h3>
          <ul className="list-disc pl-6 space-y-1">
            {safeExclusions.map((item, index) => (
              <li key={index} className="text-sm">{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Informações Gerais - Page Break */}
      <div className="page-break-before">
        <h3 className="text-lg font-bold mb-4">Informações gerais</h3>
        
        {/* Payment Terms */}
        <div className="mb-6">
          <h4 className="font-bold mb-2">FORMA DE PAGAMENTO:</h4>
          <p className="text-sm whitespace-pre-wrap">{paymentTerms}</p>
        </div>

        {/* Important Info */}
        <div className="mb-6">
          <h4 className="font-bold mb-2">IMPORTANTE:</h4>
          <div className="text-sm space-y-2">
            <p>Caso o pagamento não seja efetuado dentro do prazo abaixo estipulado na confirmação de reserva em anexo a mesma será automaticamente cancelada.</p>
            <p>Valores sujeitos à disponibilidade de reserva no momento da confirmação da emissão de bilhetes com exceção a tarifa de aéreo e garantia somente até as 18:00 h do mesmo dia que for criada a reserva da parte aérea.</p>
            <p>Reserva não garante tarifa. Preços sujeitos a disponibilidade dos fornecedores e sujeitos a alteração sem aviso prévio.</p>
          </div>
        </div>

        {/* Cancellation Policy */}
        <div className="mb-6">
          <h4 className="font-bold mb-2">POLÍTICA DE CANCELAMENTO:</h4>
          <p className="text-sm whitespace-pre-wrap">{cancellationPolicy}</p>
        </div>

        {/* Contact */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="text-lg font-bold mb-3">Atenciosamente</h4>
          <p className="font-semibold">Equipe Tuca Noronha</p>
          <p className="text-sm text-gray-600">✉️ contato@noronhabrasil.com.br</p>
        </div>
      </div>

      {/* Aviso sobre Taxas */}
      <div className="mt-12 pt-6 border-t-2 border-gray-300">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-yellow-800 mb-2">
                Taxas Não Inclusas
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                O valor desta reserva <strong>NÃO INCLUI</strong> as seguintes taxas obrigatórias para visitação a Fernando de Noronha:
              </p>
              <ul className="space-y-2 text-sm text-yellow-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <div>
                    <strong>Taxa de Preservação Ambiental (TPA):</strong> Taxa diária obrigatória cobrada por dia de permanência na ilha.
                    <br />
                    <a 
                      href="https://www.noronha.pe.gov.br/catalogo-de-servicos/taxa-de-preservacao-ambiental-tpa/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      → Mais informações sobre a TPA
                    </a>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <div>
                    <strong>Ingresso PARNAMAR:</strong> Taxa de acesso ao Parque Nacional Marinho caso deseje visitar as praias e trilhas do parque.
                    <br />
                    <a 
                      href="https://www.parnanoronha.com.br/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      → Mais informações sobre o PARNAMAR
                    </a>
                  </div>
                </li>
              </ul>
              <p className="text-xs text-yellow-600 mt-3 italic">
                * Estas taxas devem ser pagas diretamente pelos visitantes e os valores podem variar. Consulte os sites oficiais para informações atualizadas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          .page-break-before {
            page-break-before: always;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          /* Garantir que a seção de taxas apareça na impressão */
          .bg-yellow-50 {
            background-color: #fefce8 !important;
          }
          
          .border-yellow-400 {
            border-color: #facc15 !important;
          }
          
          .text-yellow-700 {
            color: #a16207 !important;
          }
          
          .text-yellow-800 {
            color: #854d0e !important;
          }
          
          a {
            color: #2563eb !important;
            text-decoration: underline !important;
          }
        }
      `}</style>
    </div>
  );
}
    