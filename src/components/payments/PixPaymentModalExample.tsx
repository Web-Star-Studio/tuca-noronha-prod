"use client";

/**
 * Exemplo de uso do PixPaymentModal
 * 
 * Este componente demonstra como integrar o modal de pagamento PIX
 * em sua aplicação, seguindo as melhores práticas do Mercado Pago.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PixPaymentModal } from "./PixPaymentModal";

export function PixPaymentModalExample() {
  const [showPixModal, setShowPixModal] = useState(false);
  
  // Dados simulados do PIX (viriam da API do Mercado Pago)
  const pixData = {
    qrCode: "00020126580014br.gov.bcb.pix0136a629532e-7693-4846-852d-1bbff6b2f8cd520400005303986540510.005802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D",
    qrCodeBase64: "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAACAASURBVHic7N15vF1Fof/xz5l", // Base64 truncado para exemplo
    amount: 150.00,
    paymentId: "123456789",
  };

  // Função para verificar status do pagamento (integrar com sua API)
  const checkPaymentStatus = async (paymentId: string): Promise<boolean> => {
    try {
      // Aqui você faria uma chamada real para sua API/Convex
      // const response = await fetch(`/api/payments/${paymentId}/status`);
      // const data = await response.json();
      // return data.status === 'approved';
      
      console.log("Verificando status do pagamento:", paymentId);
      
      // Simulação - retorna false (não pago ainda)
      return false;
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error);
      return false;
    }
  };

  // Callback quando pagamento é confirmado
  const handlePaymentConfirmed = () => {
    console.log("✅ Pagamento confirmado!");
    setShowPixModal(false);
    
    // Aqui você pode:
    // - Redirecionar para página de sucesso
    // - Atualizar estado da reserva
    // - Mostrar mensagem de sucesso
    // - Enviar confirmação por email, etc.
    
    alert("Pagamento confirmado com sucesso! 🎉");
  };

  return (
    <div className="p-8 space-y-4">
      <h2 className="text-2xl font-bold">Exemplo de Pagamento PIX</h2>
      
      <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Detalhes da Compra</h3>
          <p className="text-gray-600">Pacote Turístico - Fernando de Noronha</p>
          <p className="text-2xl font-bold text-green-600 mt-2">
            R$ {pixData.amount.toFixed(2)}
          </p>
        </div>

        <Button 
          onClick={() => setShowPixModal(true)}
          className="w-full bg-green-500 hover:bg-green-600"
          size="lg"
        >
          Pagar com PIX
        </Button>
      </div>

      {/* Modal de Pagamento PIX */}
      <PixPaymentModal
        open={showPixModal}
        onOpenChange={setShowPixModal}
        pixQrCode={pixData.qrCode}
        pixQrCodeBase64={pixData.qrCodeBase64}
        amount={pixData.amount}
        expiresIn={30} // 30 minutos
        paymentId={pixData.paymentId}
        checkPaymentStatus={checkPaymentStatus}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      {/* Instruções de Integração */}
      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3">
          📚 Como integrar na sua aplicação:
        </h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>1. Crie o pagamento PIX no Mercado Pago:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto text-xs">
{`const payment = await mercadopago.payment.create({
  transaction_amount: 150.00,
  payment_method_id: 'pix',
  payer: { email: 'cliente@email.com' }
});`}
            </pre>
          </li>
          
          <li className="mt-3">
            <strong>2. Extraia os dados do PIX da resposta:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto text-xs">
{`const pixData = {
  qrCode: payment.point_of_interaction.transaction_data.qr_code,
  qrCodeBase64: payment.point_of_interaction.transaction_data.qr_code_base64,
  paymentId: payment.id
};`}
            </pre>
          </li>
          
          <li className="mt-3">
            <strong>3. Abra o modal com os dados:</strong>
            <pre className="bg-white p-2 rounded mt-1 overflow-x-auto text-xs">
{`<PixPaymentModal
  open={showModal}
  onOpenChange={setShowModal}
  pixQrCode={pixData.qrCode}
  pixQrCodeBase64={pixData.qrCodeBase64}
  amount={150.00}
  paymentId={pixData.paymentId}
  checkPaymentStatus={checkPaymentStatus}
  onPaymentConfirmed={handleSuccess}
/>`}
            </pre>
          </li>

          <li className="mt-3">
            <strong>4. Configure o webhook do Mercado Pago</strong> para receber notificações automáticas de pagamento confirmado.
          </li>
        </ol>
      </div>
    </div>
  );
}
