import { v } from "convex/values";
import { query, mutation, action } from "../../_generated/server";
import { api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

/**
 * Dynamic Pricing Engine for Package Conversion
 * Implements intelligent pricing strategies for package requests and conversions
 */

// Pricing strategy types
const PricingStrategy = v.union(
  v.literal("cost_plus"), // Cost + margin
  v.literal("value_based"), // Based on perceived value
  v.literal("competitive"), // Based on market competition
  v.literal("dynamic"), // AI-driven dynamic pricing
  v.literal("seasonal"), // Season-based pricing
  v.literal("demand_based") // Supply and demand based
);

// Pricing factors structure
const PricingFactors = v.object({
  baseCost: v.number(),
  seasonalMultiplier: v.number(), // 0.8 - 2.0
  demandMultiplier: v.number(), // 0.9 - 1.5
  competitiveAdjustment: v.number(), // -20% to +20%
  valuePerceptionScore: v.number(), // 0-100
  urgencyFactor: v.number(), // 1.0 - 1.3
  groupSizeDiscount: v.number(), // 0% - 15%
  loyaltyDiscount: v.number(), // 0% - 10%
  partnerMargin: v.number(), // 15% - 30%
  platformFee: v.number(), // 5% - 8%
});

// Pricing result structure
const PricingResult = v.object({
  originalPrice: v.number(),
  adjustedPrice: v.number(),
  recommendedPrice: v.number(),
  priceRange: v.object({
    minimum: v.number(),
    maximum: v.number(),
    optimal: v.number(),
  }),
  factors: PricingFactors,
  breakdown: v.object({
    componentCosts: v.number(),
    taxes: v.number(),
    fees: v.number(),
    margin: v.number(),
    discounts: v.number(),
    total: v.number(),
  }),
  strategy: PricingStrategy,
  confidence: v.number(), // 0-100
  reasoning: v.array(v.string()),
  alternatives: v.array(v.object({
    price: v.number(),
    strategy: PricingStrategy,
    description: v.string(),
    confidence: v.number(),
  })),
});

// Market conditions structure
const MarketConditions = v.object({
  seasonality: v.union(
    v.literal("peak"),
    v.literal("high"),
    v.literal("medium"),
    v.literal("low"),
    v.literal("off_peak")
  ),
  demand: v.union(
    v.literal("very_high"),
    v.literal("high"),
    v.literal("medium"),
    v.literal("low"),
    v.literal("very_low")
  ),
  competition: v.union(
    v.literal("intense"),
    v.literal("moderate"),
    v.literal("light"),
    v.literal("minimal")
  ),
  inventoryLevel: v.number(), // 0-100 percentage
  bookingTrend: v.union(
    v.literal("increasing"),
    v.literal("stable"),
    v.literal("decreasing")
  ),
});

/**
 * Calculate dynamic pricing for a package request
 */
export const calculateDynamicPricing = action({
  args: {
    requestId: v.id("packageRequests"),
    packageComponents: v.optional(v.array(v.object({
      type: v.string(),
      basePrice: v.number(),
      quantity: v.number(),
    }))),
    strategy: v.optional(PricingStrategy),
    targetMargin: v.optional(v.number()),
  },
  returns: PricingResult,
  handler: async (ctx, args) => {
    const { requestId, packageComponents, strategy = "dynamic", targetMargin = 0.25 } = args;

    // Get package request details
    const request = await ctx.runQuery(api.domains.packages.queries.getPackageRequestDetails, {
      requestId
    });

    if (!request) {
      throw new Error("Package request not found");
    }

    // Get market conditions
    const marketConditions = await getMarketConditions(ctx, request);

    // Calculate base cost
    const baseCost = packageComponents 
      ? packageComponents.reduce((sum, comp) => sum + (comp.basePrice * comp.quantity), 0)
      : estimateBaseCostFromRequest(request);

    // Calculate pricing factors
    const factors = await calculatePricingFactors(ctx, request, marketConditions, baseCost);

    // Apply pricing strategy
    const pricingResult = await applyPricingStrategy(
      strategy, 
      baseCost, 
      factors, 
      targetMargin, 
      request, 
      marketConditions
    );

    return pricingResult;
  },
});

/**
 * Get current market conditions
 */
async function getMarketConditions(ctx: any, request: any): Promise<any> {
  const currentDate = new Date();
  const month = currentDate.getMonth();
  const destination = request.tripDetails.destination.toLowerCase();

  // Determine seasonality (simplified for Fernando de Noronha)
  let seasonality: "peak" | "high" | "medium" | "low" | "off_peak";
  
  if ([11, 0, 1].includes(month)) { // Dec, Jan, Feb
    seasonality = "peak";
  } else if ([6, 7].includes(month)) { // Jul, Aug
    seasonality = "high";
  } else if ([2, 3, 10].includes(month)) { // Mar, Apr, Nov
    seasonality = "medium";
  } else if ([4, 5, 8, 9].includes(month)) { // May, Jun, Sep, Oct
    seasonality = "low";
  } else {
    seasonality = "off_peak";
  }

  // Get booking data to determine demand (simplified)
  const recentBookings = await ctx.db
    .query("packageRequests")
    .withIndex("by_created_date", (q) => 
      q.gte("createdAt", Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
    )
    .collect();

  let demand: "very_high" | "high" | "medium" | "low" | "very_low";
  if (recentBookings.length > 50) demand = "very_high";
  else if (recentBookings.length > 30) demand = "high";
  else if (recentBookings.length > 15) demand = "medium";
  else if (recentBookings.length > 5) demand = "low";
  else demand = "very_low";

  // Mock other market conditions
  return {
    seasonality,
    demand,
    competition: "moderate" as const,
    inventoryLevel: 75, // 75% availability
    bookingTrend: "stable" as const,
  };
}

/**
 * Calculate pricing factors
 */
async function calculatePricingFactors(
  ctx: any, 
  request: any, 
  marketConditions: any, 
  baseCost: number
): Promise<any> {
  const factors = {
    baseCost,
    seasonalMultiplier: 1.0,
    demandMultiplier: 1.0,
    competitiveAdjustment: 0,
    valuePerceptionScore: 70, // Default
    urgencyFactor: 1.0,
    groupSizeDiscount: 0,
    loyaltyDiscount: 0,
    partnerMargin: 0.20, // 20%
    platformFee: 0.06, // 6%
  };

  // Seasonal multiplier
  switch (marketConditions.seasonality) {
    case "peak":
      factors.seasonalMultiplier = 1.8;
      break;
    case "high":
      factors.seasonalMultiplier = 1.4;
      break;
    case "medium":
      factors.seasonalMultiplier = 1.1;
      break;
    case "low":
      factors.seasonalMultiplier = 0.9;
      break;
    case "off_peak":
      factors.seasonalMultiplier = 0.8;
      break;
  }

  // Demand multiplier
  switch (marketConditions.demand) {
    case "very_high":
      factors.demandMultiplier = 1.3;
      break;
    case "high":
      factors.demandMultiplier = 1.15;
      break;
    case "medium":
      factors.demandMultiplier = 1.0;
      break;
    case "low":
      factors.demandMultiplier = 0.95;
      break;
    case "very_low":
      factors.demandMultiplier = 0.85;
      break;
  }

  // Group size discount
  const groupSize = request.tripDetails.groupSize;
  if (groupSize >= 8) factors.groupSizeDiscount = 0.15; // 15% discount
  else if (groupSize >= 6) factors.groupSizeDiscount = 0.10; // 10% discount
  else if (groupSize >= 4) factors.groupSizeDiscount = 0.05; // 5% discount

  // Value perception based on budget and preferences
  const budget = request.tripDetails.budget;
  const requestedActivities = request.preferences.activities.length;
  
  if (budget > 5000 && requestedActivities >= 3) {
    factors.valuePerceptionScore = 90; // High-value customer
  } else if (budget > 2000 && requestedActivities >= 2) {
    factors.valuePerceptionScore = 75; // Medium-value customer
  } else if (budget < 1000) {
    factors.valuePerceptionScore = 50; // Budget-conscious customer
  }

  // Urgency factor (based on booking advance)
  const tripStart = request.tripDetails.startDate ? new Date(request.tripDetails.startDate) : null;
  if (tripStart) {
    const daysUntilTrip = Math.ceil((tripStart.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilTrip <= 7) factors.urgencyFactor = 1.2; // Last minute
    else if (daysUntilTrip <= 14) factors.urgencyFactor = 1.1; // Short notice
    else if (daysUntilTrip >= 60) factors.urgencyFactor = 0.95; // Early booking discount
  }

  // Check for returning customer (simplified)
  const customerEmail = request.customerInfo.email;
  const previousRequests = await ctx.db.query("packageRequests")
    .filter((q: any) => q.eq(q.field("customerInfo.email"), customerEmail))
    .collect();
  
  if (previousRequests.length > 1) {
    factors.loyaltyDiscount = 0.05; // 5% loyalty discount
  }

  return factors;
}

/**
 * Apply specific pricing strategy
 */
async function applyPricingStrategy(
  strategy: string,
  baseCost: number,
  factors: any,
  targetMargin: number,
  request: any,
  marketConditions: any
): Promise<any> {
  let originalPrice = baseCost;
  let adjustedPrice = baseCost;
  let confidence = 70;
  const reasoning: string[] = [];

  switch (strategy) {
    case "cost_plus":
      adjustedPrice = applyCostPlusStrategy(baseCost, factors, targetMargin);
      confidence = 85;
      reasoning.push("Estratégia cost-plus aplicada com margem definida");
      break;

    case "value_based":
      adjustedPrice = applyValueBasedStrategy(baseCost, factors, request);
      confidence = 75;
      reasoning.push("Preço baseado no valor percebido pelo cliente");
      break;

    case "competitive":
      adjustedPrice = applyCompetitiveStrategy(baseCost, factors, marketConditions);
      confidence = 80;
      reasoning.push("Preço ajustado com base na concorrência");
      break;

    case "seasonal":
      adjustedPrice = applySeasonalStrategy(baseCost, factors, marketConditions);
      confidence = 90;
      reasoning.push("Preço ajustado para sazonalidade atual");
      break;

    case "demand_based":
      adjustedPrice = applyDemandBasedStrategy(baseCost, factors, marketConditions);
      confidence = 85;
      reasoning.push("Preço baseado na demanda atual");
      break;

    case "dynamic":
    default:
      adjustedPrice = applyDynamicStrategy(baseCost, factors, marketConditions, request);
      confidence = 95;
      reasoning.push("Estratégia dinâmica considerando múltiplos fatores");
      break;
  }

  // Apply discounts
  const discountAmount = adjustedPrice * (factors.groupSizeDiscount + factors.loyaltyDiscount);
  adjustedPrice -= discountAmount;

  // Calculate price range
  const priceRange = {
    minimum: adjustedPrice * 0.85,
    maximum: adjustedPrice * 1.25,
    optimal: adjustedPrice,
  };

  // Calculate breakdown
  const taxes = adjustedPrice * 0.10; // 10% taxes
  const platformFees = adjustedPrice * factors.platformFee;
  const partnerMargin = adjustedPrice * factors.partnerMargin;
  const componentCosts = adjustedPrice - taxes - platformFees - partnerMargin;

  const breakdown = {
    componentCosts,
    taxes,
    fees: platformFees,
    margin: partnerMargin,
    discounts: discountAmount,
    total: adjustedPrice + taxes + platformFees,
  };

  // Generate alternative pricing strategies
  const alternatives = [
    {
      price: applyCostPlusStrategy(baseCost, factors, targetMargin),
      strategy: "cost_plus" as const,
      description: "Preço com margem fixa",
      confidence: 85,
    },
    {
      price: applyValueBasedStrategy(baseCost, factors, request),
      strategy: "value_based" as const,
      description: "Preço baseado em valor",
      confidence: 75,
    },
    {
      price: applySeasonalStrategy(baseCost, factors, marketConditions),
      strategy: "seasonal" as const,
      description: "Preço sazonal",
      confidence: 90,
    },
  ];

  // Add specific reasoning based on factors
  if (factors.seasonalMultiplier > 1.2) {
    reasoning.push("Preço aumentado devido à alta temporada");
  }
  if (factors.demandMultiplier > 1.1) {
    reasoning.push("Preço ajustado devido à alta demanda");
  }
  if (factors.groupSizeDiscount > 0) {
    reasoning.push(`Desconto de ${(factors.groupSizeDiscount * 100).toFixed(0)}% aplicado para grupo`);
  }
  if (factors.loyaltyDiscount > 0) {
    reasoning.push("Desconto de fidelidade aplicado");
  }

  return {
    originalPrice,
    adjustedPrice,
    recommendedPrice: adjustedPrice,
    priceRange,
    factors,
    breakdown,
    strategy: strategy as any,
    confidence,
    reasoning,
    alternatives: alternatives.filter(alt => alt.strategy !== strategy),
  };
}

/**
 * Cost-plus pricing strategy
 */
function applyCostPlusStrategy(baseCost: number, factors: any, targetMargin: number): number {
  return baseCost * (1 + targetMargin + factors.partnerMargin + factors.platformFee);
}

/**
 * Value-based pricing strategy
 */
function applyValueBasedStrategy(baseCost: number, factors: any, request: any): number {
  const valueMultiplier = factors.valuePerceptionScore / 100;
  const budgetRatio = Math.min(request.tripDetails.budget / baseCost, 2.0);
  return baseCost * (1 + 0.3) * valueMultiplier * Math.sqrt(budgetRatio);
}

/**
 * Competitive pricing strategy
 */
function applyCompetitiveStrategy(baseCost: number, factors: any, marketConditions: any): number {
  let competitiveAdjustment = 0;
  
  switch (marketConditions.competition) {
    case "intense":
      competitiveAdjustment = -0.15; // 15% below market
      break;
    case "moderate":
      competitiveAdjustment = -0.05; // 5% below market
      break;
    case "light":
      competitiveAdjustment = 0.05; // 5% above market
      break;
    case "minimal":
      competitiveAdjustment = 0.15; // 15% above market
      break;
  }

  return baseCost * (1 + 0.25 + competitiveAdjustment); // 25% base margin + competitive adjustment
}

/**
 * Seasonal pricing strategy
 */
function applySeasonalStrategy(baseCost: number, factors: any, marketConditions: any): number {
  return baseCost * factors.seasonalMultiplier * (1 + 0.2); // 20% base margin + seasonal adjustment
}

/**
 * Demand-based pricing strategy
 */
function applyDemandBasedStrategy(baseCost: number, factors: any, marketConditions: any): number {
  const inventoryFactor = 1 + ((100 - marketConditions.inventoryLevel) / 100) * 0.3; // Up to 30% increase for low inventory
  return baseCost * factors.demandMultiplier * inventoryFactor * (1 + 0.25);
}

/**
 * Dynamic pricing strategy (combines multiple factors)
 */
function applyDynamicStrategy(baseCost: number, factors: any, marketConditions: any, request: any): number {
  // Base price with margin
  let price = baseCost * (1 + factors.partnerMargin + factors.platformFee);

  // Apply market factors
  price *= factors.seasonalMultiplier;
  price *= factors.demandMultiplier;
  price *= factors.urgencyFactor;

  // Apply value perception
  const valueAdjustment = (factors.valuePerceptionScore - 70) / 100; // Adjust based on value perception
  price *= (1 + valueAdjustment * 0.2); // Up to 20% adjustment

  // Inventory adjustment
  const inventoryFactor = 1 + ((100 - marketConditions.inventoryLevel) / 100) * 0.15;
  price *= inventoryFactor;

  return price;
}

/**
 * Estimate base cost from package request
 */
function estimateBaseCostFromRequest(request: any): number {
  const { tripDetails, preferences } = request;
  let estimatedCost = 0;

  // Base accommodation cost (60% of budget estimate)
  estimatedCost += (tripDetails.budget * 0.6) / tripDetails.duration * tripDetails.duration;

  // Activity costs (30% of budget estimate)
  const activityCount = Math.min(preferences.activities.length, 3);
  estimatedCost += (tripDetails.budget * 0.3) * (activityCount / 3);

  // Vehicle cost if requested (10% of budget estimate)
  if (preferences.transportation.length > 0) {
    estimatedCost += tripDetails.budget * 0.1;
  }

  // Adjust for group size
  if (tripDetails.groupSize > 2) {
    estimatedCost *= Math.sqrt(tripDetails.groupSize / 2); // Economies of scale
  }

  return Math.max(estimatedCost, tripDetails.budget * 0.7); // At least 70% of requested budget
}

/**
 * Get pricing recommendations for a package request
 */
export const getPricingRecommendations = query({
  args: {
    requestId: v.id("packageRequests"),
  },
  returns: v.object({
    recommendations: v.array(v.object({
      strategy: PricingStrategy,
      price: v.number(),
      confidence: v.number(),
      description: v.string(),
      pros: v.array(v.string()),
      cons: v.array(v.string()),
    })),
    marketInsights: v.object({
      seasonality: v.string(),
      demand: v.string(),
      recommendedStrategy: PricingStrategy,
    }),
  }),
  handler: async (ctx, args) => {
    // Mock implementation - in real system would analyze market data
    const recommendations = [
      {
        strategy: "dynamic" as const,
        price: 2850,
        confidence: 95,
        description: "Preço inteligente baseado em múltiplos fatores",
        pros: ["Maximiza revenue", "Considera todos os fatores", "Altamente preciso"],
        cons: ["Complexo de explicar"],
      },
      {
        strategy: "value_based" as const,
        price: 2650,
        confidence: 80,
        description: "Preço baseado no valor percebido pelo cliente",
        pros: ["Foca na satisfação", "Bom para fidelização", "Justificável"],
        cons: ["Pode deixar dinheiro na mesa"],
      },
      {
        strategy: "competitive" as const,
        price: 2750,
        confidence: 85,
        description: "Preço competitivo com o mercado",
        pros: ["Competitivo", "Fácil de justificar", "Seguro"],
        cons: ["Não considera valor único"],
      },
    ];

    const marketInsights = {
      seasonality: "Alta temporada - demanda elevada",
      demand: "Demanda alta para Fernando de Noronha",
      recommendedStrategy: "dynamic" as const,
    };

    return {
      recommendations,
      marketInsights,
    };
  },
});

/**
 * Calculate pricing sensitivity analysis
 */
export const calculatePricingSensitivity = action({
  args: {
    requestId: v.id("packageRequests"),
    pricePoints: v.array(v.number()),
  },
  returns: v.object({
    analysis: v.array(v.object({
      price: v.number(),
      conversionProbability: v.number(),
      expectedRevenue: v.number(),
      competitivePosition: v.string(),
    })),
    optimalPrice: v.number(),
    priceElasticity: v.number(),
  }),
  handler: async (ctx, args) => {
    const { requestId, pricePoints } = args;

    const request = await ctx.runQuery(api.domains.packages.queries.getPackageRequestDetails, {
      requestId
    });

    if (!request) {
      throw new Error("Package request not found");
    }

    const customerBudget = request.tripDetails.budget;
    const analysis = pricePoints.map(price => {
      // Calculate conversion probability based on price vs budget
      const budgetRatio = price / customerBudget;
      let conversionProbability = 0;

      if (budgetRatio <= 0.8) conversionProbability = 95;
      else if (budgetRatio <= 0.9) conversionProbability = 85;
      else if (budgetRatio <= 1.0) conversionProbability = 75;
      else if (budgetRatio <= 1.1) conversionProbability = 60;
      else if (budgetRatio <= 1.2) conversionProbability = 40;
      else if (budgetRatio <= 1.3) conversionProbability = 25;
      else conversionProbability = 10;

      // Adjust for budget flexibility
      if (request.tripDetails.budgetFlexibility === "very_flexible") {
        conversionProbability = Math.min(100, conversionProbability + 15);
      } else if (request.tripDetails.budgetFlexibility === "flexible") {
        conversionProbability = Math.min(100, conversionProbability + 8);
      }

      const expectedRevenue = price * (conversionProbability / 100);

      let competitivePosition = "";
      if (budgetRatio <= 0.9) competitivePosition = "Muito competitivo";
      else if (budgetRatio <= 1.0) competitivePosition = "Competitivo";
      else if (budgetRatio <= 1.1) competitivePosition = "Premium";
      else competitivePosition = "Muito caro";

      return {
        price,
        conversionProbability,
        expectedRevenue,
        competitivePosition,
      };
    });

    // Find optimal price (maximum expected revenue)
    const optimalPoint = analysis.reduce((max, current) => 
      current.expectedRevenue > max.expectedRevenue ? current : max
    );

    // Calculate price elasticity (simplified)
    const priceElasticity = -1.5; // Typical value for luxury travel

    return {
      analysis,
      optimalPrice: optimalPoint.price,
      priceElasticity,
    };
  },
});

/**
 * Get pricing history and trends
 */
export const getPricingTrends = query({
  args: {
    destination: v.optional(v.string()),
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d"),
      v.literal("1y")
    )),
  },
  returns: v.object({
    averagePrice: v.number(),
    priceRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    seasonalTrends: v.array(v.object({
      month: v.string(),
      averagePrice: v.number(),
      demandLevel: v.string(),
    })),
    recommendations: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    // Mock implementation - in real system would analyze historical data
    return {
      averagePrice: 2500,
      priceRange: {
        min: 1500,
        max: 4500,
      },
      seasonalTrends: [
        { month: "Jan", averagePrice: 3200, demandLevel: "high" },
        { month: "Feb", averagePrice: 3100, demandLevel: "high" },
        { month: "Mar", averagePrice: 2800, demandLevel: "medium" },
        { month: "Apr", averagePrice: 2400, demandLevel: "medium" },
        { month: "May", averagePrice: 2200, demandLevel: "low" },
        { month: "Jun", averagePrice: 2300, demandLevel: "low" },
        { month: "Jul", averagePrice: 2900, demandLevel: "high" },
        { month: "Aug", averagePrice: 2800, demandLevel: "medium" },
        { month: "Sep", averagePrice: 2200, demandLevel: "low" },
        { month: "Oct", averagePrice: 2400, demandLevel: "medium" },
        { month: "Nov", averagePrice: 2700, demandLevel: "medium" },
        { month: "Dec", averagePrice: 3300, demandLevel: "high" },
      ],
      recommendations: [
        "Dezembro e Janeiro são os meses de maior demanda",
        "Maio e Setembro oferecem melhores oportunidades de preços baixos",
        "Considere estratégia de preços dinâmicos para maximizar revenue",
      ],
    };
  },
});