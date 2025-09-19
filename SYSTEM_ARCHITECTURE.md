# 🏗️ Arquitetura Completa do Sistema - Tuca Noronha

## 📊 Diagrama de Arquitetura

```mermaid
graph TB
    %% Definindo estilos
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef auth fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef payment fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef database fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef external fill:#f5f5f5,stroke:#424242,stroke-width:2px

    %% Frontend Layer
    subgraph "Frontend (Next.js)"
        UI[🖥️ Interface do Usuário]
        Pages[📄 Páginas]
        Hooks[🔗 React Hooks]
        PaymentSDK[💳 Payment Client SDK]
    end

    %% Authentication Layer
    subgraph "Autenticação (Clerk)"
        ClerkAuth[🔐 Clerk Auth]
        ClerkWebhook[🔔 Clerk Webhooks]
        UserMgmt[👥 Gestão de Usuários]
    end

    %% Backend Layer
    subgraph "Backend (Convex)"
        ConvexAPI[⚡ Convex API]
        Actions[🎯 Actions]
        Mutations[✏️ Mutations]
        Queries[🔍 Queries]
        ConvexDB[(🗄️ Database)]
    end

    %% Payment Service Layer
    subgraph "Payment Service (Express)"
        PaymentAPI[💰 Payment API]
        MPService[🏦 MercadoPago Service]
        WebhookHandler[🔔 Webhook Handler]
        Logger[📝 Logger]
    end

    %% External Services
    subgraph "Serviços Externos"
        MercadoPago[🏪 Mercado Pago API]
        EmailService[📧 Email Service]
        Storage[☁️ Storage (Convex)]
    end

    %% Conexões principais
    UI --> Pages
    Pages --> Hooks
    Hooks --> ConvexAPI
    Hooks --> PaymentSDK
    PaymentSDK --> PaymentAPI

    %% Fluxo de autenticação
    UI --> ClerkAuth
    ClerkAuth --> UserMgmt
    ClerkAuth --> ConvexAPI
    ClerkWebhook --> ConvexAPI

    %% Fluxo de dados Convex
    ConvexAPI --> Actions
    ConvexAPI --> Mutations
    ConvexAPI --> Queries
    Actions --> ConvexDB
    Mutations --> ConvexDB
    Queries --> ConvexDB

    %% Fluxo de pagamento
    PaymentAPI --> MPService
    MPService --> MercadoPago
    MercadoPago --> WebhookHandler
    WebhookHandler --> ConvexAPI
    WebhookHandler --> Logger

    %% Outros serviços
    ConvexAPI --> EmailService
    ConvexAPI --> Storage
    Actions --> PaymentAPI

    %% Aplicando estilos
    class UI,Pages,Hooks,PaymentSDK frontend
    class ClerkAuth,ClerkWebhook,UserMgmt auth
    class ConvexAPI,Actions,Mutations,Queries,ConvexDB backend
    class PaymentAPI,MPService,WebhookHandler,Logger payment
    class MercadoPago,EmailService,Storage external
```

## 🔄 Fluxo de Reserva e Pagamento Detalhado

```mermaid
sequenceDiagram
    participant U as 👤 Usuário
    participant F as 🖥️ Frontend (Next.js)
    participant C as 🔐 Clerk
    participant CV as ⚡ Convex
    participant PS as 💰 Payment Service
    participant MP as 🏪 Mercado Pago
    participant A as 👨‍💼 Admin

    %% 1. Autenticação
    U->>F: Acessa o site
    F->>C: Verifica autenticação
    C-->>F: Token JWT
    F-->>U: Página autenticada

    %% 2. Criar Reserva
    U->>F: Seleciona atividade/evento
    U->>F: Preenche dados da reserva
    F->>CV: createBooking()
    CV->>CV: Salva reserva no DB
    CV-->>F: bookingId + confirmationCode
    
    %% 3. Iniciar Pagamento
    F->>PS: createPreference(bookingData)
    PS->>MP: Cria preferência de pagamento
    MP-->>PS: preferenceId + checkoutURL
    PS-->>F: URL do checkout
    F->>U: Redireciona para MP

    %% 4. Processo de Pagamento
    U->>MP: Insere dados do cartão
    MP->>MP: Autoriza pagamento (não captura)
    MP-->>U: Pagamento autorizado
    MP->>PS: Webhook: payment.authorized
    PS->>CV: updateBookingStatus('authorized')
    CV->>CV: Atualiza status no DB

    %% 5. Confirmação Admin
    A->>F: Acessa painel admin
    F->>CV: getBookings()
    CV-->>F: Lista de reservas
    A->>F: Confirma reserva
    F->>CV: approveBooking()
    CV->>PS: capturePayment(paymentId)
    PS->>MP: Captura pagamento autorizado
    MP-->>PS: Pagamento capturado
    PS-->>CV: Status: captured

    %% 6. Finalização
    CV->>CV: Gera voucher
    CV->>CV: Atualiza status: confirmed
    CV->>U: Email com voucher
    CV-->>F: Confirmação completa
    F-->>A: ✅ Reserva confirmada
```

## 🗂️ Estrutura de Dados

```mermaid
erDiagram
    USER ||--o{ BOOKING : creates
    USER ||--o{ ORGANIZATION : owns
    ORGANIZATION ||--o{ ACTIVITY : has
    ORGANIZATION ||--o{ EVENT : has
    ORGANIZATION ||--o{ RESTAURANT : has
    ORGANIZATION ||--o{ VEHICLE : has
    BOOKING ||--|| PAYMENT : has
    BOOKING ||--o| VOUCHER : generates
    PAYMENT ||--|| MERCADOPAGO : processes
    ADMIN ||--o{ BOOKING : manages

    USER {
        string id PK
        string clerkId
        string email
        string name
        string role
        timestamp createdAt
    }

    BOOKING {
        string id PK
        string userId FK
        string assetId FK
        string assetType
        string status
        number totalPrice
        string confirmationCode
        timestamp date
        json customerInfo
    }

    PAYMENT {
        string id PK
        string bookingId FK
        string mpPaymentId
        string mpPreferenceId
        string status
        number amount
        boolean captured
        timestamp createdAt
    }

    VOUCHER {
        string id PK
        string bookingId FK
        string voucherNumber
        string qrCode
        string verificationToken
        timestamp expiresAt
        boolean used
    }

    ORGANIZATION {
        string id PK
        string ownerId FK
        string name
        string type
        boolean active
    }

    ACTIVITY {
        string id PK
        string organizationId FK
        string title
        number price
        string description
        array images
    }
```

## 🔌 Integrações e APIs

```mermaid
graph LR
    subgraph "APIs Internas"
        NextAPI[Next.js API Routes]
        ConvexHTTP[Convex HTTP API]
        PaymentREST[Payment Service REST]
    end

    subgraph "APIs Externas"
        ClerkAPI[Clerk API]
        MercadoPagoAPI[Mercado Pago API]
        EmailAPI[Email Service API]
    end

    subgraph "Webhooks"
        ClerkWH[Clerk Webhooks]
        MercadoPagoWH[MP Webhooks]
    end

    subgraph "Autenticação"
        JWT[JWT Tokens]
        APIKeys[API Keys]
        WebhookSecrets[Webhook Secrets]
    end

    NextAPI --> ConvexHTTP
    NextAPI --> PaymentREST
    PaymentREST --> MercadoPagoAPI
    ConvexHTTP --> EmailAPI
    ClerkWH --> ConvexHTTP
    MercadoPagoWH --> PaymentREST
    
    JWT --> NextAPI
    JWT --> ConvexHTTP
    APIKeys --> PaymentREST
    WebhookSecrets --> ClerkWH
    WebhookSecrets --> MercadoPagoWH
```

## 🚀 Fluxo de Deploy

```mermaid
graph TD
    subgraph "Development"
        LocalNext[Next.js localhost:3000]
        LocalPayment[Payment Service :3001]
        ConvexDev[Convex Dev]
    end

    subgraph "Production"
        Vercel[Vercel - Frontend]
        Railway[Railway - Payment Service]
        ConvexProd[Convex Production]
        Cloudflare[Cloudflare DNS]
    end

    subgraph "CI/CD"
        GitHub[GitHub Repository]
        Actions[GitHub Actions]
    end

    LocalNext --> GitHub
    LocalPayment --> GitHub
    GitHub --> Actions
    Actions --> Vercel
    Actions --> Railway
    Actions --> ConvexProd
    Cloudflare --> Vercel
    Cloudflare --> Railway
```

## 📋 Componentes e Responsabilidades

### **Frontend (Next.js)**
- Interface do usuário
- Renderização SSR/SSG
- Roteamento
- Estado local
- Cache de dados

### **Clerk (Autenticação)**
- Login/Cadastro
- Gestão de sessões
- JWT tokens
- Webhooks de usuários
- Proteção de rotas

### **Convex (Backend)**
- Database realtime
- Business logic
- File storage
- Background jobs
- Email triggers

### **Payment Service (Express)**
- Integração Mercado Pago
- Processamento de pagamentos
- Captura manual
- Webhooks de pagamento
- Logs de transações

### **Mercado Pago**
- Checkout Pro
- Autorização de cartões
- Captura de pagamentos
- Estornos/Cancelamentos
- Notificações IPN/Webhooks

## 🔐 Segurança

```mermaid
graph TB
    subgraph "Camadas de Segurança"
        Auth[🔐 Autenticação<br/>Clerk JWT]
        RBAC[👮 Autorização<br/>Role-Based Access]
        APIKey[🔑 API Keys<br/>Payment Service]
        Webhook[🔏 Webhook Secrets<br/>Signature Verification]
        SSL[🔒 SSL/TLS<br/>HTTPS Everywhere]
        ENV[🔧 Environment Variables<br/>Secrets Management]
    end

    Auth --> RBAC
    RBAC --> APIKey
    APIKey --> Webhook
    Webhook --> SSL
    SSL --> ENV
```

## 📊 Métricas e Monitoramento

- **Sentry**: Error tracking
- **Vercel Analytics**: Frontend metrics
- **Railway Metrics**: Payment Service health
- **Convex Dashboard**: Database monitoring
- **Mercado Pago Dashboard**: Payment analytics

## 🔄 Estados do Sistema

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> BookingCreated: User creates booking
    BookingCreated --> PaymentPending: Redirect to MP
    PaymentPending --> PaymentAuthorized: Card authorized
    PaymentPending --> PaymentFailed: Payment failed
    PaymentAuthorized --> AdminReview: Awaiting approval
    AdminReview --> PaymentCaptured: Admin approves
    AdminReview --> PaymentCancelled: Admin rejects
    PaymentCaptured --> VoucherGenerated: Generate voucher
    VoucherGenerated --> BookingCompleted: Send email
    BookingCompleted --> [*]
    PaymentFailed --> [*]
    PaymentCancelled --> [*]
```

---

**Sistema Integrado v1.0** - Arquitetura completa com Payment Service
