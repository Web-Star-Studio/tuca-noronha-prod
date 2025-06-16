"use client"

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  Copy, 
  Check,
  QrCode,
  Star,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cardStyles, buttonStyles, badgeStyles } from "@/lib/ui-config";
import { ChatButton } from "@/components/chat/ChatButton";
import Image from "next/image";

interface ReservationDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function ReservationDetailsPage({ params }: ReservationDetailsPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch all user reservations and find the specific one
  const reservationsData = useQuery(api.domains.bookings.queries.getUserReservations);
  
  const reservation = reservationsData?.find(r => r.id === resolvedParams.id);
  
  // Fetch partner details for contact functionality
  const partnerDetails = useQuery(
    api.domains.bookings.queries.getReservationWithPartnerDetails,
    reservation ? {
      reservationId: reservation.id,
      reservationType: reservation.type as any,
    } : "skip"
  );

  const handleCopyCode = () => {
    if (reservation?.confirmationCode) {
      navigator.clipboard.writeText(reservation.confirmationCode);
      setCopiedCode(true);
      toast.success("Código copiado para a área de transferência!");
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        variant: "secondary" as const, 
        label: "Pendente", 
        color: "bg-yellow-500" 
      },
      confirmed: { 
        variant: "default" as const, 
        label: "Confirmado", 
        color: "bg-green-500" 
      },
      canceled: { 
        variant: "destructive" as const, 
        label: "Cancelado", 
        color: "bg-red-500" 
      },
      completed: { 
        variant: "outline" as const, 
        label: "Concluído", 
        color: "bg-blue-500" 
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      activity: "Atividade",
      event: "Evento", 
      restaurant: "Restaurante",
      vehicle: "Veículo",
      accommodation: "Hospedagem"
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (!reservationsData) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="animate-pulse space-y-8">
          <div className="h-10 w-40 bg-gray-200 rounded" />
          <div className="h-96 w-full bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Reserva não encontrada</h1>
          <p className="text-gray-600 mb-6">A reserva solicitada não foi encontrada ou você não tem permissão para visualizá-la.</p>
          <Button onClick={() => router.push('/meu-painel')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Painel
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(reservation.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-24">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/meu-painel')}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Meu Painel
          </Button>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{reservation.name}</h1>
              <p className="text-gray-600 mt-1">{getTypeLabel(reservation.type)}</p>
            </div>
            <Badge variant={statusConfig.variant} className="text-sm px-3 py-1">
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Details */}
          <div className="xl:col-span-2 space-y-6">
            {/* Image Card */}
            <Card className={cardStyles.base}>
              <CardContent className="p-0">
                <div className="relative h-48 sm:h-64 w-full">
                  <Image
                    src={reservation.imageUrl || "/images/default-reservation.jpg"}
                    alt={reservation.name}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Date and Time Details */}
            <Card className={cardStyles.base}>
              <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  Informações da Reserva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {reservation.type === 'accommodation' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-3 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Check-in</p>
                        <p className="font-semibold">
                          {reservation.checkIn && format(reservation.checkIn, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-3 text-red-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-600">Check-out</p>
                        <p className="font-semibold">
                          {reservation.checkOut && format(reservation.checkOut, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-3 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-600">Data</p>
                      <p className="font-semibold">
                        {reservation.date && format(reservation.date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </p>
                      {reservation.type === 'restaurant' && reservation.date && (
                        <p className="text-sm text-gray-600 mt-1">
                          às {format(reservation.date, "HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-3 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Pessoas</p>
                    <p className="font-semibold">{reservation.guests} {reservation.guests === 1 ? 'pessoa' : 'pessoas'}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="h-5 w-5 mr-3 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-600">Local</p>
                    <p className="font-semibold break-words">{reservation.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enhanced Confirmation Code */}
            <Card className={`${cardStyles.base} border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-blue-800 text-lg">
                  <QrCode className="h-6 w-6 mr-2" />
                  Código de Confirmação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white rounded-xl p-6 border-2 border-dashed border-blue-300 shadow-sm">
                  <div className="text-center space-y-4">
                    <div className="text-3xl sm:text-4xl font-mono font-bold text-blue-900 tracking-wider leading-tight break-all">
                      {reservation.confirmationCode}
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-blue-700 font-medium">
                        Apresente este código no local da reserva
                      </p>
                      <p className="text-xs text-blue-600">
                        Guarde bem este código - você precisará dele para confirmar sua reserva
                      </p>
                    </div>
                    <Button
                      onClick={handleCopyCode}
                      variant="outline"
                      size="lg"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-100 font-medium h-12"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="h-5 w-5 mr-2" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-5 w-5 mr-2" />
                          Copiar Código
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Card */}
            <Card className={cardStyles.base}>
              <CardHeader>
                <CardTitle>Status da Reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${statusConfig.color}`}></div>
                  <span className="font-semibold">{statusConfig.label}</span>
                </div>
                
                {reservation.status === 'confirmed' && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      ✅ Sua reserva foi confirmada! Você pode apresentar o código de confirmação no local.
                    </p>
                  </div>
                )}
                
                {reservation.status === 'pending' && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      ⏳ Sua reserva está aguardando confirmação do estabelecimento.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className={cardStyles.base}>
              <CardHeader>
                <CardTitle>Ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {partnerDetails ? (
                  <ChatButton
                    assetId={partnerDetails.assetId}
                    assetType={partnerDetails.assetType as any}
                    assetName={partnerDetails.assetName}
                    partnerId={partnerDetails.partnerId}
                    bookingId={reservation.id}
                    bookingContext={`Reserva ${reservation.confirmationCode || reservation.id} - ${partnerDetails.assetName}`}
                    variant="outline"
                    className="w-full h-11"
                    showLabel={true}
                    customLabel="Entrar em Contato"
                  />
                ) : (
                  <Button variant="outline" className="w-full h-11" disabled>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Carregando contato...
                  </Button>
                )}
                
                {reservation.status === 'confirmed' && (
                  <Button variant="outline" className="w-full h-11">
                    <Star className="h-4 w-4 mr-2" />
                    Avaliar Experiência
                  </Button>
                )}
                
                {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                  <Button variant="destructive" className="w-full h-11">
                    Cancelar Reserva
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}