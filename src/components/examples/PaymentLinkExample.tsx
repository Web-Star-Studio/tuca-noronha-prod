'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PaymentLinkCheckout from '@/components/payments/PaymentLinkCheckout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Calendar, Users, MapPin } from 'lucide-react';

/**
 * Exemplo de como implementar o fluxo completo de Payment Links
 * 
 * Fluxo:
 * 1. Usuário preenche formulário de reserva
 * 2. Sistema cria booking (status: pending, paymentStatus: pending)
 * 3. Modal abre com PaymentLinkCheckout
 * 4. PaymentLinkCheckout cria Payment Link via Convex action
 * 5. Usuário é redirecionado para Stripe
 * 6. Após pagamento, usuário volta para página de sucesso
 * 7. Webhook atualiza status do booking
 */

interface ExampleBookingFormProps {
  assetId: string;
  assetName: string;
  assetType: "activity" | "event" | "restaurant" | "accommodation" | "vehicle";
  basePrice: number;
}

export function PaymentLinkExample({
  assetId,
  assetName,
  assetType,
  basePrice
}: ExampleBookingFormProps) {
  const { user } = useUser();
  const [showPayment, setShowPayment] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: user?.fullName || '',
    customerEmail: user?.primaryEmailAddress?.emailAddress || '',
    customerPhone: '',
    date: '',
    participants: 1,
    specialRequests: '',
  });

  // Mutation to create booking
  const createActivityBooking = useMutation(api.domains.bookings.mutations.createActivityBooking);

  const totalPrice = basePrice * formData.participants;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Você precisa estar logado para fazer uma reserva');
      return;
    }

    if (!formData.customerName || !formData.customerEmail || !formData.date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setIsSubmitting(true);

      // Criar reserva (status: pending, paymentStatus: pending)
      const bookingId = await createActivityBooking({
        activityId: assetId,
        date: formData.date,
        participants: formData.participants,
        totalPrice,
        specialRequests: formData.specialRequests,
        customerInfo: {
          name: formData.customerName,
          email: formData.customerEmail,
          phone: formData.customerPhone,
        },
      });

      // Sucesso - abrir modal de pagamento
      setCurrentBookingId(bookingId);
      setShowPayment(true);
      
      toast.success('Reserva criada! Prossiga para o pagamento.');
    } catch (error: any) {
      console.error('Erro ao criar reserva:', error);
      toast.error(error.message || 'Erro ao criar reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Reset form
    setFormData({
      customerName: user?.fullName || '',
      customerEmail: user?.primaryEmailAddress?.emailAddress || '',
      customerPhone: '',
      date: '',
      participants: 1,
      specialRequests: '',
    });
    setShowPayment(false);
    setCurrentBookingId(null);
    
    toast.success('Você será redirecionado para o pagamento!');
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    // Note: booking permanece com status pending - pode ser pago depois
    toast.info('Reserva salva. Você pode pagar depois se desejar.');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Reservar: {assetName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Nome completo *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="customerEmail">Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customerPhone">Telefone</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.customerPhone}
                onChange={(e) => handleInputChange('customerPhone', e.target.value)}
              />
            </div>

            {/* Booking Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Data da atividade *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="participants">Participantes</Label>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <Input
                    id="participants"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.participants}
                    onChange={(e) => handleInputChange('participants', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="specialRequests">Solicitações especiais</Label>
              <Input
                id="specialRequests"
                placeholder="Alguma necessidade especial?"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              />
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span>Preço por pessoa:</span>
                <span>{formatCurrency(basePrice)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>Participantes:</span>
                <span>{formData.participants}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting || !user}
              className="w-full h-12 text-lg font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Criando reserva...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-5 w-5" />
                  Criar Reserva e Pagar
                </>
              )}
            </Button>

            {!user && (
              <p className="text-center text-sm text-red-600">
                Você precisa estar logado para fazer uma reserva
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar Pagamento</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900">{assetName}</h3>
              <p className="text-blue-700 text-sm">{formData.participants} participante(s)</p>
              <p className="text-blue-700 text-sm">Data: {formData.date}</p>
            </div>

            {currentBookingId && (
              <PaymentLinkCheckout
                bookingId={currentBookingId as any}
                assetType={assetType}
                assetId={assetId}
                totalAmount={totalPrice}
                onSuccess={handlePaymentSuccess}
                onCancel={handlePaymentCancel}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Exemplo de como usar o componente:
export function ExampleUsage() {
  return (
    <PaymentLinkExample
      assetId="k572k2fn6jdahqt3xqp6hkzhxh7012m0"
      assetName="Passeio de Barco em Fernando de Noronha"
      assetType="activity"
      basePrice={150.00}
    />
  );
} 