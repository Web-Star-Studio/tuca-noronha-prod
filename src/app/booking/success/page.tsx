'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, MapPin, Users, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');
  const [bookingData, setBookingData] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 20; // Máximo de 20 tentativas (20 segundos)

  // Query to get booking details based on session ID or booking ID
  const bookingBySession = useQuery(
    api.domains.stripe.queries.getBookingBySessionId,
    sessionId ? { sessionId } : "skip"
  );

  const bookingByConfirmation = useQuery(
    api.domains.stripe.queries.getBookingByConfirmationCode,
    bookingId ? { confirmationCode: bookingId } : "skip"
  );

  // Use polling to check for booking data
  useEffect(() => {
    const checkBookingStatus = () => {
      const booking = bookingBySession || bookingByConfirmation;
      
      if (booking) {
        console.log('📊 Booking found:', booking);
        setBookingData(booking);
        
        // Show success toast when payment is confirmed
        if (booking.paymentStatus === 'succeeded') {
          toast.success('Pagamento confirmado com sucesso!', {
            description: 'Sua reserva foi aprovada. Você receberá um email de confirmação.',
            duration: 5000,
          });
        }
      } else if (retryCount < maxRetries) {
        // If no booking found and haven't exceeded max retries, try again
        console.log(`🔄 Retry ${retryCount + 1}/${maxRetries} - Booking not found yet`);
        setRetryCount(prev => prev + 1);
      }
    };

    const timer = setTimeout(checkBookingStatus, 1000); // Check every second

    return () => clearTimeout(timer);
  }, [bookingBySession, bookingByConfirmation, retryCount, maxRetries]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      activity: 'Atividade',
      event: 'Evento',
      restaurant: 'Restaurante',
      accommodation: 'Hospedagem',
      vehicle: 'Veículo',
      package: 'Pacote'
    };
    return labels[type] || type;
  };

  const handleDownloadReceipt = () => {
    if (bookingData?.paymentDetails?.receiptUrl) {
      window.open(bookingData.paymentDetails.receiptUrl, '_blank');
    } else {
      toast.error('Comprovante não disponível');
    }
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleViewBookings = () => {
    router.push('/meu-painel/reservas');
  };

  if (!sessionId && !bookingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Link inválido. Não foi possível verificar o pagamento.</p>
              <Button onClick={handleBackToHome} className="mt-4">
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se ainda está procurando a reserva e não excedeu o limite de tentativas
  if (!bookingData && retryCount < maxRetries) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Processando pagamento...</p>
              <p className="text-sm text-gray-600">
                Aguarde enquanto confirmamos seu pagamento com o Stripe
              </p>
              <p className="text-xs text-gray-500 mt-4">
                Tentativa {retryCount} de {maxRetries}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se excedeu o limite de tentativas sem encontrar a reserva
  if (!bookingData && retryCount >= maxRetries) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-orange-600 mb-4">
                O processamento está demorando mais que o esperado.
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Não se preocupe! Se o pagamento foi processado, você receberá um email de confirmação.
                Você também pode verificar o status em "Minhas Reservas".
              </p>
              <div className="space-y-3">
                <Button onClick={handleViewBookings} className="w-full">
                  Ver Minhas Reservas
                </Button>
                <Button onClick={handleBackToHome} variant="outline" className="w-full">
                  Voltar ao Início
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se encontrou a reserva, mostra os detalhes
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {bookingData.paymentStatus === 'succeeded' ? 'Pagamento Confirmado!' : 'Reserva Registrada!'}
          </h1>
          <p className="text-gray-600">
            {bookingData.paymentStatus === 'succeeded' 
              ? 'Sua reserva foi processada com sucesso'
              : 'Aguardando confirmação do pagamento'}
          </p>
        </div>

        {/* Booking Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">{getAssetTypeLabel(bookingData.assetType)}</Badge>
              {bookingData.assetName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Confirmation Code */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Código de Confirmação</p>
                <p className="text-lg font-mono font-bold text-blue-900">
                  {bookingData.confirmationCode}
                </p>
              </div>

              {/* Booking Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookingData.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Data</p>
                      <p className="font-medium">{formatDate(bookingData.date)}</p>
                    </div>
                  </div>
                )}

                {bookingData.checkIn && bookingData.checkOut && (
                  <>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Check-in</p>
                        <p className="font-medium">{formatDate(bookingData.checkIn)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Check-out</p>
                        <p className="font-medium">{formatDate(bookingData.checkOut)}</p>
                      </div>
                    </div>
                  </>
                )}

                {(bookingData.participants || bookingData.guests || bookingData.partySize) && (
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">
                        {bookingData.assetType === 'restaurant' ? 'Pessoas' : 
                         bookingData.assetType === 'accommodation' ? 'Hóspedes' : 'Participantes'}
                      </p>
                      <p className="font-medium">
                        {bookingData.participants || bookingData.guests || bookingData.partySize}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-2">Informações do Cliente</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Nome:</span> {bookingData.customerInfo.name}</p>
                  <p><span className="text-gray-500">Email:</span> {bookingData.customerInfo.email}</p>
                  <p><span className="text-gray-500">Telefone:</span> {bookingData.customerInfo.phone}</p>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Pago</span>
                  <span className="text-green-600">{formatCurrency(bookingData.totalPrice)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Pagamento processado via Stripe
                </p>
                {bookingData.paymentStatus === 'processing' && (
                  <Badge variant="outline" className="mt-2">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Processando pagamento...
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {bookingData.paymentDetails?.receiptUrl && (
            <Button 
              onClick={handleDownloadReceipt}
              variant="outline" 
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Comprovante
            </Button>
          )}
          
          <Button 
            onClick={handleBackToHome} 
            variant="primary" 
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Button>
        </div>

        {/* Next Steps */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="font-medium text-gray-900 mb-3">Próximos Passos</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Você receberá um email de confirmação em breve</p>
              <p>• O parceiro pode entrar em contato para confirmar detalhes</p>
              <p>• Você pode acompanhar o status na seção "Minhas Reservas"</p>
              <p>• Em caso de dúvidas, entre em contato conosco</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 