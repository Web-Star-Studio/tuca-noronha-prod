import { v } from "convex/values";
import { query, mutation, action } from "../../_generated/server";
import { api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
// RBAC functions called via queries from actions

/**
 * Custom Package Builder System
 * Allows admins to create custom packages from package requests using intelligent suggestions
 */

// Package component types
const PackageComponentType = v.union(
  v.literal("accommodation"),
  v.literal("activity"),
  v.literal("restaurant"),
  v.literal("vehicle"),
  v.literal("event"),
  v.literal("transfer"),
  v.literal("guide"),
  v.literal("insurance"),
  v.literal("custom_service")
);

// Package component structure
const PackageComponent = v.object({
  id: v.string(),
  type: PackageComponentType,
  assetId: v.optional(v.id("activities")), // Will be generic ID in real implementation
  name: v.string(),
  description: v.string(),
  quantity: v.number(),
  basePrice: v.number(),
  adjustedPrice: v.optional(v.number()),
  isOptional: v.boolean(),
  day: v.optional(v.number()), // Which day of the package
  timeSlot: v.optional(v.string()),
  notes: v.optional(v.string()),
  metadata: v.optional(v.object({
    duration: v.optional(v.number()),
    capacity: v.optional(v.number()),
    location: v.optional(v.string()),
    requirements: v.optional(v.array(v.string())),
  })),
});

// Custom package structure
const CustomPackageBuilder = v.object({
  id: v.string(),
  requestId: v.id("packageRequests"),
  adminId: v.id("users"),
  title: v.string(),
  description: v.string(),
  components: v.array(PackageComponent),
  pricing: v.object({
    subtotal: v.number(),
    taxes: v.number(),
    fees: v.number(),
    discounts: v.number(),
    total: v.number(),
    commission: v.optional(v.number()),
    partnerRevenue: v.optional(v.number()),
  }),
  itinerary: v.array(v.object({
    day: v.number(),
    title: v.string(),
    description: v.string(),
    components: v.array(v.string()), // Component IDs
    estimatedTime: v.optional(v.string()),
    location: v.optional(v.string()),
  })),
  terms: v.object({
    cancellationPolicy: v.string(),
    paymentTerms: v.string(),
    inclusions: v.array(v.string()),
    exclusions: v.array(v.string()),
    requirements: v.array(v.string()),
  }),
  status: v.union(
    v.literal("draft"),
    v.literal("in_review"),
    v.literal("approved"),
    v.literal("sent_to_customer"),
    v.literal("customer_approved"),
    v.literal("converted_to_package"),
    v.literal("rejected")
  ),
  validUntil: v.number(),
  estimatedDeliveryDays: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

/**
 * Initialize custom package builder from a package request
 */
export const initializeCustomPackageBuilder = action({
  args: {
    requestId: v.id("packageRequests"),
  },
  returns: v.object({
    success: v.boolean(),
    builderId: v.optional(v.string()),
    suggestions: v.optional(v.object({
      components: v.array(PackageComponent),
      estimatedPrice: v.number(),
      estimatedDuration: v.number(),
    })),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get current user info
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        message: "Acesso negado. Usuário não autenticado.",
      };
    }

    const currentUser = await ctx.runQuery(api.domains.users.queries.getCurrentUser);
    if (!currentUser) {
      return {
        success: false,
        message: "Usuário não encontrado.",
      };
    }

    const userId = currentUser._id;
    const userRole = currentUser.role;

    // Verify admin permissions
    if (!["master", "partner", "employee"].includes(userRole || "")) {
      return {
        success: false,
        message: "Acesso negado. Apenas admins podem criar pacotes personalizados.",
      };
    }

    // Get package request details
    const request = await ctx.runQuery(api.domains.packages.queries.getPackageRequestDetails, {
      requestId: args.requestId
    });

    if (!request) {
      return {
        success: false,
        message: "Solicitação de pacote não encontrada.",
      };
    }

    try {
      // Generate intelligent suggestions based on request
      const suggestions = await generatePackageSuggestions(ctx, request);

      // Create draft package builder
      const builderId = `PKG_BUILD_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const customPackage = {
        id: builderId,
        requestId: args.requestId,
        adminId: userId,
        title: `Pacote Personalizado - ${request.customerInfo.name}`,
        description: `Pacote personalizado para ${request.tripDetails.destination} - ${request.tripDetails.duration} dias`,
        components: suggestions.components,
        pricing: {
          subtotal: suggestions.estimatedPrice,
          taxes: suggestions.estimatedPrice * 0.1, // 10% tax
          fees: suggestions.estimatedPrice * 0.05, // 5% service fee
          discounts: 0,
          total: suggestions.estimatedPrice * 1.15,
          commission: suggestions.estimatedPrice * 0.15,
          partnerRevenue: suggestions.estimatedPrice * 0.85,
        },
        itinerary: generateBasicItinerary(suggestions.components, request.tripDetails.duration),
        terms: generateDefaultTerms(),
        status: "draft" as const,
        validUntil: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days
        estimatedDeliveryDays: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // In a real implementation, this would be stored in the database
      // For now, we'll return the structure

      return {
        success: true,
        builderId: builderId,
        suggestions: {
          components: suggestions.components,
          estimatedPrice: suggestions.estimatedPrice,
          estimatedDuration: request.tripDetails.duration,
        },
        message: "Pacote personalizado inicializado com sucesso.",
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao inicializar pacote personalizado: ${error}`,
      };
    }
  },
});

/**
 * Add component to custom package
 */
export const addPackageComponent = mutation({
  args: {
    builderId: v.string(),
    component: PackageComponent,
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    updatedPricing: v.optional(v.object({
      subtotal: v.number(),
      taxes: v.number(),
      fees: v.number(),
      total: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    // Get current user info
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        message: "Acesso negado. Usuário não autenticado.",
      };
    }

    const currentUser = await ctx.runQuery(api.domains.users.queries.getCurrentUser);
    if (!currentUser) {
      return {
        success: false,
        message: "Usuário não encontrado.",
      };
    }

    const userId = currentUser._id;
    
    // In a real implementation, this would:
    // 1. Fetch the builder from database
    // 2. Verify user permissions
    // 3. Add the component
    // 4. Recalculate pricing
    // 5. Update the database

    // Mock response for now
    const newSubtotal = 1500; // Would be calculated
    const newTaxes = newSubtotal * 0.1;
    const newFees = newSubtotal * 0.05;
    const newTotal = newSubtotal + newTaxes + newFees;

    return {
      success: true,
      message: "Componente adicionado com sucesso.",
      updatedPricing: {
        subtotal: newSubtotal,
        taxes: newTaxes,
        fees: newFees,
        total: newTotal,
      },
    };
  },
});

/**
 * Remove component from custom package
 */
export const removePackageComponent = mutation({
  args: {
    builderId: v.string(),
    componentId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    updatedPricing: v.optional(v.object({
      subtotal: v.number(),
      taxes: v.number(),
      fees: v.number(),
      total: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    // Get current user info
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        message: "Acesso negado. Usuário não autenticado.",
      };
    }

    const currentUser = await ctx.runQuery(api.domains.users.queries.getCurrentUser);
    if (!currentUser) {
      return {
        success: false,
        message: "Usuário não encontrado.",
      };
    }

    const userId = currentUser._id;
    
    // Mock implementation
    return {
      success: true,
      message: "Componente removido com sucesso.",
      updatedPricing: {
        subtotal: 1200,
        taxes: 120,
        fees: 60,
        total: 1380,
      },
    };
  },
});

/**
 * Update component in custom package
 */
export const updatePackageComponent = mutation({
  args: {
    builderId: v.string(),
    componentId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      quantity: v.optional(v.number()),
      adjustedPrice: v.optional(v.number()),
      isOptional: v.optional(v.boolean()),
      day: v.optional(v.number()),
      timeSlot: v.optional(v.string()),
      notes: v.optional(v.string()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get current user info
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        message: "Acesso negado. Usuário não autenticado.",
      };
    }

    const currentUser = await ctx.runQuery(api.domains.users.queries.getCurrentUser);
    if (!currentUser) {
      return {
        success: false,
        message: "Usuário não encontrado.",
      };
    }

    const userId = currentUser._id;
    
    // Mock implementation
    return {
      success: true,
      message: "Componente atualizado com sucesso.",
    };
  },
});

/**
 * Get available components for package building
 */
export const getAvailableComponents = query({
  args: {
    type: v.optional(PackageComponentType),
    destination: v.optional(v.string()),
    dateRange: v.optional(v.object({
      startDate: v.string(),
      endDate: v.string(),
    })),
    groupSize: v.optional(v.number()),
    budget: v.optional(v.number()),
  },
  returns: v.object({
    accommodations: v.array(v.any()),
    activities: v.array(v.any()),
    restaurants: v.array(v.any()),
    vehicles: v.array(v.any()),
    events: v.array(v.any()),
    customServices: v.array(v.any()),
  }),
  handler: async (ctx, args) => {
    const { type, destination, dateRange, groupSize, budget } = args;

    // Get available assets (simplified)
    const [accommodations, activities, restaurants, vehicles, events] = await Promise.all([
      ctx.runQuery(api.domains.accommodations.queries.getAccommodations, {
        filters: { isActive: true }
      }),
      ctx.runQuery(api.domains.activities.queries.getActivities, {
        filters: { isActive: true }
      }),
      ctx.runQuery(api.domains.restaurants.queries.getRestaurants, {
        filters: { isActive: true }
      }),
      ctx.runQuery(api.domains.vehicles.queries.getVehicles, {
        filters: { isActive: true }
      }),
      ctx.runQuery(api.domains.events.queries.getEvents, {
        filters: { isActive: true }
      }),
    ]);

    // Filter by criteria if provided
    let filteredAccommodations = accommodations;
    let filteredActivities = activities;
    let filteredRestaurants = restaurants;
    let filteredVehicles = vehicles;
    let filteredEvents = events;

    if (groupSize) {
      filteredAccommodations = accommodations.filter((acc: any) => acc.capacity >= groupSize);
      filteredVehicles = vehicles.filter((veh: any) => veh.passengerCapacity >= groupSize);
    }

    if (budget) {
      const maxPricePerComponent = budget * 0.3; // Max 30% of budget per component
      filteredActivities = activities.filter((act: any) => act.price <= maxPricePerComponent);
      filteredAccommodations = accommodations.filter((acc: any) => acc.pricePerNight <= maxPricePerComponent);
    }

    // Custom services (predefined templates)
    const customServices = [
      {
        id: "transfer_airport",
        name: "Transfer Aeroporto",
        description: "Transfer do aeroporto para hotel e vice-versa",
        basePrice: 150,
        type: "transfer",
      },
      {
        id: "guide_local",
        name: "Guia Local",
        description: "Guia turístico local por meio dia",
        basePrice: 200,
        type: "guide",
      },
      {
        id: "insurance_travel",
        name: "Seguro Viagem",
        description: "Seguro viagem completo",
        basePrice: 50,
        type: "insurance",
      },
    ];

    return {
      accommodations: filteredAccommodations,
      activities: filteredActivities,
      restaurants: filteredRestaurants,
      vehicles: filteredVehicles,
      events: filteredEvents,
      customServices,
    };
  },
});

/**
 * Generate package suggestions based on request
 */
async function generatePackageSuggestions(ctx: any, request: any): Promise<{
  components: any[];
  estimatedPrice: number;
}> {
  const components: any[] = [];
  let estimatedPrice = 0;

  const { tripDetails, preferences } = request;
  const budgetPerDay = tripDetails.budget / tripDetails.duration;

  // Suggest accommodation (highest priority)
  if (preferences.accommodationType.length > 0) {
    const accommodations = await ctx.runQuery(api.domains.accommodations.queries.getAccommodations, {
      filters: { isActive: true }
    });

    const suitableAccommodations = accommodations.filter((acc: any) => 
      acc.capacity >= tripDetails.groupSize && 
      acc.pricePerNight <= budgetPerDay * 0.6 // Max 60% of daily budget
    );

    if (suitableAccommodations.length > 0) {
      const selected = suitableAccommodations[0];
      const totalPrice = selected.pricePerNight * tripDetails.duration;
      
      components.push({
        id: `comp_acc_${Date.now()}`,
        type: "accommodation",
        assetId: selected._id,
        name: selected.name,
        description: `${selected.type} para ${tripDetails.duration} noites`,
        quantity: tripDetails.duration,
        basePrice: selected.pricePerNight,
        adjustedPrice: selected.pricePerNight,
        isOptional: false,
        day: 1,
        notes: "Hospedagem principal do pacote",
        metadata: {
          capacity: selected.capacity,
          location: selected.location,
        },
      });

      estimatedPrice += totalPrice;
    }
  }

  // Suggest activities based on preferences
  if (preferences.activities.length > 0) {
    const activities = await ctx.runQuery(api.domains.activities.queries.getActivities, {
      filters: { isActive: true }
    });

    const activityBudget = tripDetails.budget * 0.3; // 30% for activities
    let activitySpent = 0;

    for (let i = 0; i < Math.min(preferences.activities.length, 3); i++) {
      const activityPref = preferences.activities[i];
      const matchingActivities = activities.filter((act: any) =>
        act.title.toLowerCase().includes(activityPref.toLowerCase()) ||
        act.description.toLowerCase().includes(activityPref.toLowerCase())
      );

      if (matchingActivities.length > 0 && activitySpent < activityBudget) {
        const selected = matchingActivities[0];
        const activityPrice = selected.price * tripDetails.groupSize;
        
        if (activitySpent + activityPrice <= activityBudget) {
          components.push({
            id: `comp_act_${Date.now()}_${i}`,
            type: "activity",
            assetId: selected._id,
            name: selected.title,
            description: selected.description,
            quantity: tripDetails.groupSize,
            basePrice: selected.price,
            adjustedPrice: selected.price,
            isOptional: i > 0, // First activity is mandatory, others optional
            day: i + 2, // Spread activities across days
            timeSlot: "morning",
            metadata: {
              duration: selected.duration,
              location: selected.location,
            },
          });

          estimatedPrice += activityPrice;
          activitySpent += activityPrice;
        }
      }
    }
  }

  // Suggest vehicle if transportation preference exists
  if (preferences.transportation.length > 0) {
    const vehicles = await ctx.runQuery(api.domains.vehicles.queries.getVehicles, {
      filters: { isActive: true }
    });

    const suitableVehicles = vehicles.filter((veh: any) => 
      veh.passengerCapacity >= tripDetails.groupSize
    );

    if (suitableVehicles.length > 0) {
      const selected = suitableVehicles[0];
      const vehiclePrice = selected.pricePerDay * tripDetails.duration;
      
      components.push({
        id: `comp_veh_${Date.now()}`,
        type: "vehicle",
        assetId: selected._id,
        name: `${selected.brand} ${selected.model}`,
        description: `Aluguel de veículo por ${tripDetails.duration} dias`,
        quantity: tripDetails.duration,
        basePrice: selected.pricePerDay,
        adjustedPrice: selected.pricePerDay,
        isOptional: true,
        day: 1,
        metadata: {
          capacity: selected.passengerCapacity,
        },
      });

      estimatedPrice += vehiclePrice;
    }
  }

  // Suggest restaurants if food preferences exist
  if (preferences.foodPreferences.length > 0) {
    const restaurants = await ctx.runQuery(api.domains.restaurants.queries.getRestaurants, {
      filters: { isActive: true }
    });

    const matchingRestaurants = restaurants.filter((rest: any) =>
      preferences.foodPreferences.some(pref => 
        rest.cuisine.some((cuisine: string) => 
          cuisine.toLowerCase().includes(pref.toLowerCase())
        )
      )
    );

    if (matchingRestaurants.length > 0) {
      const selected = matchingRestaurants[0];
      const estimatedMealPrice = 80; // Estimated per person per meal
      
      components.push({
        id: `comp_rest_${Date.now()}`,
        type: "restaurant",
        assetId: selected._id,
        name: `Jantar no ${selected.name}`,
        description: `Experiência gastronômica no ${selected.name}`,
        quantity: tripDetails.groupSize,
        basePrice: estimatedMealPrice,
        adjustedPrice: estimatedMealPrice,
        isOptional: true,
        day: 2,
        timeSlot: "evening",
        metadata: {
          location: selected.location,
        },
      });

      estimatedPrice += estimatedMealPrice * tripDetails.groupSize;
    }
  }

  return {
    components,
    estimatedPrice,
  };
}

/**
 * Generate basic itinerary from components
 */
function generateBasicItinerary(components: any[], duration: number): any[] {
  const itinerary: any[] = [];

  for (let day = 1; day <= duration; day++) {
    const dayComponents = components.filter(comp => comp.day === day);
    const dayTitle = day === 1 ? "Chegada" : 
                   day === duration ? "Partida" : 
                   `Dia ${day}`;

    let dayDescription = "";
    if (day === 1) {
      dayDescription = "Chegada ao destino e check-in na hospedagem";
    } else if (day === duration) {
      dayDescription = "Check-out e partida";
    } else {
      dayDescription = `Atividades programadas para o dia ${day}`;
    }

    itinerary.push({
      day,
      title: dayTitle,
      description: dayDescription,
      components: dayComponents.map(comp => comp.id),
      estimatedTime: "Dia inteiro",
    });
  }

  return itinerary;
}

/**
 * Generate default terms and conditions
 */
function generateDefaultTerms(): any {
  return {
    cancellationPolicy: "Cancelamento gratuito até 48h antes da viagem. Após esse período, será cobrada taxa de 50%.",
    paymentTerms: "50% no ato da reserva, 50% até 7 dias antes da viagem.",
    inclusions: [
      "Hospedagem conforme especificado",
      "Atividades incluídas no pacote",
      "Suporte 24h durante a viagem",
      "Seguro básico de viagem",
    ],
    exclusions: [
      "Passagens aéreas",
      "Refeições não especificadas",
      "Gastos pessoais",
      "Gorjetas",
    ],
    requirements: [
      "Documento de identidade válido",
      "Comprovante de vacinação (se aplicável)",
      "Seguro de viagem (recomendado)",
    ],
  };
}

/**
 * Generate package preview for customer
 */
export const generatePackagePreview = action({
  args: {
    builderId: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    preview: v.optional(v.object({
      title: v.string(),
      description: v.string(),
      duration: v.number(),
      groupSize: v.number(),
      totalPrice: v.number(),
      highlights: v.array(v.string()),
      itinerary: v.array(v.any()),
      inclusions: v.array(v.string()),
      terms: v.string(),
    })),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // In a real implementation, this would fetch the builder from database
      // For now, return a mock preview
      
      const preview = {
        title: "Pacote Personalizado Fernando de Noronha",
        description: "Pacote exclusivo criado especialmente para você",
        duration: 5,
        groupSize: 2,
        totalPrice: 3500,
        highlights: [
          "Hospedagem em pousada charmosa",
          "Mergulho com golfinhos",
          "Trilha do Pico",
          "Jantar romântico",
          "Transfer incluso",
        ],
        itinerary: [
          {
            day: 1,
            title: "Chegada",
            description: "Chegada e check-in",
            activities: ["Transfer do aeroporto", "Check-in na pousada"],
          },
          {
            day: 2,
            title: "Mergulho e Exploração",
            description: "Dia de aventuras aquáticas",
            activities: ["Mergulho com golfinhos", "Praia do Sancho"],
          },
        ],
        inclusions: [
          "Hospedagem por 4 noites",
          "Transfer aeroporto-hotel-aeroporto",
          "Mergulho com golfinhos",
          "Trilha guiada",
          "Seguro básico",
        ],
        terms: "Cancelamento gratuito até 48h antes. Pagamento: 50% antecipado, 50% na chegada.",
      };

      return {
        success: true,
        preview,
        message: "Preview gerado com sucesso.",
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao gerar preview: ${error}`,
      };
    }
  },
});

/**
 * Convert custom package to actual package
 */
export const convertToActualPackage = action({
  args: {
    builderId: v.string(),
    packageData: v.object({
      name: v.string(),
      slug: v.string(),
      category: v.string(),
      makePublic: v.boolean(),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    packageId: v.optional(v.id("packages")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get current user info
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        message: "Acesso negado. Usuário não autenticado.",
      };
    }

    const currentUser = await ctx.runQuery(api.domains.users.queries.getCurrentUser);
    if (!currentUser) {
      return {
        success: false,
        message: "Usuário não encontrado.",
      };
    }

    const userId = currentUser._id;
    
    try {
      // In a real implementation, this would:
      // 1. Fetch the custom package builder
      // 2. Create a new package record
      // 3. Create associated bookings
      // 4. Update the package request status
      // 5. Send notifications

      // Mock implementation
      const mockPackageId = "pkg_123" as Id<"packages">;

      return {
        success: true,
        packageId: mockPackageId,
        message: "Pacote personalizado convertido com sucesso!",
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao converter pacote: ${error}`,
      };
    }
  },
});