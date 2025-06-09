# 💬 Sistema de Chat em Tempo Real - Tuca Noronha

## 📋 **Visão Geral**

O sistema de chat implementado permite comunicação em tempo real entre **viajantes (travelers)** e **parceiros/funcionários (partners/employees)** baseado em assets e reservas específicas. 

### **Principais Características**

- ✅ **Chat contextual** baseado em assets (restaurantes, eventos, atividades, veículos, hospedagens)
- ✅ **Chat para reservas** para discussões específicas sobre bookings
- ✅ **Tempo real** usando Convex subscriptions 
- ✅ **RBAC integrado** respeitando permissões de acesso
- ✅ **Interface moderna** com componentes reutilizáveis
- ✅ **Mensagens não lidas** com contador e marcação automática
- ✅ **Status de conversa** (ativa, fechada, arquivada)
- ✅ **Histórico persistente** armazenado no Firestore-like database

---

## 🏗️ **Arquitetura do Sistema**

### **Backend (Convex)**

#### **Schema de Dados**
```typescript
// Salas de Chat
chatRooms: {
  contextType: "asset" | "booking",
  contextId: string,
  assetType?: string,
  travelerId: Id<"users">,
  partnerId: Id<"users">,
  status: "active" | "closed" | "archived",
  title: string,
  lastMessageAt?: number,
  lastMessagePreview?: string,
  // timestamps...
}

// Mensagens
chatMessages: {
  chatRoomId: Id<"chatRooms">,
  senderId: Id<"users">,
  senderRole: "traveler" | "partner" | "employee" | "master",
  content: string,
  messageType: "text" | "image" | "file" | "system",
  isRead: boolean,
  // timestamps...
}
```

#### **Funcionalidades Backend**
- **Queries**: `listChatRooms`, `getChatRoom`, `listChatMessages`, `findOrCreateChatRoom`
- **Mutations**: `createChatRoom`, `sendMessage`, `markMessagesAsRead`, `updateChatRoomStatus`
- **RBAC**: Verificação automática de permissões baseada em roles e organizações

### **Frontend (React/Next.js)**

#### **Componentes Principais**
1. **`ChatButton`** - Botão para iniciar conversas em assets e reservas
2. **`ChatWindow`** - Interface completa de chat com mensagens e input
3. **`ChatList`** - Lista de conversas para dashboard administrativo

#### **Serviços**
- **`chatService`** - Hooks e utilitários para gerenciar chat
- **Integração Convex** - Queries e mutations reativas

---

## 🚀 **Como Usar**

### **1. Para Viajantes (Travelers)**

#### **Iniciar Chat em Asset**
```jsx
<ChatButton
  assetId="restaurant_123"
  assetType="restaurants"
  assetName="Restaurante Exemplo"
  partnerId={partnerId}
  variant="default"
  size="md"
/>
```

#### **Chat sobre Reserva**
```jsx
<ChatButton
  assetId="restaurant_123"
  assetType="restaurants"
  assetName="Restaurante Exemplo" 
  partnerId={partnerId}
  bookingId="booking_456"
  bookingContext="Reserva #ABC123"
  variant="outline"
  size="sm"
/>
```

#### **Botão Flutuante**
```jsx
<ChatButton
  assetId={event._id}
  assetType="events"
  assetName={event.title}
  partnerId={event.partnerId}
  variant="floating"
  size="lg"
  showLabel={false}
/>
```

### **2. Para Partners/Employees**

#### **Dashboard com Lista de Conversas**
```jsx
import { ChatList } from "@/components/chat/ChatList";

// No dashboard administrativo
<ChatList className="col-span-1" />
```

#### **Gerenciar Status de Conversas**
- ✅ **Ativar** conversas pausadas
- 🔒 **Fechar** conversas finalizadas  
- 📁 **Arquivar** conversas antigas

---

## 📱 **Fluxo de Uso**

### **Cenário 1: Traveler quer tirar dúvidas sobre restaurante**

1. **Traveler** acessa página do restaurante
2. **Clica** no botão "Tirar Dúvidas" 
3. **Digita** mensagem inicial (opcional)
4. **Sistema** cria sala de chat automaticamente
5. **Partner** recebe notificação no dashboard
6. **Conversação** ocorre em tempo real
7. **Histórico** fica salvo para consultas futuras

### **Cenário 2: Traveler quer falar sobre uma reserva**

1. **Traveler** vê suas reservas  
2. **Clica** no ícone de chat na reserva
3. **Sistema** identifica contexto da reserva
4. **Chat** é contextualizado com informações do booking
5. **Partner** pode ver detalhes da reserva no chat
6. **Resolução** de dúvidas específicas da reserva

### **Cenário 3: Partner gerencia conversas**

1. **Partner** acessa dashboard administrativo
2. **Visualiza** lista de conversas ativas
3. **Filtra** por status (ativas, fechadas, arquivadas)
4. **Busca** por nome do cliente ou asset
5. **Responde** mensagens em tempo real
6. **Gerencia** status das conversas

---

## 🔧 **Configurações Implementadas**

### **Integrações Feitas**

✅ **Página de Restaurante** (`/restaurantes/[slug]`)
- Botão de chat no sidebar

✅ **Dashboard Admin** (`/admin/dashboard`)  
- Lista de conversas integrada

✅ **Gestão de Reservas** (`BookingManagement`)
- Botões de chat em cada reserva

✅ **Página de Evento** (`/eventos/[id]`)
- Botão de chat flutuante

### **Ainda Podem ser Adicionados**

- 🔲 Páginas de atividades
- 🔲 Páginas de veículos  
- 🔲 Páginas de hospedagens
- 🔲 Notificações push
- 🔲 Anexos de arquivos/imagens
- 🔲 Chat de grupo (múltiplos participants)

---

## 🎯 **Benefícios Implementados**

### **Para o Negócio**
- 📈 **Maior conversão** - comunicação direta facilita vendas
- 🤝 **Melhor atendimento** - suporte contextualizado  
- 📊 **Insights valiosos** - histórico de dúvidas dos clientes
- ⚡ **Resposta rápida** - tempo real melhora satisfação

### **Para Viajantes**  
- 💬 **Comunicação fácil** - um clique para tirar dúvidas
- 🎯 **Contexto preservado** - chat ligado ao asset/reserva específico
- 📱 **Interface familiar** - design similar a apps de mensagem
- 📋 **Histórico acessível** - consultar conversas anteriores

### **Para Partners/Employees**
- 📊 **Dashboard centralizado** - todas as conversas em um lugar
- 🔍 **Busca eficiente** - filtros por status e conteúdo  
- 👥 **Identificação clara** - dados do cliente e contexto visíveis
- ⚙️ **Gestão profissional** - controle de status das conversas

---

## 🛠️ **Tecnologias Utilizadas**

- **Backend**: Convex (queries, mutations, subscriptions)
- **Frontend**: React, Next.js, TypeScript
- **UI**: Tailwind CSS, Shadcn/ui components  
- **Estado**: Convex real-time subscriptions
- **Autenticação**: Clerk integration
- **Permissões**: Sistema RBAC customizado

---

## 🔐 **Segurança e Permissões**

### **Controle de Acesso**
- ✅ **Apenas travelers** podem iniciar conversas
- ✅ **Partners/employees** têm acesso baseado em organizações
- ✅ **Verificação de RBAC** em todas as operações
- ✅ **Isolamento de dados** por participantes da conversa

### **Validações**
- ✅ **Autenticação obrigatória** para todas as operações
- ✅ **Verificação de ownership** de assets e reservas
- ✅ **Sanitização** de inputs de mensagens
- ✅ **Rate limiting** implícito via Convex

---

## 📚 **Exemplos de Código**

### **Hook para Listar Conversas**
```typescript
import { useChatRooms } from "@/lib/services/chatService";

function MyChats() {
  const chatRooms = useChatRooms("active");
  
  return (
    <div>
      {chatRooms?.map(room => (
        <div key={room._id}>
          {room.title} - {room.unreadCount} não lidas
        </div>
      ))}
    </div>
  );
}
```

### **Enviar Mensagem**
```typescript
import { useSendMessage } from "@/lib/services/chatService";

function ChatInput({ chatRoomId }: { chatRoomId: string }) {
  const sendMessage = useSendMessage();
  
  const handleSend = async (content: string) => {
    await sendMessage({
      chatRoomId,
      content,
      messageType: "text"
    });
  };
}
```

### **Verificar Chat Existente**
```typescript
import { useFindOrCreateChatRoom } from "@/lib/services/chatService";

function AssetPage({ asset }: { asset: Asset }) {
  const existingChat = useFindOrCreateChatRoom(
    "asset",
    asset._id,
    asset.partnerId,
    asset.type
  );
  
  return (
    <ChatButton
      // ... props
      // Se existingChat._id, abre conversa existente
      // Senão, mostra diálogo para nova conversa
    />
  );
}
```

---

## 📈 **Próximos Passos Recomendados**

### **Melhorias de Curto Prazo** 
1. 🔔 **Notificações em tempo real** (browser notifications)
2. 📎 **Upload de arquivos** e imagens no chat
3. 📱 **Responsividade móvel** melhorada
4. 🔍 **Busca dentro das mensagens**

### **Funcionalidades Avançadas**
1. 🤖 **Chatbot com IA** para respostas automáticas iniciais
2. 📊 **Analytics de conversas** e métricas de atendimento  
3. 👥 **Chat em grupo** para events com múltiplos participantes
4. 🌐 **Multi-idioma** para turistas internacionais

### **Integrações Externas**
1. 📧 **Email notifications** quando offline
2. 📱 **WhatsApp Business** integration 
3. 📞 **Video call** integration (Meet, Zoom)
4. 📋 **CRM integration** para histórico de clientes

---

**Sistema implementado com sucesso! 🎉**

O chat em tempo real está funcional e pode ser expandido conforme as necessidades do negócio evoluem. 