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
  MapPin, 
  Users, 
  Copy, 
  Check,
  QrCode,
  Star,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Hourglass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ChatButton } from "@/components/chat/ChatButton";
import RagChatButton from "@/components/chat/RagChatButton";
import { VoucherDownloadButton } from "@/components/vouchers/VoucherDownloadButton";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ReservationDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function ReservationDetailsPage({ params }: ReservationDetailsPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [copiedCode, setCopiedCode] = useState(false);

  const reservationsData = useQuery(api.domains.bookings.queries.getUserReservations);
  const reservation = reservationsData?.find(r => r.id === resolvedParams.id);
  
  // Skip the query if we don't have a valid reservation yet
  const skipPartnerQuery = !reservation || !reservation.id || !reservation.type;
  
  const partnerDetails = useQuery(
    api.domains.bookings.queries.getReservationWithPartnerDetails,
    skipPartnerQuery ? "skip" : {
      reservationId: reservation.id,
      reservationType: reservation.type as any,
    }
  );

  const handleCopyCode = () => {
    if (reservation?.confirmationCode) {
      navigator.clipboard.writeText(reservation.confirmationCode);
      setCopiedCode(true);
      toast.success("Código de confirmação copiado!");
      setTimeout(() => setCopiedCode(false), 3000);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        label: "Pendente", 
        color: "bg-amber-500 text-amber-foreground",
        icon: <Hourglass className="h-4 w-4" />
      },
      confirmed: { 
        label: "Confirmado", 
        color: "bg-green-500 text-green-foreground",
        icon: <CheckCircle2 className="h-4 w-4" />
      },
      canceled: { 
        label: "Cancelado", 
        color: "bg-red-500 text-red-foreground",
        icon: <AlertTriangle className="h-4 w-4" />
      },
      completed: { 
        label: "Concluído", 
        color: "bg-blue-500 text-blue-foreground",
        icon: <CheckCircle2 className="h-4 w-4" />
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
      <div className="bg-slate-50 dark:bg-gray-950 min-h-screen">
        <div className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-1/3 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-64 w-full bg-slate-200 dark:bg-slate-700 rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 w-full bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-8 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="bg-slate-50 dark:bg-gray-950 min-h-screen">
        <div className="container mx-auto px-4 py-8 pt-24 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white mb-4">Reserva não encontrada</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">A reserva solicitada não foi encontrada ou você não tem permissão para visualizá-la.</p>
          <Button onClick={() => router.push('/reservas')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Minhas Reservas
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(reservation.status);

  return (
    <div className="bg-slate-50 dark:bg-gray-950 font-sans">
      <div className="container mx-auto px-4 py-8 lg:py-12 pt-24">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/meu-painel')}
            className="mb-6 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-0"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Minhas Reservas
          </Button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="max-w-3xl">
              <p className="text-base font-semibold text-blue-600 dark:text-blue-400">{getTypeLabel(reservation.type)}</p>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white">{reservation.name}</h1>
            </div>
            <Badge className={cn("text-sm px-4 py-2 rounded-full flex items-center gap-2", statusConfig.color)}>
              {statusConfig.icon}
              <span className="font-semibold">{statusConfig.label}</span>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Main Details */}
          <div className="lg:col-span-3 space-y-8">
            {/* Image */}
            <div className="relative h-64 md:h-80 w-full rounded-2xl overflow-hidden shadow-lg shadow-slate-200 dark:shadow-slate-900">
              <Image
                src={reservation.imageUrl || "/images/default-reservation.jpg"}
                alt={reservation.name}
                fill
                className="object-cover transition-transform duration-300 ease-in-out hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Reservation Details */}
            <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-slate-800 dark:text-white">
                  <Calendar className="h-6 w-6 mr-3 text-blue-500" />
                  Detalhes da Reserva
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                <Separator className="bg-slate-200 dark:bg-slate-700" />
                {reservation.type === 'accommodation' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-8 w-8 p-1.5 text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-400 rounded-full flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Check-in</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                          {reservation.checkIn && format(reservation.checkIn, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Calendar className="h-8 w-8 p-1.5 text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-400 rounded-full flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Check-out</p>
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                          {reservation.checkOut && format(reservation.checkOut, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Calendar className="h-8 w-8 p-1.5 text-blue-600 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-400 rounded-full flex-shrink-0" />
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Data e Hora</p>
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                        {reservation.date && format(reservation.date, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        {reservation.type === 'restaurant' && reservation.date && ` às ${format(reservation.date, "HH:mm", { locale: ptBR })}`}
                      </p>
                    </div>
                  </div>
                )}

                <Separator className="bg-slate-200 dark:bg-slate-700" />

                <div className="flex items-center gap-4">
                  <Users className="h-8 w-8 p-1.5 text-purple-600 bg-purple-100 dark:bg-purple-900/50 dark:text-purple-400 rounded-full flex-shrink-0" />
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Participantes</p>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{reservation.guests} {reservation.guests === 1 ? 'pessoa' : 'pessoas'}</p>
                  </div>
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700" />

                <div className="flex items-start gap-4">
                  <MapPin className="h-8 w-8 p-1.5 text-orange-600 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-400 rounded-full flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Localização</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 break-words">{reservation.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-8">
            {/* Confirmation Code */}
            <Card className="bg-blue-600 dark:bg-blue-800/50 text-white shadow-lg overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <QrCode className="h-7 w-7" />
                  <h3 className="text-xl font-bold">Seu Código de Confirmação</h3>
                </div>
                <p className="text-blue-100 dark:text-blue-300 text-sm">
                  Apresente este código ou o QR Code do voucher no local da reserva para o check-in.
                </p>
                <div className="bg-white/10 rounded-lg p-4 text-center">
                  <p className="text-4xl font-mono font-bold tracking-widest break-all">
                    {reservation.confirmationCode}
                  </p>
                </div>
                <Button
                  onClick={handleCopyCode}
                  variant="secondary"
                  size="lg"
                  className="w-full bg-white/90 text-blue-700 hover:bg-white font-bold h-12 text-base group"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-5 w-5 mr-2 text-green-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5 mr-2 transition-transform group-hover:scale-110" />
                      Copiar Código
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Actions & Status */}
            <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-slate-800 dark:text-white">Ações da Reserva</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(reservation.status === 'confirmed' || reservation.status === 'completed') && reservation.confirmationCode && (
                  <VoucherDownloadButton
                    bookingId={reservation.id}
                    bookingType={reservation.type as any}
                    variant="default"
                    className="w-full h-12 text-base font-bold"
                    showIcon={true}
                    showLabel={true}
                  />
                )}
                {partnerDetails ? (
                  <ChatButton
                    assetId={partnerDetails.assetId}
                    assetType={partnerDetails.assetType as any}
                    assetName={partnerDetails.assetName}
                    partnerId={partnerDetails.partnerId}
                    bookingId={reservation.id}
                    bookingContext={`Reserva ${reservation.confirmationCode || reservation.id} - ${partnerDetails.assetName}`}
                    variant="outline"
                    className="w-full h-12 text-base"
                    showLabel={true}
                    customLabel="Falar com o parceiro"
                  />
                ) : (
                  <Button variant="outline" className="w-full h-12 text-base" disabled>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Carregando contato...
                  </Button>
                )}

                {/* AI RAG Assistant Button */}
                <RagChatButton
                  variant="outline"
                  className="w-full h-12 text-base"
                  showLabel
                  customLabel="Tirar dúvidas com IA"
                />
                
                {reservation.status === 'completed' && (
                  <Button variant="outline" className="w-full h-12 text-base">
                    <Star className="h-4 w-4 mr-2" />
                    Avaliar Experiência
                  </Button>
                )}
                
                {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                  <Button variant="destructive" className="w-full h-12 text-base">
                    <AlertTriangle className="h-4 w-4 mr-2" />
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
