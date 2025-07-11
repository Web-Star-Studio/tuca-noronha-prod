import { v } from "convex/values";
import { query, internalQuery, action, internalAction } from "../../_generated/server";
import { api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

/**
 * Package Request Analysis System
 * Implements AI-powered analysis of package requests to match them with existing packages
 * and suggest automatic conversion to bookings
 */

// Type definitions for analysis results
const PackageMatchAnalysis = v.object({
  packageId: v.id("packages"),
  packageName: v.string(),
  matchScore: v.number(), // 0-100 percentage match
  matchReasons: v.array(v.string()),
  priceDifference: v.number(), // Difference from requested budget
  availabilityStatus: v.union(
    v.literal("available"),
    v.literal("partially_available"), 
    v.literal("unavailable"),
    v.literal("needs_check")
  ),
  suggestedModifications: v.optional(v.array(v.string())),
});

const RequestAnalysisResult = v.object({
  requestId: v.id("packageRequests"),
  analysisDate: v.number(),
  overallScore: v.number(), // Overall conversion probability 0-100
  topMatches: v.array(PackageMatchAnalysis),
  customPackageSuggestion: v.optional(v.object({
    estimatedPrice: v.number(),
    suggestedComponents: v.array(v.object({
      type: v.union(
        v.literal("accommodation"),
        v.literal("activity"),
        v.literal("restaurant"),
        v.literal("vehicle"),
        v.literal("event")
      ),
      name: v.string(),
      price: v.number(),
      reasoning: v.string(),
    })),
    feasibilityScore: v.number(), // 0-100
  })),
  autoConversionRecommendation: v.union(
    v.literal("high_confidence"), // Can auto-convert
    v.literal("medium_confidence"), // Needs admin review
    v.literal("low_confidence"), // Requires custom package creation
    v.literal("not_recommended") // Complex requirements
  ),
  analysisNotes: v.array(v.string()),
});

/**
 * Analyze a package request to find matching packages and conversion opportunities
 */
export const analyzePackageRequest = action({
  args: {
    requestId: v.id("packageRequests"),
    includeCustomSuggestions: v.optional(v.boolean()),
  },
  returns: RequestAnalysisResult,
  handler: async (ctx, args) => {
    // Get the package request
    const request = await ctx.runQuery(api.domains.packages.queries.getPackageRequestDetails, {
      requestId: args.requestId
    });

    if (!request) {
      throw new Error("Package request not found");
    }

    // Get all available packages for comparison
    const allPackages = await ctx.runQuery(api.domains.packages.queries.getAllPackages);

    // Analyze each package for match potential
    const packageMatches: any[] = [];

    for (const pkg of allPackages) {
      const matchAnalysis = await analyzePackageMatch(ctx, request, pkg);
      if (matchAnalysis.matchScore > 20) { // Only include reasonable matches
        packageMatches.push(matchAnalysis);
      }
    }

    // Sort by match score (highest first)
    packageMatches.sort((a, b) => b.matchScore - a.matchScore);

    // Take top 5 matches
    const topMatches = packageMatches.slice(0, 5);

    // Calculate overall conversion score
    const overallScore = calculateOverallScore(request, topMatches);

    // Generate custom package suggestion if requested
    let customPackageSuggestion;
    if (args.includeCustomSuggestions && topMatches.length === 0) {
      customPackageSuggestion = await generateCustomPackageSuggestion(ctx, request);
    }

    // Determine auto-conversion recommendation
    const autoConversionRecommendation = determineAutoConversionRecommendation(
      overallScore, 
      topMatches,
      request
    );

    // Generate analysis notes
    const analysisNotes = generateAnalysisNotes(request, topMatches, overallScore);

    return {
      requestId: args.requestId,
      analysisDate: Date.now(),
      overallScore,
      topMatches,
      customPackageSuggestion,
      autoConversionRecommendation,
      analysisNotes,
    };
  },
});

/**
 * Analyze how well a specific package matches a request
 */
async function analyzePackageMatch(ctx: any, request: any, pkg: any) {
  let matchScore = 0;
  const matchReasons: string[] = [];
  const suggestedModifications: string[] = [];

  // Destination match (most important factor)
  if (request.tripDetails.destination.toLowerCase().includes(pkg.category.toLowerCase()) ||
      pkg.category.toLowerCase().includes(request.tripDetails.destination.toLowerCase())) {
    matchScore += 30;
    matchReasons.push("Destino compatível");
  }

  // Duration match
  const durationDiff = Math.abs(pkg.duration - request.tripDetails.duration);
  if (durationDiff === 0) {
    matchScore += 20;
    matchReasons.push("Duração exata");
  } else if (durationDiff <= 2) {
    matchScore += 15;
    matchReasons.push("Duração similar");
    if (pkg.duration < request.tripDetails.duration) {
      suggestedModifications.push("Estender pacote por " + durationDiff + " dia(s)");
    } else {
      suggestedModifications.push("Reduzir pacote por " + durationDiff + " dia(s)");
    }
  } else if (durationDiff <= 5) {
    matchScore += 10;
    matchReasons.push("Duração aproximada");
  }

  // Group size match
  if (pkg.maxGuests >= request.tripDetails.groupSize) {
    matchScore += 15;
    matchReasons.push("Comporta o grupo");
  } else {
    matchScore -= 10;
    suggestedModifications.push("Ajustar para " + request.tripDetails.groupSize + " pessoas");
  }

  // Budget analysis
  const budgetDiff = pkg.basePrice - request.tripDetails.budget;
  const budgetPercentage = Math.abs(budgetDiff) / request.tripDetails.budget;

  if (budgetPercentage <= 0.1) { // Within 10%
    matchScore += 20;
    matchReasons.push("Preço muito próximo ao orçamento");
  } else if (budgetPercentage <= 0.2) { // Within 20%
    matchScore += 15;
    matchReasons.push("Preço próximo ao orçamento");
  } else if (budgetPercentage <= 0.5) { // Within 50%
    matchScore += 10;
    matchReasons.push("Preço razoável");
  } else {
    matchScore -= 5;
    if (budgetDiff > 0) {
      suggestedModifications.push("Reduzir custos para atingir orçamento");
    }
  }

  // Activity preferences match
  if (request.preferences.activities.length > 0) {
    const activityKeywords = request.preferences.activities.join(" ").toLowerCase();
    const packageKeywords = (pkg.description + " " + pkg.highlights.join(" ")).toLowerCase();
    
    let activityMatches = 0;
    for (const activity of request.preferences.activities) {
      if (packageKeywords.includes(activity.toLowerCase())) {
        activityMatches++;
      }
    }

    const activityMatchPercentage = activityMatches / request.preferences.activities.length;
    if (activityMatchPercentage >= 0.8) {
      matchScore += 15;
      matchReasons.push("Atividades muito compatíveis");
    } else if (activityMatchPercentage >= 0.5) {
      matchScore += 10;
      matchReasons.push("Atividades compatíveis");
    } else if (activityMatchPercentage >= 0.3) {
      matchScore += 5;
      matchReasons.push("Algumas atividades compatíveis");
    }
  }

  // Accommodation type match
  if (request.preferences.accommodationType.length > 0 && pkg.accommodationId) {
    // This would need to check accommodation type from the database
    matchScore += 5;
    matchReasons.push("Possui hospedagem");
  }

  // Check availability (simplified)
  let availabilityStatus: "available" | "partially_available" | "unavailable" | "needs_check" = "needs_check";
  if (request.tripDetails.startDate && request.tripDetails.endDate) {
    // In a real implementation, this would check actual availability
    availabilityStatus = "available";
    matchScore += 10;
    matchReasons.push("Disponível nas datas solicitadas");
  }

  // Ensure match score doesn't exceed 100
  matchScore = Math.min(100, Math.max(0, matchScore));

  return {
    packageId: pkg._id,
    packageName: pkg.name,
    matchScore,
    matchReasons,
    priceDifference: budgetDiff,
    availabilityStatus,
    suggestedModifications: suggestedModifications.length > 0 ? suggestedModifications : undefined,
  };
}

/**
 * Generate a custom package suggestion based on request preferences
 */
async function generateCustomPackageSuggestion(ctx: any, request: any) {
  const suggestedComponents: any[] = [];
  let estimatedPrice = 0;

  // Get available assets for suggestion
  const activities = await ctx.runQuery(api.domains.activities.queries.getActivities, {
    filters: { isActive: true }
  });
  const accommodations = await ctx.runQuery(api.domains.accommodations.queries.getAccommodations, {
    filters: { isActive: true }
  });
  const restaurants = await ctx.runQuery(api.domains.restaurants.queries.getRestaurants, {
    filters: { isActive: true }
  });
  const vehicles = await ctx.runQuery(api.domains.vehicles.queries.getVehicles, {
    filters: { isActive: true }
  });

  // Suggest accommodation (if requested)
  if (request.preferences.accommodationType.length > 0 && accommodations.length > 0) {
    const budgetPerNight = request.tripDetails.budget / request.tripDetails.duration * 0.6; // 60% of budget for accommodation
    const suitableAccommodations = accommodations.filter((acc: any) => 
      acc.pricePerNight <= budgetPerNight && acc.capacity >= request.tripDetails.groupSize
    );
    
    if (suitableAccommodations.length > 0) {
      const selected = suitableAccommodations[0];
      const totalPrice = selected.pricePerNight * request.tripDetails.duration;
      estimatedPrice += totalPrice;
      suggestedComponents.push({
        type: "accommodation",
        name: selected.name,
        price: totalPrice,
        reasoning: "Hospedagem adequada para o grupo e orçamento",
      });
    }
  }

  // Suggest activities (based on preferences)
  if (request.preferences.activities.length > 0 && activities.length > 0) {
    const activityBudget = request.tripDetails.budget * 0.3; // 30% for activities
    let activitySpent = 0;

    for (const activityPref of request.preferences.activities.slice(0, 3)) {
      const matchingActivities = activities.filter((act: any) =>
        act.title.toLowerCase().includes(activityPref.toLowerCase()) ||
        act.description.toLowerCase().includes(activityPref.toLowerCase())
      );

      if (matchingActivities.length > 0 && activitySpent < activityBudget) {
        const selected = matchingActivities[0];
        const activityPrice = Math.min(selected.price * request.tripDetails.groupSize, activityBudget - activitySpent);
        estimatedPrice += activityPrice;
        activitySpent += activityPrice;
        
        suggestedComponents.push({
          type: "activity",
          name: selected.title,
          price: activityPrice,
          reasoning: `Atividade de ${activityPref} conforme preferências`,
        });
      }
    }
  }

  // Calculate feasibility score
  const budgetUtilization = estimatedPrice / request.tripDetails.budget;
  let feasibilityScore = 100;

  if (budgetUtilization > 1.2) {
    feasibilityScore = 30; // Over budget
  } else if (budgetUtilization > 1.0) {
    feasibilityScore = 60; // Slightly over budget
  } else if (budgetUtilization > 0.8) {
    feasibilityScore = 90; // Good utilization
  } else if (budgetUtilization > 0.5) {
    feasibilityScore = 80; // Conservative
  } else {
    feasibilityScore = 50; // Very conservative
  }

  return {
    estimatedPrice,
    suggestedComponents,
    feasibilityScore,
  };
}

/**
 * Calculate overall conversion score based on various factors
 */
function calculateOverallScore(request: any, matches: any[]) {
  if (matches.length === 0) return 20; // Low score if no matches

  const topMatch = matches[0];
  let score = topMatch.matchScore;

  // Boost score for requests with specific dates
  if (request.tripDetails.startDate && request.tripDetails.endDate) {
    score += 10;
  }

  // Boost score for reasonable budget
  if (request.tripDetails.budget > 500) {
    score += 5;
  }

  // Reduce score for very flexible requirements (harder to match)
  if (request.tripDetails.budgetFlexibility === "very_flexible") {
    score += 5;
  } else if (request.tripDetails.budgetFlexibility === "rigid") {
    score -= 5;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Determine auto-conversion recommendation
 */
function determineAutoConversionRecommendation(
  overallScore: number, 
  matches: any[], 
  request: any
): "high_confidence" | "medium_confidence" | "low_confidence" | "not_recommended" {
  if (matches.length === 0) return "not_recommended";

  const topMatch = matches[0];

  if (overallScore >= 80 && topMatch.matchScore >= 80 && 
      Math.abs(topMatch.priceDifference) / request.tripDetails.budget <= 0.15) {
    return "high_confidence";
  }

  if (overallScore >= 60 && topMatch.matchScore >= 60) {
    return "medium_confidence";
  }

  if (overallScore >= 40) {
    return "low_confidence";
  }

  return "not_recommended";
}

/**
 * Generate analysis notes
 */
function generateAnalysisNotes(request: any, matches: any[], overallScore: number): string[] {
  const notes: string[] = [];

  notes.push(`Analisado em ${new Date().toLocaleDateString('pt-BR')}`);
  notes.push(`Score geral de conversão: ${overallScore}%`);

  if (matches.length > 0) {
    notes.push(`${matches.length} pacote(s) compatível(eis) encontrado(s)`);
    notes.push(`Melhor match: ${matches[0].packageName} (${matches[0].matchScore}% compatibilidade)`);
  } else {
    notes.push("Nenhum pacote existente é compatível - requer pacote personalizado");
  }

  // Budget analysis
  const budget = request.tripDetails.budget;
  if (budget < 500) {
    notes.push("Orçamento baixo - opções limitadas");
  } else if (budget > 5000) {
    notes.push("Orçamento alto - muitas opções premium disponíveis");
  }

  // Flexibility analysis
  if (request.tripDetails.flexibleDates) {
    notes.push("Datas flexíveis facilitam disponibilidade");
  }

  if (request.tripDetails.budgetFlexibility === "very_flexible") {
    notes.push("Flexibilidade de orçamento permite ajustes");
  }

  return notes;
}

/**
 * Get request analysis by ID
 */
export const getRequestAnalysis = query({
  args: { requestId: v.id("packageRequests") },
  returns: v.union(RequestAnalysisResult, v.null()),
  handler: async (ctx, args) => {
    // In a real implementation, this would fetch from a database
    // For now, we'll trigger a new analysis
    return null; // Would return stored analysis
  },
});

/**
 * Mark request for automatic conversion
 */
export const markForAutoConversion = action({
  args: {
    requestId: v.id("packageRequests"),
    selectedPackageId: v.id("packages"),
    conversionNotes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    conversionId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Update the package request status
      await ctx.runMutation(api.domains.packages.mutations.updatePackageRequestStatus, {
        requestId: args.requestId,
        status: "approved",
        adminNotes: `Marcado para conversão automática - Pacote: ${args.selectedPackageId}${args.conversionNotes ? '\nNotas: ' + args.conversionNotes : ''}`,
      });

      // In a real implementation, this would trigger the conversion process
      // For now, we'll just update the status

      return {
        success: true,
        message: "Request marcada para conversão automática",
        conversionId: `CONV-${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao marcar para conversão: ${error}`,
      };
    }
  },
});

/**
 * Get conversion candidates (requests ready for auto-conversion)
 */
export const getConversionCandidates = query({
  args: {
    minScore: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    requestId: v.id("packageRequests"),
    requestNumber: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    destination: v.string(),
    budget: v.number(),
    analysisScore: v.number(),
    topMatchName: v.string(),
    recommendationType: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const { minScore = 60, limit = 20 } = args;

    // Get pending package requests
    const pendingRequests = await ctx.db
      .query("packageRequests")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(limit * 2); // Get more to filter

    // For each request, check if it has analysis and meets criteria
    const candidates: any[] = [];

    for (const request of pendingRequests) {
      // In a real implementation, we'd have stored analysis results
      // For demo purposes, we'll do a quick score estimation
      const quickScore = estimateQuickScore(request);
      
      if (quickScore >= minScore) {
        candidates.push({
          requestId: request._id,
          requestNumber: request.requestNumber,
          customerName: request.customerInfo.name,
          customerEmail: request.customerInfo.email,
          destination: request.tripDetails.destination,
          budget: request.tripDetails.budget,
          analysisScore: quickScore,
          topMatchName: "Pacote Padrão", // Would be from actual analysis
          recommendationType: quickScore >= 80 ? "high_confidence" : 
                             quickScore >= 60 ? "medium_confidence" : "low_confidence",
          createdAt: request._creationTime,
        });
      }
    }

    // Sort by score (highest first)
    candidates.sort((a, b) => b.analysisScore - a.analysisScore);

    return candidates.slice(0, limit);
  },
});

/**
 * Quick score estimation for conversion candidates
 */
function estimateQuickScore(request: any): number {
  let score = 50; // Base score

  // Budget factor
  if (request.tripDetails.budget >= 1000) score += 20;
  else if (request.tripDetails.budget >= 500) score += 10;

  // Specific dates boost score
  if (request.tripDetails.startDate && request.tripDetails.endDate) score += 15;

  // Clear preferences boost score
  if (request.preferences.activities.length >= 2) score += 10;
  if (request.preferences.accommodationType.length > 0) score += 5;

  // Flexibility boost
  if (request.tripDetails.budgetFlexibility !== "rigid") score += 10;

  return Math.min(100, score);
}