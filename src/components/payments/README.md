# Componentes de Pagamento PIX

Componentes React para integração com pagamentos PIX do Mercado Pago, seguindo as melhores práticas e padrões recomendados.

## 📦 Componentes Disponíveis

### 1. `PixPaymentModal`

Modal completo para exibir QR Code e código PIX para pagamento, com verificação automática de status e contador de tempo.

#### Props

```typescript
interface PixPaymentModalProps {
  open: boolean;                                        // Controla abertura do modal
  onOpenChange: (open: boolean) => void;               // Callback para mudança de estado
  pixQrCode: string;                                   // Código PIX (copia e cola)
  pixQrCodeBase64?: string;                            // QR Code em base64 (opcional)
  amount: number;                                      // Valor do pagamento
  expiresIn?: number;                                  // Tempo de expiração em minutos (padrão: 30)
  onPaymentConfirmed?: () => void;                     // Callback quando pagamento confirmado
  paymentId?: string;                                  // ID do pagamento no MP
  checkPaymentStatus?: (id: string) => Promise<boolean>; // Função para verificar status
}
```

#### Recursos

- ✅ **QR Code visual** - Exibe imagem do QR Code se fornecido
- ✅ **Código copiável** - Botão para copiar código PIX com feedback visual
- ✅ **Timer de expiração** - Contador regressivo em tempo real
- ✅ **Verificação automática** - Checa status do pagamento a cada 5 segundos
- ✅ **Confirmação ao fechar** - Avisa usuário se pagamento ainda pendente
- ✅ **Instruções claras** - Guia passo a passo para o usuário
- ✅ **Design responsivo** - Funciona em desktop e mobile

#### Exemplo de Uso

```tsx
import { PixPaymentModal } from '@/components/payments';

function MeuComponente() {
  const [showPix, setShowPix] = useState(false);

  // Criar pagamento no Mercado Pago
  const handlePayWithPix = async () => {
    const payment = await criarPagamentoPix({
      amount: 150.00,
      email: 'cliente@email.com'
    });

    setPixData({
      qrCode: payment.qr_code,
      qrCodeBase64: payment.qr_code_base64,
      paymentId: payment.id
    });

    setShowPix(true);
  };

  // Verificar status do pagamento
  const checkStatus = async (paymentId: string) => {
    const status = await api.getPaymentStatus(paymentId);
    return status === 'approved';
  };

  return (
    <>
      <Button onClick={handlePayWithPix}>
        Pagar com PIX
      </Button>

      <PixPaymentModal
        open={showPix}
        onOpenChange={setShowPix}
        pixQrCode={pixData.qrCode}
        pixQrCodeBase64={pixData.qrCodeBase64}
        amount={150.00}
        expiresIn={30}
        paymentId={pixData.paymentId}
        checkPaymentStatus={checkStatus}
        onPaymentConfirmed={() => {
          router.push('/pagamento/sucesso');
        }}
      />
    </>
  );
}
```

### 2. `PixPaymentDisplay`

Componente de display puro para mostrar informações do PIX (usado internamente pelo modal).

## 🔄 Fluxo de Integração Completo

### 1. Criar Pagamento PIX

```typescript
// Action do Convex ou API Route
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const payment = new Payment(client);

const response = await payment.create({
  body: {
    transaction_amount: 150.00,
    payment_method_id: 'pix',
    payer: {
      email: 'cliente@email.com'
    }
  }
});

// Retornar dados necessários
return {
  id: response.id,
  qr_code: response.point_of_interaction.transaction_data.qr_code,
  qr_code_base64: response.point_of_interaction.transaction_data.qr_code_base64,
  status: response.status
};
```

### 2. Configurar Webhook

Configure o webhook do Mercado Pago para receber notificações automáticas:

```typescript
// /app/api/webhooks/mercadopago/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  if (body.type === 'payment') {
    const paymentId = body.data.id;
    
    // Buscar detalhes do pagamento
    const payment = await mercadopago.payment.get(paymentId);
    
    if (payment.status === 'approved') {
      // Atualizar status no banco de dados
      await updatePaymentStatus(paymentId, 'approved');
      
      // Enviar notificação ao cliente
      await sendPaymentConfirmation(payment);
    }
  }
  
  return NextResponse.json({ ok: true });
}
```

### 3. Verificar Status (Polling)

```typescript
// Query do Convex
export const getPaymentStatus = query({
  args: { paymentId: v.string() },
  handler: async (ctx, { paymentId }) => {
    const payment = await ctx.db
      .query("payments")
      .filter((q) => q.eq(q.field("mpPaymentId"), paymentId))
      .first();
    
    return payment?.status === 'approved';
  }
});

// No componente React
const checkPaymentStatus = async (paymentId: string) => {
  const isApproved = await convex.query(api.payments.getPaymentStatus, {
    paymentId
  });
  return isApproved;
};
```

## 🎨 Personalização

### Cores e Estilos

O modal usa Tailwind CSS e componentes shadcn/ui. Você pode personalizar:

```tsx
// Exemplo: Alterar cor do timer
<div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
  {/* Timer customizado */}
</div>
```

### Tempo de Expiração

```tsx
<PixPaymentModal
  expiresIn={15}  // 15 minutos em vez de 30
  // ...outros props
/>
```

### Intervalo de Verificação

Modifique o intervalo no código do modal (padrão: 5 segundos):

```typescript
// Dentro de PixPaymentModal.tsx
const checkInterval = setInterval(async () => {
  // verificação
}, 3000); // 3 segundos
```

## 📱 Responsividade

O modal é totalmente responsivo:

- **Desktop**: Largura máxima de 3xl (768px)
- **Mobile**: Largura completa com padding adaptativo
- **QR Code**: Ajusta tamanho automaticamente
- **Scroll**: Habilitado quando conteúdo excede altura da viewport

## 🔒 Segurança

### Boas Práticas Implementadas

1. ✅ **Validação de expiração** - Desabilita código após tempo limite
2. ✅ **Confirmação ao fechar** - Previne fechamento acidental
3. ✅ **Verificação periódica** - Polling seguro com intervalo adequado
4. ✅ **Limpeza de recursos** - useEffect com cleanup correto
5. ✅ **Tratamento de erros** - Try/catch em operações assíncronas

### Recomendações

- **Webhook**: Configure webhook do MP para notificações em tempo real
- **Idempotência**: Use `X-Idempotency-Key` ao criar pagamentos
- **Logs**: Registre todas as transações para auditoria
- **Timeout**: Configure timeout adequado nas requisições

## 🧪 Testando

### Ambiente de Testes

Use as credenciais de teste do Mercado Pago:

```bash
# .env.local
MP_ACCESS_TOKEN=TEST-1234567890-123456-abcdef1234567890-123456789
```

### QR Code de Teste

Para testes, o Mercado Pago retorna QR Codes válidos que podem ser pagos na sandbox.

### Verificação Manual

```typescript
// Simular pagamento aprovado manualmente
const checkPaymentStatus = async (paymentId: string) => {
  // Retorna true após 30 segundos para simular pagamento
  await new Promise(resolve => setTimeout(resolve, 30000));
  return true;
};
```

## 📖 Referências

- [Documentação Mercado Pago - PIX](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-configuration/pix)
- [SDK Node.js](https://github.com/mercadopago/sdk-nodejs)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)

## 🆘 Troubleshooting

### Modal não abre

Verifique se o estado `open` está sendo atualizado corretamente.

### QR Code não aparece

Certifique-se de que `pixQrCodeBase64` está no formato correto (sem prefixo `data:image`).

### Verificação não funciona

1. Verifique se `paymentId` está sendo passado
2. Confirme que `checkPaymentStatus` retorna boolean
3. Verifique logs do console para erros

### Código não copia

O navegador pode bloquear `navigator.clipboard`. Use HTTPS em produção.

## 💡 Dicas

1. **Sempre use HTTPS** em produção para clipboard API
2. **Configure webhook** para confirmação em tempo real
3. **Monitore expiração** e notifique usuário
4. **Log tudo** para debugging e auditoria
5. **Teste fluxo completo** incluindo timeout e erros

## 📝 Changelog

### v1.0.0 (2025-01-07)
- ✨ Criação inicial do modal PIX
- ✨ Timer de expiração
- ✨ Verificação automática de status
- ✨ Suporte a QR Code base64
- ✨ Botão de copiar código
- ✨ Instruções de uso
- ✨ Design responsivo
