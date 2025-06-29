'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RotateCcw, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingCancelPage() {
  const router = useRouter();

  useEffect(() => {
    toast.error('Pagamento cancelado', {
      description: 'O pagamento foi cancelado. Sua reserva não foi processada.',
      duration: 5000,
    });
  }, []);

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleTryAgain = () => {
    // Go back to the previous page where the booking form was
    router.back();
  };

  const handleContactSupport = () => {
    router.push('/ajuda');
  };

  const handleViewBookings = () => {
    router.push('/meu-painel/reservas');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Cancel Header */}
        <div className="text-center mb-8">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pagamento Cancelado
          </h1>
          <p className="text-gray-600">
            O processo de pagamento foi interrompido
          </p>
        </div>

        {/* Main Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-red-600">O que aconteceu?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                Seu pagamento foi cancelado e sua reserva não foi processada. 
                Isso pode ter acontecido por alguns motivos:
              </p>
              
              <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                <li>Você cancelou o pagamento manualmente</li>
                <li>Houve um problema com seu método de pagamento</li>
                <li>A sessão de pagamento expirou</li>
                <li>Problema temporário de conexão</li>
              </ul>

              <div className="bg-blue-50 p-4 rounded-lg mt-4">
                <h3 className="font-medium text-blue-900 mb-2">Não se preocupe!</h3>
                <p className="text-blue-700 text-sm">
                  Nenhuma cobrança foi realizada em seu cartão. Você pode tentar novamente 
                  a qualquer momento ou entrar em contato conosco se precisar de ajuda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleTryAgain}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
          
          <Button 
            onClick={handleViewBookings}
            variant="outline" 
            className="w-full"
          >
            Ver Minhas Reservas
          </Button>
          
          <Button 
            onClick={handleContactSupport}
            variant="outline" 
            className="w-full"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Entrar em Contato
          </Button>
          
          <Button 
            onClick={handleBackToHome} 
            variant="outline" 
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Início
          </Button>
        </div>

        {/* Help Section */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="font-medium text-gray-900 mb-3">Precisa de Ajuda?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Verifique se seu cartão está desbloqueado para compras online</p>
              <p>• Certifique-se de que há limite disponível no cartão</p>
              <p>• Tente usar outro método de pagamento</p>
              <p>• Entre em contato conosco se o problema persistir</p>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Options */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h3 className="font-medium text-gray-900 mb-3">Outras Opções</h3>
            <div className="space-y-3">
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-gray-800">Pagamento via PIX</h4>
                <p className="text-sm text-gray-600">
                  Entre em contato conosco para receber os dados PIX
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-gray-800">Transferência Bancária</h4>
                <p className="text-sm text-gray-600">
                  Solicite os dados bancários através do suporte
                </p>
              </div>
              
              <div className="p-3 border rounded-lg">
                <h4 className="font-medium text-gray-800">Pagamento Presencial</h4>
                <p className="text-sm text-gray-600">
                  Algumas reservas podem aceitar pagamento no local
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 