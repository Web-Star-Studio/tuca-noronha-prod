import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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
    emailVerificationTime: v.optional(v.float64()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    role: v.optional(v.string()),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("clerkId", ["clerkId"]),
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
  })
    .index("by_partner", ["partnerId"])
    .index("featured_activities", ["isFeatured", "isActive"]),
    
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
    partySize: v.int64(),                               // Número de pessoas
    name: v.string(),                                   // Nome do responsável pela reserva
    email: v.string(),                                  // Email de contato
    phone: v.string(),                                  // Telefone de contato
    specialRequests: v.optional(v.string()),            // Solicitações especiais (opcional)
    status: v.string(),                                 // Status (ex: "pending", "confirmed", "canceled")
    confirmationCode: v.string(),                       // Código de confirmação
  })
    .index("by_restaurant", ["restaurantId"])           // Índice por restaurante
    .index("by_user", ["userId"])                       // Índice por usuário
    .index("by_restaurant_date", ["restaurantId", "date"]) // Índice por restaurante e data
    .index("by_status", ["status"]),                    // Índice por status
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
  userPreferences: defineTable({
    userId: v.id("users"),                          // ID do usuário
    tripDuration: v.string(),                       // Duração da viagem
    tripDate: v.string(),                           // Período da viagem
    companions: v.string(),                         // Acompanhantes
    interests: v.array(v.string()),                 // Interesses (praias, mergulho, etc)
    budget: v.number(),                             // Orçamento por pessoa
    preferences: v.object({                         // Preferências específicas
      accommodation: v.string(),                    // Tipo de hospedagem
      dining: v.array(v.string()),                  // Preferências gastronômicas
      activities: v.array(v.string()),              // Atividades preferidas
    }),
    specialRequirements: v.optional(v.string()),    // Requisitos especiais (opcional)
    updatedAt: v.number(),                          // Timestamp da última atualização
  })
    .index("by_user", ["userId"]),                  // Índice por usuário
});
