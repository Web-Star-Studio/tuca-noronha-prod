import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { cachedRecommendationsTable } from "./domains/recommendations/schema";
import { guideSubscriptions, subscriptionPayments } from "./domains/subscriptions/schema";

// Partner schemas
const partners = defineTable({
  userId: v.id("users"),
  stripeAccountId: v.string(),
  onboardingStatus: v.union(
    v.literal("pending"),
    v.literal("in_progress"),
    v.literal("completed"),
    v.literal("rejected")
  ),
  feePercentage: v.number(), // 0-100
  isActive: v.boolean(),
  capabilities: v.object({
    cardPayments: v.boolean(),
    transfers: v.boolean(),
  }),
  metadata: v.object({
    businessName: v.optional(v.string()),
    businessType: v.optional(v.string()),
    country: v.string(),
  }),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_userId", ["userId"])
  .index("by_stripeAccountId", ["stripeAccountId"])
  .index("by_status", ["onboardingStatus"]);

const partnerFees = defineTable({
  partnerId: v.id("partners"),
  feePercentage: v.number(),
  effectiveDate: v.number(),
  createdBy: v.id("users"),
  reason: v.optional(v.string()),
  previousFee: v.optional(v.number()),
})
  .index("by_partnerId", ["partnerId"])
  .index("by_effectiveDate", ["effectiveDate"]);

const partnerTransactions = defineTable({
  partnerId: v.id("partners"),
  bookingId: v.string(), // ID genérico da reserva
  bookingType: v.union(
    v.literal("activity"),
    v.literal("event"),
    v.literal("vehicle"),

    v.literal("package")
  ),
  stripePaymentIntentId: v.string(),
  stripeTransferId: v.optional(v.string()),
  amount: v.number(), // em centavos
  platformFee: v.number(), // em centavos
  partnerAmount: v.number(), // em centavos
  currency: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("completed"),
    v.literal("failed"),
    v.literal("refunded")
  ),
  metadata: v.any(),
  createdAt: v.number(),
})
  .index("by_partnerId", ["partnerId"])
  .index("by_bookingId", ["bookingId"])
  .index("by_stripePaymentIntentId", ["stripePaymentIntentId"])
  .index("by_status_and_createdAt", ["status", "createdAt"]);

export const contactMessages = defineTable({
  name: v.string(),
  email: v.string(),
  subject: v.string(),
  message: v.string(),
  status: v.union(
    v.literal("new"),
    v.literal("read"),
    v.literal("archived")
  ),
}).index("by_status", ["status"]);

export default defineSchema({
  authAccounts: defineTable({
    emailVerified: v.optional(v.string()),
    phoneVerified: v.optional(v.string()),
    provider: v.string(),
    providerAccountId: v.string(),
    secret: v.optional(v.string()),
    userId: v.id("users"),
  })
    .index("providerAndAccountId", ["provider", "providerAccountId"])
    .index("userIdAndProvider", ["userId", "provider"]),
  authRateLimits: defineTable({
    attemptsLeft: v.float64(),
    identifier: v.string(),
    lastAttemptTime: v.float64(),
  }).index("identifier", ["identifier"]),
  authRefreshTokens: defineTable({
    expirationTime: v.float64(),
    firstUsedTime: v.optional(v.float64()),
    parentRefreshTokenId: v.optional(v.id("authRefreshTokens")),
    sessionId: v.id("authSessions"),
  })
    .index("sessionId", ["sessionId"])
    .index("sessionIdAndParentRefreshTokenId", [
      "sessionId",
      "parentRefreshTokenId",
    ]),
  authSessions: defineTable({
    expirationTime: v.float64(),
    userId: v.id("users"),
  }).index("userId", ["userId"]),
  authVerificationCodes: defineTable({
    accountId: v.id("authAccounts"),
    code: v.string(),
    emailVerified: v.optional(v.string()),
    expirationTime: v.float64(),
    phoneVerified: v.optional(v.string()),
    provider: v.string(),
    verifier: v.optional(v.string()),
  })
    .index("accountId", ["accountId"])
    .index("code", ["code"]),
  authVerifiers: defineTable({
    sessionId: v.optional(v.id("authSessions")),
    signature: v.optional(v.string()),
  }).index("signature", ["signature"]),
  users: defineTable({
    clerkId: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    name: v.optional(v.string()),
    fullName: v.optional(v.string()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    role: v.optional(v.string()),
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
    // Onboarding fields for travelers
    dateOfBirth: v.optional(v.string()),
    onboardingCompleted: v.optional(v.boolean()),
    onboardingCompletedAt: v.optional(v.number()),
    stripeCustomerId: v.optional(v.string()),
  })
    .index("clerkId", ["clerkId"])
    .index("email", ["email"])
    .index("by_partner", ["partnerId"])
    .index("by_organization", ["organizationId"])
    .index("by_role", ["role"])
    .searchIndex("by_name_email", {
      searchField: "name",
      filterFields: ["email"],
    }),
  assetPermissions: defineTable({
    employeeId: v.id("users"),
    assetId: v.string(), // Store as string for flexibility across different asset types
    assetType: v.string(),
    permissions: v.array(v.string()), // Array of permissions like ["view", "edit", "manage"]
    grantedAt: v.number(),
    grantedBy: v.id("users"), // Partner who granted the permissions
    partnerId: v.id("users"), // Add partnerId field for backwards compatibility
  })
    .index("by_employee_asset_type", ["employeeId", "assetType"])
    .index("by_asset_type", ["assetType", "assetId"])
    .index("by_partner", ["partnerId"]) // Add missing index
    .index("by_employee", ["employeeId"]) // Add missing index
    .index("by_employee_partner", ["employeeId", "partnerId"]), // Add missing index

  // Employee creation requests for partners
  employeeCreationRequests: defineTable({
    employeeId: v.id("users"),              // Reference to created employee record
    partnerId: v.id("users"),               // Partner who initiated the creation
    email: v.string(),                      // Employee email
    password: v.string(),                   // Temporary password storage
    name: v.string(),                       // Employee name
    phone: v.optional(v.string()),          // Employee phone
    organizationId: v.optional(v.id("partnerOrganizations")), // Organization assignment
    status: v.union(                        // Request status
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    clerkId: v.optional(v.string()),        // Clerk user ID when created
    errorMessage: v.optional(v.string()),   // Error message if creation failed
    createdAt: v.number(),                  // Creation timestamp
    processedAt: v.optional(v.number()),    // When processing completed
  })
    .index("by_partner", ["partnerId"])
    .index("by_status", ["status"])
    .index("by_employee", ["employeeId"])
    .index("by_email", ["email"]),
    
  // Mensagens de suporte do botão flutuante
  supportMessages: defineTable({
    userId: v.id("users"), // Usuário que enviou a mensagem
    userRole: v.union(v.literal("traveler"), v.literal("partner"), v.literal("employee"), v.literal("master")),
    subject: v.string(),
    category: v.union(
      v.literal("duvida"),
      v.literal("problema"), 
      v.literal("sugestao"),
      v.literal("cancelamento"),
      v.literal("outro")
    ),
    message: v.string(),
    contactEmail: v.string(),
    isUrgent: v.boolean(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    assignedToMasterId: v.optional(v.id("users")), // Master responsável
    responseMessage: v.optional(v.string()),
    respondedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_assigned_master", ["assignedToMasterId"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"])
    .index("by_urgent", ["isUrgent"]),

  // Permissões sobre organizações/empreendimentos
  organizationPermissions: defineTable({
    // ID do employee
    employeeId: v.id("users"),
    
    // ID do partner que concedeu a permissão
    partnerId: v.id("users"),
    
    // ID da organização/empreendimento
    organizationId: v.id("partnerOrganizations"),
    
    // Permissões (view, edit, manage)
    permissions: v.array(v.string()),
    
    // Nota opcional sobre a permissão
    note: v.optional(v.string()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_employee", ["employeeId"]) // Todas as permissões de um employee
    .index("by_partner", ["partnerId"]) // Todas as permissões concedidas por um partner
    .index("by_organization", ["organizationId"]) // Todas as permissões para uma organização específica
    .index("by_employee_partner", ["employeeId", "partnerId"]) // Permissões de um employee por partner
    .index("by_employee_organization", ["employeeId", "organizationId"]), // Permissões específicas employee-organização

  // Sistema de Chat
  chatRooms: defineTable({
    // Tipo de contexto do chat (asset, booking, ou admin_reservation)
    contextType: v.union(
      v.literal("asset"), 
      v.literal("booking"),
      v.literal("admin_reservation"),
      v.literal("package_request"),
      v.literal("package_proposal")
    ),
    
    // ID do contexto (asset ID, booking ID, admin reservation ID, etc.)
    contextId: v.string(),
    
    // Tipo do asset (se contextType for "asset")
    assetType: v.optional(v.string()), // "restaurants", "events", "activities", "vehicles"
    
    // Participantes do chat
    travelerId: v.id("users"), // O traveler que iniciou o chat
    partnerId: v.id("users"),  // O partner/employee responsável pelo asset
    
    // Reservation-specific fields
    reservationId: v.optional(v.string()), // Admin reservation ID for reservation-specific chats
    reservationType: v.optional(v.union(
      v.literal("admin_reservation"),
      v.literal("regular_booking")
    )),
    
    // Priority and categorization
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    
    // Assignment and delegation
    assignedTo: v.optional(v.id("users")), // Staff member assigned to handle this chat
    assignedBy: v.optional(v.id("users")), // Who assigned the chat
    assignedAt: v.optional(v.number()),    // When assigned
    
    // Status do chat
    status: v.union(
      v.literal("active"),
      v.literal("closed"),
      v.literal("archived"),
      v.literal("escalated"),
      v.literal("pending_response")
    ),
    
    // Metadata
    title: v.string(), // Título do chat baseado no contexto
    description: v.optional(v.string()), // Chat description
    tags: v.optional(v.array(v.string())), // Tags for categorization
    lastMessageAt: v.optional(v.number()),
    lastMessagePreview: v.optional(v.string()),
    
    // Unread message counts
    unreadCountTraveler: v.number(), // Unread messages for traveler
    unreadCountPartner: v.number(),  // Unread messages for partner
    
    // Auto-close settings
    autoCloseAfter: v.optional(v.number()), // Auto-close after X hours of inactivity
    autoCloseNotified: v.optional(v.boolean()), // Whether auto-close notification was sent
    
    // SLA and response tracking
    firstResponseTime: v.optional(v.number()), // Time to first response
    averageResponseTime: v.optional(v.number()), // Average response time
    lastResponseTime: v.optional(v.number()), // Last response time
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_traveler", ["travelerId"])
    .index("by_partner", ["partnerId"])
    .index("by_context", ["contextType", "contextId"])
    .index("by_traveler_partner", ["travelerId", "partnerId"])
    .index("by_status", ["status"])
    .index("by_reservation", ["reservationId", "reservationType"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_priority", ["priority"])
    .index("by_partner_status", ["partnerId", "status"])
    .index("by_traveler_status", ["travelerId", "status"])
    .index("by_priority_status", ["priority", "status"])
    .index("by_last_message", ["lastMessageAt"])
    .index("by_context_status", ["contextType", "status"]),

  chatMessages: defineTable({
    // Referência à sala de chat
    chatRoomId: v.id("chatRooms"),
    
    // Autor da mensagem
    senderId: v.id("users"),
    senderRole: v.union(v.literal("traveler"), v.literal("partner"), v.literal("employee"), v.literal("master")),
    
    // Conteúdo da mensagem
    content: v.string(),
    messageType: v.union(
      v.literal("text"),
      v.literal("image"),
      v.literal("file"),
      v.literal("system") // Mensagens automáticas do sistema
    ),
    
    // Metadados da mensagem
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_chatroom", ["chatRoomId"])
    .index("by_chatroom_timestamp", ["chatRoomId", "createdAt"])
    .index("by_sender", ["senderId"])
    .index("by_unread", ["isRead"]),

  // Chat Message Templates
  chatMessageTemplates: defineTable({
    name: v.string(),                               // Template name
    category: v.union(                              // Template category
      v.literal("greeting"),
      v.literal("booking_confirmation"),
      v.literal("booking_modification"),
      v.literal("cancellation"),
      v.literal("payment_reminder"),
      v.literal("special_request"),
      v.literal("follow_up"),
      v.literal("escalation"),
      v.literal("closing")
    ),
    assetType: v.optional(v.union(                  // Asset type this template applies to
      v.literal("activities"),
      v.literal("events"), 
      v.literal("restaurants"),
      v.literal("vehicles"),

      v.literal("packages"),
      v.literal("general")
    )),
    subject: v.string(),                            // Message subject/title
    content: v.string(),                            // Template content with variables
    variables: v.array(v.string()),                 // Available variables like customerName, assetTitle
    isActive: v.boolean(),                          // Whether template is active
    partnerId: v.optional(v.id("users")),           // Partner-specific templates (null for system templates)
    language: v.optional(v.string()),               // Language code (pt, en, es)
    
    // Metadata
    createdBy: v.id("users"),                       // Who created the template
    updatedBy: v.optional(v.id("users")),           // Who last updated the template
    createdAt: v.number(),                          // Creation timestamp
    updatedAt: v.number(),                          // Last update timestamp
  })
    .index("by_category", ["category"])
    .index("by_asset_type", ["assetType"])
    .index("by_partner", ["partnerId"])
    .index("by_category_asset", ["category", "assetType"])
    .index("by_partner_category", ["partnerId", "category"])
    .index("by_active", ["isActive"])
    .index("by_language", ["language"]),

  activities: defineTable({
    title: v.string(),
    description: v.string(),
    shortDescription: v.string(),
    price: v.float64(),
    category: v.string(),
    duration: v.string(),
    maxParticipants: v.int64(),
    minParticipants: v.int64(),
    difficulty: v.string(),
    rating: v.float64(),
    imageUrl: v.string(),
    galleryImages: v.array(v.string()),
    highlights: v.array(v.string()),
    includes: v.array(v.string()),
    itineraries: v.array(v.string()),
    excludes: v.array(v.string()),
    additionalInfo: v.array(v.string()),
    cancelationPolicy: v.array(v.string()),
    isFeatured: v.boolean(),
    isActive: v.boolean(),
    hasMultipleTickets: v.optional(v.boolean()),
    partnerId: v.id("users"),
    // Stripe integration fields
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    acceptsOnlinePayment: v.optional(v.boolean()),
    requiresUpfrontPayment: v.optional(v.boolean()),
    stripeMetadata: v.optional(v.object({
      productType: v.string(),
      partnerId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
  })
    .index("by_partner", ["partnerId"])
    .index("featured_activities", ["isFeatured", "isActive"])
    .index("active_activities", ["isActive"]),
    
  activityTickets: defineTable({
    activityId: v.id("activities"),           // Referência à atividade
    name: v.string(),                         // Nome do ingresso
    description: v.string(),                  // Descrição do ingresso
    price: v.float64(),                       // Preço do ingresso
    availableQuantity: v.int64(),             // Quantidade disponível
    maxPerOrder: v.int64(),                   // Quantidade máxima por pedido
    type: v.string(),                         // Tipo (ex: "regular", "vip", "discount", "free")
    benefits: v.array(v.string()),            // Benefícios incluídos neste ticket
    isActive: v.boolean(),                    // Se o ingresso está ativo/disponível
  })
    .index("by_activity", ["activityId"])
    .index("by_activity_and_active", ["activityId", "isActive"]),
  events: defineTable({
    title: v.string(),
    description: v.string(),
    shortDescription: v.string(),
    date: v.string(),        // ISO date string for the event date
    time: v.string(),        // Time string for the event
    location: v.string(),    // Location name
    address: v.string(),     // Full address
    price: v.float64(),      // Base price (pode ser o ingresso mais barato) 
    category: v.string(),
    maxParticipants: v.int64(),
    imageUrl: v.string(),
    galleryImages: v.array(v.string()),
    highlights: v.array(v.string()),
    includes: v.array(v.string()),
    additionalInfo: v.array(v.string()),
    speaker: v.optional(v.string()),     // Optional speaker/host name
    speakerBio: v.optional(v.string()),  // Optional speaker bio
    isFeatured: v.boolean(),
    isActive: v.boolean(),
    hasMultipleTickets: v.boolean(),     // Flag indicando se tem múltiplos ingressos
    partnerId: v.id("users"),
    symplaUrl: v.optional(v.string()),   // URL for Sympla event
    whatsappContact: v.optional(v.string()), // WhatsApp contact number for reservations
    // New Sympla fields
    symplaId: v.optional(v.string()),    // ID of the event in Sympla
    symplaHost: v.optional(v.object({    // Information about the host from Sympla
      name: v.string(),
      description: v.string(),
    })),
    sympla_private_event: v.optional(v.boolean()), // If the event is private on Sympla
    sympla_published: v.optional(v.boolean()),     // If the event is published on Sympla
    sympla_cancelled: v.optional(v.boolean()),     // If the event is cancelled on Sympla
    external_id: v.optional(v.string()),           // External ID (reference_id on Sympla)
    sympla_categories: v.optional(v.object({       // Categories from Sympla
      primary: v.optional(v.string()),
      secondary: v.optional(v.string()),
    })),
    // Stripe integration fields
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    acceptsOnlinePayment: v.optional(v.boolean()),
    requiresUpfrontPayment: v.optional(v.boolean()),
    stripeMetadata: v.optional(v.object({
      productType: v.string(),
      partnerId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
  })
    .index("by_partner", ["partnerId"])
    .index("by_date", ["date"])
    .index("featured_events", ["isFeatured", "isActive"])
    .index("active_events", ["isActive"]),
    
  eventTickets: defineTable({
    eventId: v.id("events"),              // Referência ao evento
    name: v.string(),                     // Nome do ingresso (ex: "VIP", "Standard")
    description: v.string(),              // Descrição do ingresso
    price: v.float64(),                   // Preço do ingresso
    availableQuantity: v.int64(),         // Quantidade disponível
    maxPerOrder: v.int64(),               // Quantidade máxima por pedido
    type: v.string(),                     // Tipo (ex: "regular", "vip", "discount", "free")
    benefits: v.array(v.string()),        // Benefícios incluídos neste ticket
    isActive: v.boolean(),                // Se o ingresso está ativo/disponível
  })
    .index("by_event", ["eventId"])
    .index("by_event_and_active", ["eventId", "isActive"]),
    
  restaurants: defineTable({
    name: v.string(),                                   // Nome do restaurante
    slug: v.string(),                                   // Slug para URL
    description: v.string(),                            // Descrição curta
    description_long: v.string(),                       // Descrição longa
    address: v.object({                                 // Objeto com informações de endereço
      street: v.string(),                               // Rua
      city: v.string(),                                 // Cidade
      state: v.string(),                                // Estado
      zipCode: v.string(),                              // CEP
      neighborhood: v.string(),                         // Bairro
      coordinates: v.object({                           // Coordenadas geográficas
        latitude: v.float64(),                          // Latitude
        longitude: v.float64(),                         // Longitude
      }),
    }),
    phone: v.string(),                                  // Telefone de contato
    website: v.optional(v.string()),                    // Website (opcional)
    cuisine: v.array(v.string()),                       // Array com tipos de cozinha
    priceRange: v.string(),                             // Faixa de preço (ex: "$", "$$", "$$$")
    diningStyle: v.string(),                            // Estilo (ex: "Casual", "Fine Dining")
    hours: v.object({                                   // Horário de funcionamento por dia
      Monday: v.array(v.string()),                      // Array com horários - pode ser vazio
      Tuesday: v.array(v.string()),
      Wednesday: v.array(v.string()),
      Thursday: v.array(v.string()),
      Friday: v.array(v.string()),
      Saturday: v.array(v.string()),
      Sunday: v.array(v.string()),
    }),
    features: v.array(v.string()),                      // Características especiais
    dressCode: v.optional(v.string()),                  // Código de vestimenta (opcional)
    paymentOptions: v.array(v.string()),                // Opções de pagamento
    parkingDetails: v.optional(v.string()),             // Informações sobre estacionamento (opcional)
    mainImage: v.string(),                              // Imagem principal
    galleryImages: v.array(v.string()),                 // Imagens da galeria
    menuImages: v.optional(v.array(v.string())),        // Imagens do menu (opcional)
    rating: v.object({                                  // Objeto com avaliações
      overall: v.float64(),                             // Nota geral
      food: v.float64(),                                // Nota para comida
      service: v.float64(),                             // Nota para serviço
      ambience: v.float64(),                            // Nota para ambiente
      value: v.float64(),                               // Nota para custo-benefício
      noiseLevel: v.string(),                           // Nível de barulho
      totalReviews: v.int64(),                          // Total de avaliações
    }),
    acceptsReservations: v.boolean(),                   // Aceita reservas
    maximumPartySize: v.int64(),                        // Tamanho máximo de grupo
    tags: v.array(v.string()),                          // Tags para busca
    executiveChef: v.optional(v.string()),              // Chef executivo (opcional)
    privatePartyInfo: v.optional(v.string()),           // Informações para eventos privados (opcional)
    isActive: v.boolean(),                              // Status ativo/inativo
    isFeatured: v.boolean(),                            // Status destacado
    partnerId: v.id("users"),                           // ID do parceiro/proprietário
    price: v.optional(v.number()),                       // Preço por reserva (opcional)
    // Stripe integration fields
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    acceptsOnlinePayment: v.optional(v.boolean()),
    requiresUpfrontPayment: v.optional(v.boolean()),
    stripeMetadata: v.optional(v.object({
      productType: v.string(),
      partnerId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
  })
    .index("by_slug", ["slug"])                         // Índice por slug (URL)
    .index("by_partner", ["partnerId"])                 // Índice por parceiro
    .index("featured_restaurants", ["isFeatured", "isActive"])  // Índice para restaurantes destacados
    .index("active_restaurants", ["isActive"]),         // Índice para restaurantes ativos
    
  restaurantReservations: defineTable({
    restaurantId: v.id("restaurants"),                  // Referência ao restaurante
    userId: v.id("users"),                              // Usuário que fez a reserva
    date: v.string(),                                   // Data da reserva (YYYY-MM-DD)
    time: v.string(),                                   // Horário da reserva (HH:MM)
    partySize: v.number(),                              // Número de pessoas
    name: v.string(),                                   // Nome do responsável pela reserva
    email: v.string(),                                  // Email de contato
    phone: v.string(),                                  // Telefone de contato
    specialRequests: v.optional(v.string()),            // Solicitações especiais (opcional)
    partnerNotes: v.optional(v.string()),               // Notes from partner/employee
    status: v.string(),                                 // Status (ex: "pending", "confirmed", "canceled")
    confirmationCode: v.string(),                       // Código de confirmação
    tableId: v.optional(v.id("restaurantTables")),      // Mesa atribuída (opcional)
    // Coupon fields
    couponCode: v.optional(v.string()),                 // Applied coupon code
    discountAmount: v.optional(v.number()),             // Discount amount applied
    finalAmount: v.optional(v.number()),                // Final amount after discount
    // Stripe integration fields
    paymentStatus: v.optional(v.string()),              // Status do pagamento
    paymentMethod: v.optional(v.string()),              // Método de pagamento
    totalPrice: v.optional(v.number()),                 // Preço total se aplicável
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    paymentDetails: v.optional(v.object({
      receiptUrl: v.optional(v.string()),
    })),
    refunds: v.optional(v.array(v.object({
      refundId: v.string(),
      amount: v.number(),
      reason: v.string(),
      status: v.string(),
      createdAt: v.number(),
      processedAt: v.optional(v.number()),
    }))),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  })
    .index("by_restaurant", ["restaurantId"])
    .index("by_user", ["userId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_table", ["tableId"]),

  // Tabelas do restaurante
  restaurantTables: defineTable({
    restaurantId: v.id("restaurants"),                  // Referência ao restaurante
    name: v.string(),                                   // Nome/número da mesa (ex: "Mesa 01", "VIP A")
    capacity: v.int64(),                                // Capacidade máxima de pessoas
    location: v.string(),                               // Localização (ex: "Interno", "Varanda", "VIP")
    type: v.string(),                                   // Tipo (ex: "Standard", "VIP", "Bar")
    shape: v.string(),                                  // Formato (ex: "Round", "Square", "Rectangular")
    isActive: v.boolean(),                              // Mesa disponível para reservas
    isVip: v.boolean(),                                 // Mesa VIP
    hasView: v.boolean(),                               // Mesa com vista
    notes: v.optional(v.string()),                      // Observações especiais
    position: v.optional(v.object({                     // Posição no layout (opcional)
      x: v.float64(),
      y: v.float64(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_restaurant", ["restaurantId"])
    .index("by_restaurant_active", ["restaurantId", "isActive"])
    .index("by_capacity", ["capacity"]),

  // Categorias do cardápio
  menuCategories: defineTable({
    restaurantId: v.id("restaurants"),                  // Referência ao restaurante
    name: v.string(),                                   // Nome da categoria (ex: "Pratos Principais", "Sobremesas")
    description: v.optional(v.string()),                // Descrição da categoria
    order: v.int64(),                                   // Ordem de exibição
    isActive: v.boolean(),                              // Categoria ativa
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_restaurant", ["restaurantId"])
    .index("by_restaurant_order", ["restaurantId", "order"]),

  // Itens do cardápio
  menuItems: defineTable({
    restaurantId: v.id("restaurants"),                  // Referência ao restaurante
    categoryId: v.id("menuCategories"),                 // Referência à categoria
    name: v.string(),                                   // Nome do prato
    description: v.string(),                            // Descrição do prato
    price: v.float64(),                                 // Preço
    image: v.optional(v.string()),                      // Imagem do prato (opcional)
    ingredients: v.array(v.string()),                   // Lista de ingredientes
    allergens: v.array(v.string()),                     // Alérgenos
    preparationTime: v.optional(v.int64()),             // Tempo de preparo em minutos (opcional)
    calories: v.optional(v.int64()),                    // Calorias (opcional)
    isVegetarian: v.boolean(),                          // Vegetariano
    isVegan: v.boolean(),                               // Vegano
    isGlutenFree: v.boolean(),                          // Sem glúten
    isSpicy: v.boolean(),                               // Picante
    spicyLevel: v.optional(v.int64()),                  // Nível de picância (1-5) (opcional)
    isSignature: v.boolean(),                           // Prato assinatura
    isAvailable: v.boolean(),                           // Disponível
    order: v.int64(),                                   // Ordem dentro da categoria
    tags: v.array(v.string()),                          // Tags (ex: "Popular", "Chef's Choice")
    notes: v.optional(v.string()),                      // Observações
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_restaurant", ["restaurantId"])
    .index("by_category", ["categoryId"])
    .index("by_restaurant_available", ["restaurantId", "isAvailable"])
    .index("by_category_order", ["categoryId", "order"])
    .index("by_signature", ["isSignature"])             // Índice por pratos assinatura
    .index("by_spicy", ["isSpicy"])                     // Índice por pratos picantes
    .index("by_vegetarian", ["isVegetarian"])           // Índice por pratos vegetarianos
    .index("by_restaurant_signature", ["restaurantId", "isSignature"]), // Índice por restaurante e pratos assinatura
  media: defineTable({
    storageId: v.string(),          // Convex Storage ID
    fileName: v.string(),          // Original file name
    fileType: v.string(),          // MIME type (e.g., image/jpeg)
    fileSize: v.int64(),           // File size in bytes
    description: v.optional(v.string()), // Optional description
    category: v.optional(v.string()),   // Optional category for organization
    height: v.optional(v.int64()),      // Image height if applicable
    width: v.optional(v.int64()),       // Image width if applicable
    uploadedBy: v.id("users"),         // User who uploaded the file
    isPublic: v.boolean(),           // Is the file publicly accessible
    tags: v.optional(v.array(v.string())), // Optional tags for filtering
    url: v.string(),                 // URL to access the file
  })
    .index("by_uploadedBy", ["uploadedBy"])
    .index("by_category", ["category"])
    .index("by_isPublic", ["isPublic"])
    .index("by_storageId", ["storageId"]),
  invites: defineTable({
    employeeId: v.id("users"),  // ID do usuário placeholder
    email: v.string(),            // Email convidado
    token: v.string(),            // Token único de convite
    createdAt: v.number(),        // Timestamp de criação
    expiresAt: v.number(),        // Timestamp de expiração
    status: v.string(),           // 'pending', 'used', etc.
  })
    .index("by_token", ["token"])
    .index("by_employee", ["employeeId"])
    .index("by_email", ["email"]),
  userPreferences: defineTable({
    userId: v.id("users"),                          // ID do usuário
    tripDuration: v.string(),                       // Duração da viagem
    tripDate: v.string(),                           // Período da viagem
    companions: v.string(),                         // Acompanhantes
    interests: v.array(v.string()),                 // Interesses (praias, mergulho, etc)
    budget: v.number(),                             // Orçamento por pessoa
    preferences: v.object({                         // Preferências específicas
      accommodation: v.optional(v.string()),        // TEMPORARY: for backward compatibility
      dining: v.array(v.string()),                  // Preferências gastronômicas
      activities: v.array(v.string()),              // Atividades preferidas
    }),
    specialRequirements: v.optional(v.string()),    // Requisitos especiais (opcional)
    updatedAt: v.number(),                          // Timestamp da última atualização
  })
    .index("by_user", ["userId"]),                  // Índice por usuário

  // Activity Bookings
  activityBookings: defineTable({
    activityId: v.id("activities"),
    userId: v.id("users"),
    ticketId: v.optional(v.id("activityTickets")), // If activity has multiple tickets
    date: v.string(),                              // Date for the activity (YYYY-MM-DD)
    time: v.optional(v.string()),                  // Specific time if applicable
    participants: v.number(),                      // Number of participants
    totalPrice: v.number(),                        // Total price for booking
    status: v.string(),                            // pending, confirmed, canceled, completed, refunded
    paymentStatus: v.optional(v.string()),         // pending, paid, refunded, failed
    paymentMethod: v.optional(v.string()),         // credit_card, pix, bank_transfer
    specialRequests: v.optional(v.string()),       // Special requests from customer
    partnerNotes: v.optional(v.string()),          // Notes from partner/employee
    confirmationCode: v.string(),                  // Unique confirmation code
    customerInfo: v.object({                       // Customer contact information
      name: v.string(),
      email: v.string(),
      phone: v.string(),
    }),
    // Coupon fields
    couponCode: v.optional(v.string()),            // Applied coupon code
    discountAmount: v.optional(v.number()),        // Discount amount applied
    finalAmount: v.optional(v.number()),           // Final amount after discount
    // Stripe integration fields
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    paymentDetails: v.optional(v.object({
      receiptUrl: v.optional(v.string()),
    })),
    refunds: v.optional(v.array(v.object({
      refundId: v.string(),
      amount: v.number(),
      reason: v.string(),
      status: v.string(),
      createdAt: v.number(),
      processedAt: v.optional(v.number()),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_activity", ["activityId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"])
    .index("by_confirmation_code", ["confirmationCode"]),

  // Event Bookings  
  eventBookings: defineTable({
    eventId: v.id("events"),
    userId: v.id("users"),
    ticketId: v.optional(v.id("eventTickets")),    // If event has multiple tickets
    quantity: v.number(),                          // Number of tickets
    totalPrice: v.number(),                        // Total price for booking
    status: v.string(),                            // pending, confirmed, canceled, completed, refunded
    paymentStatus: v.optional(v.string()),         // pending, paid, refunded, failed
    paymentMethod: v.optional(v.string()),         // credit_card, pix, bank_transfer
    specialRequests: v.optional(v.string()),       // Special requests from customer
    partnerNotes: v.optional(v.string()),          // Notes from partner/employee
    confirmationCode: v.string(),                  // Unique confirmation code
    customerInfo: v.object({                       // Customer contact information
      name: v.string(),
      email: v.string(),
      phone: v.string(),
    }),
    // Coupon fields
    couponCode: v.optional(v.string()),            // Applied coupon code
    discountAmount: v.optional(v.number()),        // Discount amount applied
    finalAmount: v.optional(v.number()),           // Final amount after discount
    // Stripe integration fields
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    paymentDetails: v.optional(v.object({
      receiptUrl: v.optional(v.string()),
    })),
    refunds: v.optional(v.array(v.object({
      refundId: v.string(),
      amount: v.number(),
      reason: v.string(),
      status: v.string(),
      createdAt: v.number(),
      processedAt: v.optional(v.number()),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_confirmation_code", ["confirmationCode"]),
  
  // Vehicle tables
  vehicles: defineTable({
    // Basic information
    name: v.string(),
    brand: v.string(),
    model: v.string(),
    category: v.string(), // economy, compact, sedan, suv, luxury, etc.
    year: v.number(),
    licensePlate: v.string(),
    color: v.string(),
    seats: v.number(),
    
    // Technical details
    fuelType: v.string(), // Gasolina, Etanol, Flex, Diesel, Elétrico, Híbrido
    transmission: v.string(), // Manual, Automático, CVT, Semi-automático
    
    // Business details
    pricePerDay: v.number(),
    description: v.optional(v.string()),
    features: v.array(v.string()),
    imageUrl: v.optional(v.string()),
    
    // Status
    status: v.string(), // available, rented, maintenance
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
    ownerId: v.optional(v.id("users")), // Reference to user who created/owns this vehicle
    organizationId: v.optional(v.string()), // For multi-tenant applications
    // Stripe integration fields
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    acceptsOnlinePayment: v.optional(v.boolean()),
    requiresUpfrontPayment: v.optional(v.boolean()),
    stripeMetadata: v.optional(v.object({
      productType: v.string(),
      partnerId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
  })
    .index("by_status", ["status"])
    .index("by_ownerId", ["ownerId"]),
  
  vehicleBookings: defineTable({
    vehicleId: v.id("vehicles"),
    userId: v.id("users"),
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
    totalPrice: v.number(),
    status: v.string(), // pending, confirmed, canceled, completed
    paymentMethod: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    pickupLocation: v.optional(v.string()),
    returnLocation: v.optional(v.string()),
    additionalDrivers: v.optional(v.number()),
    additionalOptions: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    partnerNotes: v.optional(v.string()), // Notes from partner/employee
    confirmationCode: v.string(), // Unique confirmation code
    customerInfo: v.optional(v.object({     // Customer contact information
      name: v.string(),
      email: v.string(),
      phone: v.string(),
    })),
    // Coupon fields
    couponCode: v.optional(v.string()),         // Applied coupon code
    discountAmount: v.optional(v.number()),     // Discount amount applied
    finalAmount: v.optional(v.number()),        // Final amount after discount
    // Stripe integration fields
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    paymentDetails: v.optional(v.object({
      receiptUrl: v.optional(v.string()),
    })),
    refunds: v.optional(v.array(v.object({
      refundId: v.string(),
      amount: v.number(),
      reason: v.string(),
      status: v.string(),
      createdAt: v.number(),
      processedAt: v.optional(v.number()),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_vehicleId", ["vehicleId"])
    .index("by_userId", ["userId"])
    .index("by_status", ["status"])
    .index("by_vehicleId_status", ["vehicleId", "status"])
    .index("by_dates", ["startDate", "endDate"]),

  // Notifications System
  notifications: defineTable({
    userId: v.id("users"),                      // User who receives the notification
    type: v.string(),                           // Type: "booking_confirmed", "booking_canceled", "booking_updated", etc.
    title: v.string(),                          // Notification title
    message: v.string(),                        // Notification message
    relatedId: v.optional(v.string()),          // Related entity ID (booking, event, etc.)
    relatedType: v.optional(v.string()),        // Related entity type (activity_booking, event_booking, etc.)
    isRead: v.boolean(),                        // Whether the notification has been read
    data: v.optional(v.object({                 // Additional data for the notification
      confirmationCode: v.optional(v.string()),
      bookingType: v.optional(v.string()),
      assetName: v.optional(v.string()),
      partnerName: v.optional(v.string()),
      // Novos campos para chat
      senderName: v.optional(v.string()),
      messagePreview: v.optional(v.string()),
      contextType: v.optional(v.string()),
      assetType: v.optional(v.string()),
      bookingCode: v.optional(v.string()),
      travelerName: v.optional(v.string()),
      proposalTitle: v.optional(v.string()), // Added for package proposals
      proposalNumber: v.optional(v.string()), // Added for package proposal number
    })),
    createdAt: v.number(),                      // When the notification was created
    readAt: v.optional(v.number()),             // When it was read (if applicable)
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"])
    .index("by_user_type", ["userId", "type"])
    .index("by_created", ["createdAt"]),

  // Rate Limiting System
  rateLimits: defineTable({
    key: v.string(),                            // Unique identifier for the rate limit (userId_operation_identifier)
    userId: v.id("users"),                      // User ID
    operation: v.string(),                      // Type of operation being rate limited
    timestamp: v.number(),                      // When the attempt was made
    identifier: v.optional(v.string()),         // Additional identifier (e.g., IP address)
  })
    .index("by_key_timestamp", ["key", "timestamp"])
    .index("by_user", ["userId"])
    .index("by_timestamp", ["timestamp"]),

  // Packages System
  packages: defineTable({
    // Basic Information
    name: v.string(),                           // Nome do pacote
    slug: v.string(),                           // Slug para URL amigável
    description: v.string(),                    // Descrição curta
    description_long: v.string(),               // Descrição detalhada
    
    // Package Configuration
    duration: v.number(),                       // Duração em dias
    maxGuests: v.number(),                      // Número máximo de hóspedes
    
    // Pricing
    basePrice: v.number(),                      // Preço base do pacote
    discountPercentage: v.optional(v.number()), // Desconto aplicado sobre preços individuais
    currency: v.string(),                       // Moeda (BRL)
    
    // Included Services

    vehicleId: v.optional(v.id("vehicles")),    // Veículo incluído (opcional)
    includedActivityIds: v.array(v.id("activities")), // Atividades incluídas
    includedRestaurantIds: v.array(v.id("restaurants")), // Restaurantes incluídos
    includedEventIds: v.array(v.id("events")),  // Eventos incluídos
    
    // Package Details
    highlights: v.array(v.string()),            // Destaques do pacote
    includes: v.array(v.string()),              // O que está incluído
    excludes: v.array(v.string()),              // O que não está incluído
    itinerary: v.array(v.object({               // Itinerário dia a dia
      day: v.number(),                          // Dia (1, 2, 3...)
      title: v.string(),                        // Título do dia
      description: v.string(),                  // Descrição das atividades
      activities: v.array(v.string()),          // Atividades do dia
    })),
    
    // Media
    mainImage: v.string(),                      // Imagem principal
    galleryImages: v.array(v.string()),         // Galeria de imagens
    
    // Policies
    cancellationPolicy: v.string(),             // Política de cancelamento
    terms: v.array(v.string()),                 // Termos e condições
    
    // Availability
    availableFromDate: v.string(),              // Data de início da disponibilidade
    availableToDate: v.string(),                // Data de fim da disponibilidade
    blackoutDates: v.array(v.string()),         // Datas não disponíveis
    
    // Status
    isActive: v.boolean(),                      // Status ativo/inativo
    isFeatured: v.boolean(),                    // Status destacado
    
    // Metadata
    tags: v.array(v.string()),                  // Tags para busca
    category: v.string(),                       // Categoria do pacote (Aventura, Relaxamento, Cultural, etc.)
    partnerId: v.id("users"),                   // ID do parceiro criador
    createdAt: v.number(),                      // Timestamp de criação
    updatedAt: v.number(),                      // Timestamp de atualização
    // Stripe integration fields
    stripeProductId: v.optional(v.string()),
    stripePriceId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    acceptsOnlinePayment: v.optional(v.boolean()),
    requiresUpfrontPayment: v.optional(v.boolean()),
    stripeMetadata: v.optional(v.object({
      productType: v.string(),
      partnerId: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
  })
    .index("by_slug", ["slug"])
    .index("by_partner", ["partnerId"])
    .index("by_category", ["category"])
    .index("featured_packages", ["isFeatured", "isActive"])
    .index("active_packages", ["isActive"])

    .index("by_vehicle", ["vehicleId"]),

  // Package Bookings
  packageBookings: defineTable({
    packageId: v.id("packages"),
    userId: v.id("users"),
    startDate: v.string(),
    endDate: v.string(),
    guests: v.number(),
    totalPrice: v.number(),
    breakdown: v.object({
  
      vehiclePrice: v.optional(v.number()),
      activitiesPrice: v.number(),
      restaurantsPrice: v.number(),
      eventsPrice: v.number(),
      discount: v.number(),
    }),
    status: v.string(),
    paymentStatus: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    relatedBookings: v.object({
  
      vehicleBookingId: v.optional(v.id("vehicleBookings")),
      activityBookingIds: v.array(v.id("activityBookings")),
      restaurantReservationIds: v.array(v.id("restaurantReservations")),
      eventBookingIds: v.array(v.id("eventBookings")),
    }),
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
    }),
    specialRequests: v.optional(v.string()),
    partnerNotes: v.optional(v.string()),
    confirmationCode: v.string(),
    // Stripe integration fields
    stripeCheckoutSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    paymentDetails: v.optional(v.object({
      receiptUrl: v.optional(v.string()),
    })),
    refunds: v.optional(v.array(v.object({
      refundId: v.string(),
      amount: v.number(),
      reason: v.string(),
      status: v.string(),
      createdAt: v.number(),
      processedAt: v.optional(v.number()),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_package", ["packageId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_start_date", ["startDate"])
    .index("by_confirmation_code", ["confirmationCode"])
    .index("by_package_dates", ["packageId", "startDate", "endDate"]),


  // Wishlist/Favorites System
  wishlistItems: defineTable({
    userId: v.id("users"),
    itemType: v.string(), // "package", "activity", "restaurant", "event", "vehicle"
    itemId: v.string(), // ID of the item (stored as string for flexibility)
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_type", ["userId", "itemType"])
    .index("by_user_item", ["userId", "itemType", "itemId"]),

  // Package Comparison System
  packageComparisons: defineTable({
    userId: v.id("users"),
    packageIds: v.array(v.id("packages")), // Up to 3 packages for comparison
    name: v.optional(v.string()), // Optional name for saved comparison
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // Package Request System (Simplified)
  packageRequests: defineTable({
    // User Information
    userId: v.optional(v.id("users")), // User who made the request
    // Customer Information
    customerInfo: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      age: v.optional(v.number()),
      occupation: v.optional(v.string()),
    }),
    
    // Trip Details
    tripDetails: v.object({
      destination: v.string(),
      originCity: v.optional(v.string()), // Where the traveler is departing from
      // For specific dates
      startDate: v.optional(v.string()),
      endDate: v.optional(v.string()),
      // For flexible dates
      startMonth: v.optional(v.string()),
      endMonth: v.optional(v.string()),
      flexibleDates: v.optional(v.boolean()),
      duration: v.number(), // in days
      groupSize: v.number(),
      companions: v.string(), // family, friends, couple, solo, business
      budget: v.number(),
      budgetFlexibility: v.string(), // strict, somewhat_flexible, very_flexible
    }),
    
    // Preferences
    preferences: v.object({
  
      activities: v.array(v.string()), // adventure, cultural, relaxation, food, etc.
      transportation: v.array(v.string()), // car, bus, plane, walking, etc.
      foodPreferences: v.array(v.string()), // local_cuisine, international, vegetarian, etc.
      accessibility: v.optional(v.array(v.string())), // wheelchair, visual_impairment, etc.
      accommodationType: v.optional(v.array(v.string())), // hotel, hostel, apartment, etc.
    }),
    
    // Special Requirements
    specialRequirements: v.optional(v.string()),
    previousExperience: v.optional(v.string()), // Have they traveled here before?
    expectedHighlights: v.optional(v.string()), // What are they most excited about?
    
    // Status and Management
    status: v.union(
      v.literal("pending"),
      v.literal("in_review"),
      v.literal("proposal_sent"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed")
    ),
    adminNotes: v.optional(v.string()),
    proposalSent: v.optional(v.boolean()),
    proposalDetails: v.optional(v.string()),
    
    // Proposal related fields
    proposalCount: v.optional(v.number()),
    lastProposalSent: v.optional(v.number()),
    conversionStatus: v.optional(v.string()), // e.g., "converted", "abandoned"
    estimatedValue: v.optional(v.number()),
    
    // Metadata
    requestNumber: v.string(), // Unique request number for tracking
    createdAt: v.number(),
    updatedAt: v.number(),
    assignedTo: v.optional(v.id("users")), // Admin user assigned to this request
    partnerId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("partnerOrganizations")),
  })
    .index("by_status", ["status"])
    .index("by_email", ["customerInfo.email"])
    .index("by_request_number", ["requestNumber"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_created_date", ["createdAt"])
    .index("by_user", ["userId"]),

  // Messages de contato para solicitações de pacotes
  packageRequestMessages: defineTable({
    packageRequestId: v.id("packageRequests"),
    userId: v.id("users"),
    senderName: v.string(),
    senderEmail: v.string(),
    subject: v.string(),
    message: v.string(),
    status: v.union(
      v.literal("sent"),
      v.literal("read"),
      v.literal("replied")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    readAt: v.optional(v.number()),
    repliedAt: v.optional(v.number()),
  })
    .index("by_package_request", ["packageRequestId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_priority", ["priority"])
    .index("by_created_date", ["createdAt"]),

  // Reviews System (for packages, restaurants, activities, events)
  reviews: defineTable({
    userId: v.id("users"),
    itemType: v.string(), // "package", "activity", "restaurant", "event"
    itemId: v.string(), // ID of the item being reviewed
    rating: v.number(), // Overall rating 1-5
    title: v.string(),
    comment: v.string(),
    
    // Detailed ratings (optional based on item type)
    detailedRatings: v.optional(v.object({
      value: v.optional(v.number()), // Value for money
      service: v.optional(v.number()), // Service quality
      location: v.optional(v.number()), // Location (restaurants)
      food: v.optional(v.number()), // Food quality (restaurants)
      organization: v.optional(v.number()), // Organization (activities/events)
      guide: v.optional(v.number()), // Guide quality (activities)
      cleanliness: v.optional(v.number()), // Cleanliness/Condition (vehicles)
    })),
    
    // Additional info
    visitDate: v.optional(v.string()), // When they experienced the service
    groupType: v.optional(v.string()), // Solo, Couple, Family, Friends, Business
    wouldRecommend: v.boolean(),
    photos: v.optional(v.array(v.string())), // Review photos
    
    // Helpful votes
    helpfulVotes: v.number(),
    unhelpfulVotes: v.number(),
    
    // Status
    isVerified: v.boolean(), // Whether this is a verified purchase/booking
    isApproved: v.boolean(), // Moderation status
    
    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_item", ["itemType", "itemId"])
    .index("by_user", ["userId"])
    .index("by_item_approved", ["itemType", "itemId", "isApproved"])
    .index("by_rating", ["itemType", "itemId", "rating"]),

  // Review helpfulness votes
  reviewVotes: defineTable({
    reviewId: v.id("reviews"),
    userId: v.id("users"),
    voteType: v.string(), // "helpful" or "unhelpful"
    createdAt: v.number(),
  })
    .index("by_review", ["reviewId"])
    .index("by_user_review", ["userId", "reviewId"]),

  // Review responses from admins/partners
  reviewResponses: defineTable({
    reviewId: v.id("reviews"),
    responderId: v.id("users"),
    responderRole: v.string(), // "master", "partner", "employee"
    response: v.string(),
    isPublic: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_review", ["reviewId"])
    .index("by_responder", ["responderId"])
    .index("by_review_public", ["reviewId", "isPublic"]),

  // Organizações/Empreendimentos de Partners
  partnerOrganizations: defineTable({
    name: v.string(),                        // Nome do empreendimento
    description: v.optional(v.string()),     // Descrição do empreendimento
    type: v.string(),                        // Tipo: "restaurant", "rental_service", "activity_service", "event_service"
    image: v.optional(v.string()),           // Logo/imagem do empreendimento
    partnerId: v.id("users"),                // ID do partner dono
    isActive: v.boolean(),                   // Se está ativo
    settings: v.optional(v.object({         // Configurações específicas do empreendimento
      theme: v.optional(v.string()),         // Tema/cor principal
      contactInfo: v.optional(v.object({    // Informações de contato
        email: v.optional(v.string()),
        phone: v.optional(v.string()),
        website: v.optional(v.string()),
      })),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_partner", ["partnerId"])
    .index("by_partner_type", ["partnerId", "type"])
    .index("by_type", ["type"]),

  // Tabela para relacionar assets com organizações
  partnerAssets: defineTable({
    organizationId: v.id("partnerOrganizations"), // ID da organização
    assetId: v.string(),                          // ID do asset (pode ser de qualquer tabela)
    assetType: v.string(),                        // Tipo do asset (restaurants, events, activities, vehicles)
    partnerId: v.id("users"),                     // ID do partner (para facilitar queries)
    isActive: v.boolean(),                        // Se o asset está ativo nesta organização
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_partner", ["partnerId"])
    .index("by_asset", ["assetId", "assetType"])
    .index("by_organization_type", ["organizationId", "assetType"])
    .index("by_partner_type", ["partnerId", "assetType"]),

  // Sistema de Logs de Auditoria
  auditLogs: defineTable({
    // Actor - Quem executou a ação
    actor: v.object({
      userId: v.id("users"),                    // ID do usuário que executou a ação
      role: v.union(
        v.literal("traveler"), 
        v.literal("partner"), 
        v.literal("employee"), 
        v.literal("master")
      ),                                        // Role do usuário no momento da ação
      name: v.string(),                         // Nome do usuário (snapshot para auditoria)
      email: v.optional(v.string()),            // Email do usuário (snapshot)
    }),
    
    // Event - O que aconteceu
    event: v.object({
      type: v.union(
        // CRUD Operations
        v.literal("create"),
        v.literal("update"), 
        v.literal("delete"),
        // Authentication Events
        v.literal("login"),
        v.literal("logout"),
        v.literal("password_change"),
        // Asset Management
        v.literal("asset_create"),
        v.literal("asset_update"),
        v.literal("asset_delete"),
        v.literal("asset_feature_toggle"),
        v.literal("asset_status_change"),
        // Permission Management
        v.literal("permission_grant"),
        v.literal("permission_revoke"),
        v.literal("permission_update"),
        v.literal("role_change"),
        // Booking Operations
        v.literal("booking_create"),
        v.literal("booking_update"),
        v.literal("booking_cancel"),
        v.literal("booking_confirm"),
        // Admin Reservation Operations
        v.literal("admin_reservation_create"),
        v.literal("admin_reservation_update"),
        v.literal("admin_reservation_cancel"),
        v.literal("admin_reservation_confirm"),
        v.literal("admin_reservation_delete"),
        // Package Proposal Operations
        v.literal("package_proposal_create"),
        v.literal("package_proposal_update"),
        v.literal("package_proposal_send"),
        v.literal("package_proposal_viewed"),
        v.literal("package_proposal_approve"),
        v.literal("package_proposal_reject"),
        v.literal("package_proposal_accept"),
        v.literal("package_proposal_convert"),
        v.literal("package_proposal_delete"),
        v.literal("package_proposal_attachment_add"),
        v.literal("package_proposal_attachment_remove"),
        v.literal("package_proposal_template_create"),
        v.literal("package_proposal_template_update"),
        v.literal("package_proposal_template_delete"),
        // Auto-Confirmation Operations
        v.literal("auto_confirmation_create"),
        v.literal("auto_confirmation_update"),
        v.literal("auto_confirmation_enable"),
        v.literal("auto_confirmation_disable"),
        v.literal("auto_confirmation_delete"),
        // Reservation Communication
        v.literal("reservation_chat_create"),
        v.literal("reservation_message_send"),
        v.literal("reservation_comm_status_change"),
        v.literal("reservation_comm_assign"),
        // Organization Management
        v.literal("organization_create"),
        v.literal("organization_update"),
        v.literal("organization_delete"),
        // System Operations
        v.literal("system_config_change"),
        v.literal("bulk_operation"),
        // Media Operations
        v.literal("media_upload"),
        v.literal("media_delete"),
        // Chat Operations
        v.literal("chat_room_create"),
        v.literal("chat_message_send"),
        v.literal("chat_status_change"),
        // Other
        v.literal("other")
      ),
      action: v.string(),                       // Descrição legível da ação
      category: v.union(
        v.literal("authentication"),
        v.literal("authorization"),
        v.literal("data_access"),
        v.literal("data_modification"),
        v.literal("system_admin"),
        v.literal("user_management"),
        v.literal("asset_management"),
        v.literal("booking_management"),
        v.literal("admin_reservation_management"),
        v.literal("package_management"),
        v.literal("auto_confirmation_management"),
        v.literal("document_management"),
        v.literal("template_management"),
        v.literal("communication"),
        v.literal("security"),
        v.literal("compliance"),
        v.literal("other")
      ),                                        // Categoria do evento para agrupamento
      severity: v.union(
        v.literal("low"),
        v.literal("medium"), 
        v.literal("high"),
        v.literal("critical")
      ),                                        // Nível de severidade
    }),

    // Resource - Sobre o que a ação foi executada
    resource: v.optional(v.object({
      type: v.string(),                         // Tipo do recurso (restaurants, events, users, etc)
      id: v.string(),                           // ID do recurso
      name: v.optional(v.string()),             // Nome/título do recurso (snapshot)
      organizationId: v.optional(v.id("partnerOrganizations")), // Organização relacionada
      partnerId: v.optional(v.id("users")),     // Partner dono do recurso (se aplicável)
    })),

    // Source - De onde veio a ação
    source: v.object({
      ipAddress: v.string(),                    // Endereço IP
      userAgent: v.optional(v.string()),        // User agent do browser/app
      platform: v.union(
        v.literal("web"),
        v.literal("mobile"),
        v.literal("api"),
        v.literal("system"),
        v.literal("unknown")
      ),                                        // Plataforma de origem
      location: v.optional(v.object({           // Geolocalização (opcional)
        country: v.optional(v.string()),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
      })),
    }),

    // Status - Resultado da operação
    status: v.union(
      v.literal("success"),
      v.literal("failure"),
      v.literal("partial"),
      v.literal("pending")
    ),

    // Metadata - Dados adicionais específicos do evento
    metadata: v.optional(v.object({
      // Dados antes/depois para operações de atualização
      before: v.optional(v.any()),             // Estado anterior (para updates)
      after: v.optional(v.any()),              // Estado posterior (para updates)
      
      // Informações específicas do contexto
      reason: v.optional(v.string()),          // Motivo da ação (para operações críticas)
      batchId: v.optional(v.string()),         // ID do lote (para operações em massa)
      duration: v.optional(v.number()),        // Duração da operação em ms
      errorMessage: v.optional(v.string()),    // Mensagem de erro (se status === "failure")
      
      // Dados específicos por tipo de evento
      bookingCode: v.optional(v.string()),     // Código de reserva
      amount: v.optional(v.number()),          // Valor monetário (para transações)
      quantity: v.optional(v.number()),        // Quantidade (para bookings)
      permissions: v.optional(v.array(v.string())), // Permissões concedidas/revogadas
      
      // Contexto adicional
      sessionId: v.optional(v.string()),       // ID da sessão
      referrer: v.optional(v.string()),        // Página/tela de origem
      feature: v.optional(v.string()),         // Feature específica usada
      experiment: v.optional(v.string()),      // Experimento A/B ativo
      
      // Informações de arquivo (para operações de upload/download)
      fileName: v.optional(v.string()),        // Nome do arquivo
      fileSize: v.optional(v.number()),        // Tamanho do arquivo em bytes
      fileType: v.optional(v.string()),        // Tipo MIME do arquivo
      
      // Informações de proposta/comunicação
      currency: v.optional(v.string()),        // Moeda utilizada
      customMessage: v.optional(v.string()),   // Mensagem personalizada
      proposalNumber: v.optional(v.string()),  // Número da proposta
      sendEmail: v.optional(v.boolean()),      // Se enviou email
      sendNotification: v.optional(v.boolean()), // Se enviou notificação
      totalPrice: v.optional(v.number()),      // Preço total
      acceptedAt: v.optional(v.number()),      // Timestamp de aceitação
      customerFeedback: v.optional(v.string()), // Feedback do cliente
      updatedFields: v.optional(v.array(v.string())), // Campos atualizados
      oldStatus: v.optional(v.string()),       // Status anterior
      newStatus: v.optional(v.string()),       // Novo status
      statusChanged: v.optional(v.boolean()),  // Se o status foi alterado
      approved: v.optional(v.boolean()),       // Se foi aprovado
      approvalNotes: v.optional(v.string()),   // Notas de aprovação
      bookingId: v.optional(v.string()),       // ID da reserva
      paymentMethod: v.optional(v.string()),   // Método de pagamento
      notes: v.optional(v.string()),           // Notas gerais
      
      // Review data (for review moderation operations)
      deletedReviewData: v.optional(v.object({
        rating: v.number(),
        title: v.string(),
        itemType: v.string(),
        itemId: v.string()
      })),
      responseLength: v.optional(v.number()),     // Length of review response
      newSettings: v.optional(v.any()),           // New configuration settings
      defaultSettings: v.optional(v.any()),       // Default configuration settings
      
      // Arquivamento
      archived: v.optional(v.boolean()),       // Se o log foi arquivado
      archivedAt: v.optional(v.number()),      // Timestamp do arquivamento
    })),

    // Risk Assessment - Avaliação de risco automática
    riskAssessment: v.optional(v.object({
      score: v.number(),                        // Score de risco (0-100)
      factors: v.array(v.string()),             // Fatores que contribuíram para o score
      isAnomalous: v.boolean(),                 // Se a ação foi considerada anômala
      recommendation: v.optional(v.string()),   // Recomendação de ação
    })),

    // Compliance - Informações de conformidade
    compliance: v.optional(v.object({
      regulations: v.array(v.string()),         // Regulamentações aplicáveis (LGPD, GDPR, etc)
      retentionPeriod: v.number(),              // Período de retenção em dias
      isPersonalData: v.boolean(),              // Se envolve dados pessoais
      dataClassification: v.optional(v.union(
        v.literal("public"),
        v.literal("internal"),
        v.literal("confidential"),
        v.literal("restricted")
      )),
    })),

    // Timestamps
    timestamp: v.number(),                      // Timestamp preciso da ação
    expiresAt: v.optional(v.number()),          // Data de expiração do log (para limpeza automática)
  })
    .index("by_actor", ["actor.userId"])
    .index("by_actor_timestamp", ["actor.userId", "timestamp"])
    .index("by_event_type", ["event.type"])
    .index("by_event_category", ["event.category"])
    .index("by_timestamp", ["timestamp"])
    .index("by_resource", ["resource.type", "resource.id"])
    .index("by_partner", ["resource.partnerId"])
    .index("by_organization", ["resource.organizationId"])
    .index("by_status", ["status"])
    .index("by_severity", ["event.severity"])
    .index("by_platform", ["source.platform"])
    .index("by_ip", ["source.ipAddress"])
    .index("by_expires", ["expiresAt"])
    .index("by_partner_timestamp", ["resource.partnerId", "timestamp"])
    .index("by_organization_timestamp", ["resource.organizationId", "timestamp"]),

  // Cache de Recomendações
  cachedRecommendations: cachedRecommendationsTable,

  // Configurações Globais do Sistema
  systemSettings: defineTable({
    key: v.string(),                            // Chave única da configuração
    value: v.any(),                             // Valor da configuração (pode ser string, number, object, etc.)
    type: v.union(
      v.literal("string"),
      v.literal("number"),
      v.literal("boolean"),
      v.literal("object"),
      v.literal("array")
    ),                                          // Tipo do valor para validação
    category: v.union(
      v.literal("communication"),               // Configurações de comunicação
      v.literal("business"),                    // Configurações de negócio
      v.literal("system"),                      // Configurações do sistema
      v.literal("ui"),                         // Configurações de interface
      v.literal("integration"),                // Configurações de integrações
      v.literal("security")                    // Configurações de segurança
    ),
    description: v.string(),                    // Descrição da configuração
    isPublic: v.boolean(),                      // Se pode ser acessada por não-admins
    lastModifiedBy: v.id("users"),              // Último usuário que modificou
    lastModifiedAt: v.number(),                 // Timestamp da última modificação
    createdAt: v.number(),                      // Timestamp de criação
  })
    .index("by_key", ["key"])
    .index("by_category", ["category"])
    .index("by_public", ["isPublic"])
    .index("by_category_public", ["category", "isPublic"]),

  // Sistema de Logs de Email
  emailLogs: defineTable({
    type: v.union(
      v.literal("booking_confirmation"),
      v.literal("booking_cancelled"),
      v.literal("booking_reminder"),
      v.literal("package_request_received"),
      v.literal("package_request_status_update"),
      v.literal("package_proposal_sent"),
      v.literal("partner_new_booking"),
      v.literal("welcome_new_user"),
      v.literal("new_partner_registration"),
      v.literal("employee_invitation"),
      v.literal("support_message"),
      v.literal("payment_confirmation"),
      v.literal("payment_failed"),
      v.literal("review_request")
    ),
    to: v.string(),                             // Email do destinatário
    subject: v.string(),                        // Assunto do email
    status: v.union(
      v.literal("sent"),
      v.literal("failed"),
      v.literal("pending")
    ),
    error: v.optional(v.string()),              // Mensagem de erro (se falhou)
    sentAt: v.optional(v.number()),             // Timestamp de quando foi enviado
    readAt: v.optional(v.number()),             // Timestamp de quando foi lido (se aplicável)
    retryAt: v.optional(v.number()),            // Timestamp de tentativa de reenvio
    createdAt: v.number(),                      // Timestamp de criação
    updatedAt: v.optional(v.number()),          // Timestamp de última atualização
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_recipient", ["to"])
    .index("by_created_at", ["createdAt"])
    .index("by_sent_at", ["sentAt"])
    .index("by_type_status", ["type", "status"])
    .index("by_recipient_type", ["to", "type"]),

  // Stripe Integration Tables
  stripeWebhookEvents: defineTable({
    stripeEventId: v.string(),                  // Stripe Event ID (for idempotency)
    eventType: v.string(),                      // Event type (e.g., payment_intent.succeeded)
    livemode: v.boolean(),                      // Whether this is a live or test event
    processed: v.boolean(),                     // Whether the event has been processed
    processedAt: v.optional(v.number()),        // When it was processed
    relatedBookingId: v.optional(v.string()),   // Related booking ID
    relatedAssetType: v.optional(v.string()),   // Type of asset (activity, event, etc.)
    relatedAssetId: v.optional(v.string()),     // Asset ID
    eventData: v.object({
      amount: v.optional(v.number()),           // Amount involved
      currency: v.optional(v.string()),         // Currency
      paymentIntentId: v.optional(v.string()),  // Payment Intent ID
      customerId: v.optional(v.string()),       // Customer ID
    }),
    processingErrors: v.optional(v.array(v.object({
      error: v.string(),
      timestamp: v.number(),
      retryCount: v.number(),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stripe_event_id", ["stripeEventId"])
    .index("by_event_type", ["eventType"])
    .index("by_processed", ["processed"])
    .index("by_booking", ["relatedBookingId"])
    .index("by_asset", ["relatedAssetType", "relatedAssetId"])
    .index("by_created_at", ["createdAt"]),

  stripeCustomers: defineTable({
    userId: v.id("users"),                      // User Reference
    stripeCustomerId: v.string(),               // Stripe Customer ID
    email: v.string(),                          // Customer email
    name: v.optional(v.string()),               // Customer name
    phone: v.optional(v.string()),              // Customer phone
    metadata: v.optional(v.object({
      source: v.string(),                       // Where customer was created from
      userRole: v.string(),                     // User role when created
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_stripe_customer_id", ["stripeCustomerId"])
    .index("by_email", ["email"])
    .index("by_created_at", ["createdAt"]),

  // Tabelas para assinaturas do guia
  guideSubscriptions,
  subscriptionPayments,
  contactMessages,

  // Tabela para o conteúdo do guia
  guideContent: defineTable({
    sectionTitle: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
  }).searchIndex("by_content", {
    searchField: "content",
    filterFields: ["tags"],
  }),

  // Sistema de Cupons
  coupons: defineTable({
    // Identificação básica
    code: v.string(),                           // Código único do cupom (ex: "DESCONTO20")
    name: v.string(),                           // Nome descritivo do cupom
    description: v.string(),                    // Descrição detalhada
    
    // Configuração do desconto
    discountType: v.union(
      v.literal("percentage"),                  // Desconto percentual
      v.literal("fixed_amount")                 // Valor fixo
    ),
    discountValue: v.number(),                  // Valor do desconto (% ou valor fixo)
    maxDiscountAmount: v.optional(v.number()),  // Valor máximo de desconto (para percentual)
    
    // Regras de aplicação
    minimumOrderValue: v.optional(v.number()),  // Valor mínimo do pedido
    maximumOrderValue: v.optional(v.number()),  // Valor máximo do pedido
    
    // Controle de uso
    usageLimit: v.optional(v.number()),         // Limite total de usos (null = ilimitado)
    usageCount: v.number(),                     // Quantidade já utilizada
    userUsageLimit: v.optional(v.number()),     // Limite de uso por usuário
    
    // Validade
    validFrom: v.number(),                      // Data/hora de início (timestamp)
    validUntil: v.number(),                     // Data/hora de fim (timestamp)
    
    // Tipo de cupom
    type: v.union(
      v.literal("public"),                      // Cupom público (qualquer um pode usar)
      v.literal("private"),                     // Cupom privado (apenas usuários específicos)
      v.literal("first_purchase"),              // Apenas primeira compra
      v.literal("returning_customer")           // Apenas clientes que já compraram
    ),
    
    // Associações com assets
    applicableAssets: v.array(v.object({
      assetType: v.union(
        v.literal("activities"),
        v.literal("events"),
        v.literal("restaurants"),
        v.literal("vehicles"),
  
        v.literal("packages")
      ),
      assetId: v.string(),                      // ID do asset
      isActive: v.boolean(),                    // Se está ativo para este asset
    })),
    
    // Aplicação global (se vazio, aplicável apenas aos assets especificados)
    globalApplication: v.object({
      isGlobal: v.boolean(),                    // Se aplica globalmente
      assetTypes: v.array(v.string()),          // Tipos de asset aplicáveis (se global)
    }),
    
    // Usuários específicos (para cupons privados)
    allowedUsers: v.array(v.id("users")),      // Usuários que podem usar (apenas para private)
    
    // Status e controle
    isActive: v.boolean(),                      // Status ativo/inativo
    isPubliclyVisible: v.boolean(),             // Se aparece em listagens públicas
    
    // Metadados
    createdBy: v.id("users"),                   // Usuário que criou
    partnerId: v.optional(v.id("users")),       // Partner dono (se específico de partner)
    organizationId: v.optional(v.id("partnerOrganizations")), // Organização específica
    
    // Configurações avançadas
    stackable: v.boolean(),                     // Se pode ser usado com outros cupons
    autoApply: v.boolean(),                     // Se aplica automaticamente quando elegível
    
    // Notificações
    notifyOnExpiration: v.boolean(),            // Notificar quando próximo do vencimento
    notificationSentAt: v.optional(v.number()), // Quando a notificação foi enviada
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    
    // Soft delete
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_code", ["code"])
    .index("by_partner", ["partnerId"])
    .index("by_organization", ["organizationId"])
    .index("by_created_by", ["createdBy"])
    .index("by_status", ["isActive"])
    .index("by_valid_period", ["validFrom", "validUntil"])
    .index("by_type", ["type"])
    .index("by_partner_active", ["partnerId", "isActive"])
    .index("by_organization_active", ["organizationId", "isActive"])
    .index("by_expiration", ["validUntil"])
    .index("by_public_visible", ["isPubliclyVisible", "isActive"])
    .index("by_global_application", ["globalApplication.isGlobal", "isActive"])
    .index("by_type_active", ["type", "isActive"])
    .index("by_partner_type", ["partnerId", "type"])
    .index("by_organization_type", ["organizationId", "type"]),

  // Histórico de uso de cupons
  couponUsages: defineTable({
    couponId: v.id("coupons"),                  // Referência ao cupom
    userId: v.id("users"),                      // Usuário que usou
    
    // Contexto do uso
    bookingId: v.string(),                      // ID da reserva/compra
    bookingType: v.union(
      v.literal("activity"),
      v.literal("event"),
      v.literal("restaurant"),
      v.literal("vehicle"),
  
      v.literal("package")
    ),
    
    // Valores
    originalAmount: v.number(),                 // Valor original sem desconto
    discountAmount: v.number(),                 // Valor do desconto aplicado
    finalAmount: v.number(),                    // Valor final após desconto
    
    // Detalhes da aplicação
    appliedAt: v.number(),                      // Timestamp da aplicação
    appliedBy: v.id("users"),                   // Quem aplicou (pode ser diferente do usuário)
    
    // Status
    status: v.union(
      v.literal("applied"),                     // Aplicado com sucesso
      v.literal("refunded"),                    // Estornado
      v.literal("cancelled")                    // Cancelado
    ),
    
    // Metadados
    metadata: v.optional(v.object({
      paymentIntentId: v.optional(v.string()),  // ID do payment intent do Stripe
      refundId: v.optional(v.string()),         // ID do refund se aplicável
      partnerNotes: v.optional(v.string()),     // Notas do partner
      systemNotes: v.optional(v.string()),      // Notas do sistema
    })),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_coupon", ["couponId"])
    .index("by_user", ["userId"])
    .index("by_booking", ["bookingId", "bookingType"])
    .index("by_coupon_user", ["couponId", "userId"])
    .index("by_status", ["status"])
    .index("by_user_status", ["userId", "status"])
    .index("by_applied_at", ["appliedAt"])
    .index("by_coupon_status", ["couponId", "status"]),

  // Validações de cupons (para controle de uso por usuário)
  couponValidations: defineTable({
    couponId: v.id("coupons"),                  // Referência ao cupom
    userId: v.id("users"),                      // Usuário
    
    // Controle de uso
    usageCount: v.number(),                     // Quantas vezes este usuário usou
    lastUsedAt: v.optional(v.number()),         // Última vez que usou
    
    // Elegibilidade
    isEligible: v.boolean(),                    // Se o usuário é elegível
    eligibilityCheckedAt: v.number(),           // Última verificação de elegibilidade
    
    // Restrições específicas
    restrictionReasons: v.array(v.string()),    // Motivos de restrição
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_coupon_user", ["couponId", "userId"])
    .index("by_user", ["userId"])
    .index("by_coupon", ["couponId"])
    .index("by_eligibility", ["isEligible"])
    .index("by_last_used", ["lastUsedAt"]),

  // Logs de auditoria específicos para cupons
  couponAuditLogs: defineTable({
    couponId: v.id("coupons"),                  // Referência ao cupom
    actionType: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("activated"),
      v.literal("deactivated"),
      v.literal("deleted"),
      v.literal("applied"),
      v.literal("refunded"),
      v.literal("expired"),
      v.literal("usage_limit_reached")
    ),
    
    // Contexto da ação
    performedBy: v.id("users"),                 // Quem executou a ação
    performedAt: v.number(),                    // Timestamp da ação
    
    // Dados da ação
    actionData: v.optional(v.object({
      oldValues: v.optional(v.any()),           // Valores anteriores
      newValues: v.optional(v.any()),           // Novos valores
      affectedBookingId: v.optional(v.string()), // ID da reserva afetada
      affectedUserId: v.optional(v.id("users")), // Usuário afetado
      reason: v.optional(v.string()),           // Motivo da ação
      metadata: v.optional(v.any()),            // Metadados adicionais
    })),
    
    // Contexto do sistema
    ipAddress: v.optional(v.string()),          // IP de onde veio a ação
    userAgent: v.optional(v.string()),          // User agent
    sessionId: v.optional(v.string()),          // ID da sessão
    
    // Timestamps
    createdAt: v.number(),
  })
    .index("by_coupon", ["couponId"])
    .index("by_action_type", ["actionType"])
    .index("by_performed_by", ["performedBy"])
    .index("by_performed_at", ["performedAt"])
    .index("by_coupon_action", ["couponId", "actionType"])
    .index("by_coupon_performed_at", ["couponId", "performedAt"]),

  // Voucher System Tables
  vouchers: defineTable({
    // Identification
    voucherNumber: v.string(),        // Format: VCH-YYYYMMDD-XXXX
    code: v.string(),                 // Same as voucherNumber, for compatibility
    qrCode: v.string(),               // QR code content/URL
    
    // Booking Reference
    bookingId: v.string(),            // Unified booking ID as string (support for different types)
    bookingType: v.union(v.literal("activity"), v.literal("event"), v.literal("restaurant"), v.literal("vehicle"), v.literal("package"), v.literal("admin_reservation")),
    
    // Voucher Details
    type: v.optional(v.string()),     // Type of voucher
    userId: v.optional(v.id("users")), // User ID
    assetType: v.optional(v.string()), // Asset type
    assetId: v.optional(v.string()),   // Asset ID
    relatedBookingId: v.optional(v.string()), // Related booking ID
    details: v.optional(v.any()),      // Flexible details object
    validFrom: v.optional(v.number()), // Valid from date
    validUntil: v.optional(v.number()), // Valid until date
    
    // Status Management
    status: v.union(v.literal("active"), v.literal("used"), v.literal("cancelled"), v.literal("expired")),
    generatedAt: v.number(),
    expiresAt: v.optional(v.number()),
    usedAt: v.optional(v.number()),
    
    // PDF and Delivery
    pdfUrl: v.optional(v.string()),   // Secure cloud storage URL (deprecated)
    pdfStorageId: v.optional(v.string()), // Convex storage ID for PDF
    emailSent: v.boolean(),
    emailSentAt: v.optional(v.number()),
    downloadCount: v.number(),
    
    // Verification
    verificationToken: v.string(),    // For QR code security
    lastScannedAt: v.optional(v.number()),
    scanCount: v.number(),
    
    // Metadata
    partnerId: v.id("users"),
    customerId: v.id("users"),
    isActive: v.boolean(),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_voucher_number", ["voucherNumber"])
    .index("by_booking", ["bookingId", "bookingType"])
    .index("by_status", ["status", "isActive"])
    .index("by_partner", ["partnerId", "status"])
    .index("by_customer", ["customerId", "status"])
    .index("by_expiration", ["expiresAt", "status"])
    .index("by_verification_token", ["verificationToken"])
    .index("by_generated_at", ["generatedAt"])
    .index("by_partner_type", ["partnerId", "bookingType"]),

  voucherUsageLogs: defineTable({
    voucherId: v.id("vouchers"),
    action: v.union(v.literal("generated"), v.literal("emailed"), v.literal("downloaded"), v.literal("scanned"), v.literal("used"), v.literal("cancelled")),
    timestamp: v.number(),
    userId: v.optional(v.id("users")),
    userType: v.optional(v.string()),  // "customer", "partner", "employee", "admin"
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    location: v.optional(v.string()),
    metadata: v.optional(v.string()),  // JSON string for additional context
    
    // Timestamps
    createdAt: v.number(),
  })
    .index("by_voucher", ["voucherId", "timestamp"])
    .index("by_action", ["action", "timestamp"])
    .index("by_user", ["userId", "timestamp"])
    .index("by_voucher_action", ["voucherId", "action"])
    .index("by_user_action", ["userId", "action"]),

  voucherTemplates: defineTable({
    name: v.string(),
    assetType: v.string(),
    version: v.string(),
    htmlTemplate: v.string(),         // HTML template content
    cssStyles: v.string(),            // CSS styles
    isActive: v.boolean(),
    isDefault: v.boolean(),
    createdBy: v.id("users"),
    partnerId: v.optional(v.id("users")), // For custom partner templates
    organizationId: v.optional(v.id("partnerOrganizations")),
    metadata: v.optional(v.string()),  // JSON configuration
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_asset_type", ["assetType", "isActive"])
    .index("by_partner", ["partnerId", "isActive"])
    .index("by_version", ["assetType", "version"])
    .index("by_default", ["assetType", "isDefault"])
    .index("by_organization", ["organizationId", "assetType"]),

  // Admin Reservation System Tables
  adminReservations: defineTable({
    // Basic Information
    id: v.optional(v.string()),                    // Optional external ID
    assetId: v.string(),                          // Asset ID
    assetType: v.union(
      v.literal("activities"),
      v.literal("events"),
      v.literal("restaurants"),
      v.literal("vehicles"),

      v.literal("packages")
    ),
    travelerId: v.id("users"),                    // Traveler assigned to this reservation
    adminId: v.id("users"),                       // Admin who created this reservation
    
    // Customer Information
    customerName: v.optional(v.string()),                     // Customer name
    customerEmail: v.optional(v.string()),                    // Customer email
    customerPhone: v.optional(v.string()),                    // Customer phone
    customerDocument: v.optional(v.string()),     // Customer document (CPF, etc)
    
    // Booking Reference
    originalBookingId: v.optional(v.string()),    // Original booking ID if converted from existing
    confirmationCode: v.optional(v.string()),     // Unique confirmation code (optional until confirmed)
    voucherId: v.optional(v.id("vouchers")),      // Associated voucher
    
    // Reservation Details
    reservationDate: v.optional(v.float64()),                  // Main reservation date
    reservationData: v.object({
      // Common fields
      startDate: v.optional(v.number()),          // Start date/time
      endDate: v.optional(v.number()),            // End date/time
      guests: v.optional(v.number()),             // Number of guests
      specialRequests: v.optional(v.string()),    // Special requests
      
      // Asset-specific fields (flexible object)
      assetSpecific: v.optional(v.any()),         // Asset-specific data
    }),
    assetSpecific: v.optional(v.any()),           // Direct asset-specific data
    
    // Creation Method
    createdMethod: v.union(
      v.literal("admin_direct"),                  // Created directly by admin
      v.literal("admin_conversion"),              // Converted from package request
      v.literal("admin_group"),                   // Part of group booking
      v.literal("admin_phone"),                   // Created from phone reservation
      v.literal("admin_walkin")                   // Walk-in reservation
    ),
    
    // Payment Information
    paymentStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("requires_capture"),
      v.literal("succeeded"),
      v.literal("failed"),
      v.literal("completed"),
      v.literal("cash"),
      v.literal("transfer"),
      v.literal("deferred"),
      v.literal("partial"),
      v.literal("refunded"),
      v.literal("cancelled")
    ),
    totalAmount: v.number(),                      // Total reservation amount
    paidAmount: v.optional(v.number()),           // Amount already paid
    paymentMethod: v.optional(v.string()),        // Payment method used
    paymentNotes: v.optional(v.string()),         // Payment-related notes
    
    // Stripe Integration
    stripePaymentIntentId: v.optional(v.string()),
    stripePaymentLinkId: v.optional(v.string()),
    stripePaymentLinkUrl: v.optional(v.string()),
    paymentDueDate: v.optional(v.number()),
    
    // Status Management
    status: v.union(
      v.literal("draft"),
      v.literal("confirmed"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("no_show")
    ),
    
    // Admin Notes and Customer Service
    adminNotes: v.optional(v.string()),           // Internal admin notes
    customerNotes: v.optional(v.string()),        // Notes for customer
    notes: v.optional(v.string()),                // General notes
    internalFlags: v.optional(v.array(v.string())), // Internal flags (VIP, special, etc.)
    
    // Communication
    lastContactedAt: v.optional(v.number()),      // Last customer contact
    reminderSent: v.optional(v.boolean()),        // Whether reminder was sent
    sendNotifications: v.optional(v.boolean()),    // Whether to send notifications
    autoConfirm: v.optional(v.boolean()),         // Whether to auto-confirm
    
    // Audit Trail
    createdBy: v.id("users"),                     // Who created (same as adminId)
    createdByName: v.optional(v.string()),        // Name of who created
    lastModifiedBy: v.optional(v.id("users")),    // Who last modified
    partnerId: v.optional(v.id("users")),         // Partner responsible
    organizationId: v.optional(v.id("partnerOrganizations")), // Organization
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    
    // Soft delete
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_traveler", ["travelerId"])
    .index("by_admin", ["adminId"])
    .index("by_asset", ["assetType", "assetId"])
    .index("by_status", ["status"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_partner", ["partnerId"])
    .index("by_organization", ["organizationId"])
    .index("by_created_method", ["createdMethod"])
    .index("by_confirmation_code", ["confirmationCode"])
    .index("by_traveler_status", ["travelerId", "status"])
    .index("by_admin_status", ["adminId", "status"])
    .index("by_partner_status", ["partnerId", "status"])
    .index("by_created_at", ["createdAt"])
    .index("by_is_active", ["isActive"]),

  // Package Proposals System
  packageProposals: defineTable({
    packageRequestId: v.id("packageRequests"),   // Reference to package request
    adminId: v.id("users"),                       // Admin who created proposal
    proposalNumber: v.string(),                   // Unique proposal number
    
    // Proposal Content
    title: v.string(),                            // Proposal title
    description: v.string(),                      // Detailed description
    summary: v.optional(v.string()),              // Executive summary
    
    // Package Components
    components: v.array(v.object({
      type: v.union(
    
        v.literal("activity"),
        v.literal("event"),
        v.literal("restaurant"),
        v.literal("vehicle"),
        v.literal("transfer"),
        v.literal("guide"),
        v.literal("insurance"),
        v.literal("other")
      ),
      assetId: v.optional(v.string()),            // Asset ID if applicable
      name: v.string(),                           // Component name
      description: v.string(),                    // Component description
      quantity: v.number(),                       // Quantity
      unitPrice: v.number(),                      // Unit price
      totalPrice: v.number(),                     // Total for this component
      included: v.boolean(),                      // Whether included in package
      optional: v.boolean(),                      // Whether optional
      notes: v.optional(v.string()),              // Component notes
    })),
    
    // Pricing
    subtotal: v.number(),                         // Subtotal before taxes/fees
    taxes: v.optional(v.number()),                // Tax amount
    fees: v.optional(v.number()),                 // Additional fees
    discount: v.number(),                         // Discount amount
    totalPrice: v.number(),                       // Final total price
    currency: v.string(),                         // Currency code
    
    // Proposal Terms
    validUntil: v.number(),                       // Proposal expiration
    paymentTerms: v.string(),                     // Payment terms
    cancellationPolicy: v.string(),               // Cancellation policy
    inclusions: v.array(v.string()),              // What's included
    exclusions: v.array(v.string()),              // What's excluded
    
    // Documents and Media
    proposalDocument: v.optional(v.string()),     // Main proposal document storage ID
    attachments: v.array(v.object({
      storageId: v.string(),                      // Convex storage ID
      fileName: v.string(),                       // Original filename
      fileType: v.string(),                       // MIME type
      fileSize: v.number(),                       // File size in bytes
      uploadedAt: v.number(),                     // Upload timestamp
      uploadedBy: v.id("users"),                  // Who uploaded
      description: v.optional(v.string()),        // File description
    })),
    
    // Status and Tracking
    status: v.union(
      v.literal("draft"),
      v.literal("review"),
      v.literal("sent"),
      v.literal("viewed"),
      v.literal("under_negotiation"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired"),
      v.literal("withdrawn")
    ),
    
    // Interaction Tracking
    sentAt: v.optional(v.number()),               // When proposal was sent
    viewedAt: v.optional(v.number()),             // When customer viewed
    respondedAt: v.optional(v.number()),          // When customer responded
    acceptedAt: v.optional(v.number()),           // When accepted
    
    // Negotiation
    negotiationRounds: v.number(),                // Number of negotiation rounds
    customerFeedback: v.optional(v.string()),     // Customer feedback
    adminResponse: v.optional(v.string()),        // Admin response
    
    // Approval Workflow
    requiresApproval: v.boolean(),                // Whether requires approval
    approvalStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    )),
    approvedBy: v.optional(v.id("users")),        // Who approved
    approvedAt: v.optional(v.number()),           // When approved
    approvalNotes: v.optional(v.string()),        // Approval notes
    
    // Conversion Tracking
    convertedToBooking: v.boolean(),              // Whether converted to booking
    bookingId: v.optional(v.string()),            // Booking ID if converted
    convertedAt: v.optional(v.number()),          // When converted
    
    // Metadata
    partnerId: v.optional(v.id("users")),         // Partner responsible
    organizationId: v.optional(v.id("partnerOrganizations")), // Organization
    tags: v.optional(v.array(v.string())),        // Tags for categorization
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    
    // Soft delete
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
    rejectionReason: v.optional(v.string()),
  })
    .index("by_package_request", ["packageRequestId"])
    .index("by_admin", ["adminId"])
    .index("by_status", ["status"])
    .index("by_approval_status", ["approvalStatus"])
    .index("by_partner", ["partnerId"])
    .index("by_organization", ["organizationId"])
    .index("by_proposal_number", ["proposalNumber"])
    .index("by_valid_until", ["validUntil"])
    .index("by_priority", ["priority"])
    .index("by_created_at", ["createdAt"])
    .index("by_conversion_status", ["convertedToBooking"])
    .index("by_partner_status", ["partnerId", "status"])
    .index("by_admin_status", ["adminId", "status"])
    .searchIndex("by_title_description", {
      searchField: "title",
      filterFields: ["description"],
    }),

  // Auto-Confirmation Settings
  autoConfirmationSettings: defineTable({
    // Asset Reference
    assetId: v.string(),                          // Asset ID
    assetType: v.union(
      v.literal("activities"),
      v.literal("events"),
      v.literal("restaurants"),
      v.literal("vehicles"),
      v.literal("accommodations")
    ),
    partnerId: v.id("users"),                     // Partner who owns this setting
    organizationId: v.optional(v.id("partnerOrganizations")), // Organization
    
    // Basic Settings
    enabled: v.boolean(),                         // Whether auto-confirmation is enabled
    name: v.string(),                             // Setting name/description
    priority: v.number(),                         // Priority order (lower = higher priority)
    
    // Conditions
    conditions: v.object({
      // Time-based conditions
      timeRestrictions: v.object({
        enableTimeRestrictions: v.boolean(),
        allowedDaysOfWeek: v.array(v.number()),   // 0-6 (Sunday-Saturday)
        allowedHours: v.object({
          start: v.string(),                      // "09:00"
          end: v.string(),                        // "17:00"
        }),
        timezone: v.string(),                     // Timezone identifier
      }),
      
      // Amount-based conditions
      amountThresholds: v.object({
        enableAmountThresholds: v.boolean(),
        minAmount: v.optional(v.number()),        // Minimum booking amount
        maxAmount: v.optional(v.number()),        // Maximum booking amount
      }),
      
      // Customer-based conditions
      customerTypeFilters: v.object({
        enableCustomerFilters: v.boolean(),
        allowedCustomerTypes: v.array(v.string()), // ["new", "returning", "vip"]
        minBookingHistory: v.optional(v.number()), // Minimum previous bookings
        blacklistedCustomers: v.array(v.id("users")), // Blacklisted customers
      }),
      
      // Booking-specific conditions
      bookingConditions: v.object({
        enableBookingConditions: v.boolean(),
        maxGuestsCount: v.optional(v.number()),   // Maximum guests
        minAdvanceBooking: v.optional(v.number()), // Minimum hours in advance
        maxAdvanceBooking: v.optional(v.number()), // Maximum hours in advance
        allowedPaymentMethods: v.array(v.string()), // Allowed payment methods
      }),
      
      // Availability conditions
      availabilityConditions: v.object({
        enableAvailabilityConditions: v.boolean(),
        requireAvailabilityCheck: v.boolean(),    // Check availability before auto-confirm
        maxOccupancyPercentage: v.optional(v.number()), // Max % of capacity
        bufferTime: v.optional(v.number()),       // Buffer time in minutes
      }),
    }),
    
    // Notification Settings
    notifications: v.object({
      notifyCustomer: v.boolean(),                // Send customer notification
      notifyPartner: v.boolean(),                 // Send partner notification
      notifyEmployees: v.boolean(),               // Send employee notifications
      customMessage: v.optional(v.string()),      // Custom notification message
      emailTemplate: v.optional(v.string()),     // Email template ID
    }),
    
    // Override Settings
    overrideSettings: v.object({
      allowManualOverride: v.boolean(),           // Allow manual override
      overrideRequiresApproval: v.boolean(),      // Override requires approval
      overrideApprovers: v.array(v.id("users")), // Who can approve overrides
    }),
    
    // Statistics
    statistics: v.object({
      totalApplied: v.number(),                   // Total times applied
      totalOverridden: v.number(),                // Total times overridden
      successRate: v.number(),                    // Success rate (0-1)
      lastApplied: v.optional(v.number()),        // Last time applied
    }),
    
    // Metadata
    createdBy: v.id("users"),                     // Who created
    lastModifiedBy: v.optional(v.id("users")),    // Who last modified
    
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    
    // Status
    isActive: v.boolean(),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_asset", ["assetType", "assetId"])
    .index("by_partner", ["partnerId"])
    .index("by_organization", ["organizationId"])
    .index("by_enabled", ["enabled"])
    .index("by_partner_enabled", ["partnerId", "enabled"])
    .index("by_asset_enabled", ["assetType", "assetId", "enabled"])
    .index("by_priority", ["priority"])
    .index("by_created_at", ["createdAt"])
    .index("by_is_active", ["isActive"]),

  // Reservation Change History
  reservationChangeHistory: defineTable({
    // Reference
    reservationId: v.string(),                    // Admin reservation ID or regular booking ID
    reservationType: v.union(
      v.literal("admin_reservation"),
      v.literal("regular_booking")
    ),
    
    // Change Information
    changeType: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("status_changed"),
      v.literal("payment_updated"),
      v.literal("cancelled"),
      v.literal("notes_added")
    ),
    
    // Change Details
    fieldChanged: v.optional(v.string()),         // Field that was changed
    oldValue: v.optional(v.any()),                // Previous value
    newValue: v.optional(v.any()),                // New value
    changeDescription: v.string(),                // Human-readable description
    
    // Actor Information
    changedBy: v.id("users"),                     // Who made the change
    changedByRole: v.string(),                    // Role of the person who made change
    changeReason: v.optional(v.string()),         // Reason for change
    
    // Customer Communication
    customerNotified: v.boolean(),                // Whether customer was notified
    notificationSent: v.boolean(),                // Whether notification was sent
    notificationMethod: v.optional(v.string()),   // Email, SMS, etc.
    
    // Metadata
    ipAddress: v.optional(v.string()),            // IP address of change
    userAgent: v.optional(v.string()),            // User agent
    sessionId: v.optional(v.string()),            // Session ID
    
    // Timestamps
    timestamp: v.number(),
    createdAt: v.number(),
  })
    .index("by_reservation", ["reservationId", "reservationType"])
    .index("by_change_type", ["changeType"])
    .index("by_changed_by", ["changedBy"])
    .index("by_timestamp", ["timestamp"])
    .index("by_reservation_timestamp", ["reservationId", "timestamp"]),

  // Package Proposal Templates
  packageProposalTemplates: defineTable({
    name: v.string(),                               // Template name
    description: v.string(),                        // Template description
    category: v.union(                              // Template category
      v.literal("adventure"),
      v.literal("leisure"),
      v.literal("business"),
      v.literal("family"),
      v.literal("honeymoon"),
      v.literal("luxury"),
      v.literal("budget"),
      v.literal("custom")
    ),
    
    // Template Content
    titleTemplate: v.string(),                      // Template for proposal title with variables
    descriptionTemplate: v.string(),               // Template for proposal description
    summaryTemplate: v.optional(v.string()),       // Template for executive summary
    
    // Default Components
    defaultComponents: v.array(v.object({
      type: v.union(
    
        v.literal("activity"),
        v.literal("event"),
        v.literal("restaurant"),
        v.literal("vehicle"),
        v.literal("transfer"),
        v.literal("guide"),
        v.literal("insurance"),
        v.literal("other")
      ),
      name: v.string(),                             // Component name template
      description: v.string(),                      // Component description template
      quantity: v.number(),                         // Default quantity
      unitPrice: v.number(),                        // Default unit price
      included: v.boolean(),                        // Whether included by default
      optional: v.boolean(),                        // Whether optional by default
      notes: v.optional(v.string()),                // Default notes
    })),
    
    // Default Pricing Configuration
    defaultPricing: v.object({
      taxRate: v.number(),                          // Default tax rate (0.1 for 10%)
      feeRate: v.number(),                          // Default fee rate (0.05 for 5%)
      currency: v.string(),                         // Default currency
    }),
    
    // Default Terms
    paymentTermsTemplate: v.string(),               // Payment terms template
    cancellationPolicyTemplate: v.string(),        // Cancellation policy template
    defaultInclusions: v.array(v.string()),        // Default inclusions
    defaultExclusions: v.array(v.string()),        // Default exclusions
    
    // Template Configuration
    variables: v.array(v.string()),                 // Available variables like {destination}, {duration}
    validityDays: v.number(),                       // Default validity period in days
    requiresApproval: v.boolean(),                  // Whether proposals from this template require approval
    priority: v.union(                              // Default priority level
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    
    // Access Control
    isActive: v.boolean(),                          // Whether template is active
    isPublic: v.boolean(),                          // Whether available to all partners
    partnerId: v.optional(v.id("users")),           // Partner-specific templates (null for system templates)
    organizationId: v.optional(v.id("partnerOrganizations")), // Organization-specific templates
    
    // Metadata
    createdBy: v.id("users"),                       // Who created the template
    updatedBy: v.optional(v.id("users")),           // Who last updated the template
    usageCount: v.number(),                         // How many times template was used
    createdAt: v.number(),                          // Creation timestamp
    updatedAt: v.number(),                          // Last update timestamp
  })
    .index("by_category", ["category"])
    .index("by_partner", ["partnerId"])
    .index("by_organization", ["organizationId"])
    .index("by_active", ["isActive"])
    .index("by_public", ["isPublic"])
    .index("by_category_partner", ["category", "partnerId"])
    .index("by_usage_count", ["usageCount"])
    .index("by_created_at", ["createdAt"]),

  // Partner system tables
  partners,
  partnerFees,
  partnerTransactions,
});
