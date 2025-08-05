import { v } from "convex/values";
import { query, mutation, action } from "../../_generated/server";
import { api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

/**
 * Advanced Package Matching Engine
 * Implements sophisticated algorithms to automatically match package requests with existing packages
 */

// Matching algorithm types
export const MatchingAlgorithmType = v.union(
  v.literal("similarity_score"), // Basic similarity scoring
  v.literal("ml_clustering"), // Machine learning clustering
  v.literal("preference_weighted"), // Weighted by user preferences
  v.literal("budget_optimized"), // Optimized for budget constraints
  v.literal("hybrid") // Combination of multiple algorithms
);

// Match result structure
export const PackageMatchResult = v.object({
  packageId: v.id("packages"),
  matchScore: v.number(), // 0-100
  confidenceLevel: v.union(
    v.literal("high"), // 80-100
    v.literal("medium"), // 60-79
    v.literal("low") // 40-59
  ),
  matchFactors: v.object({
    destinationMatch: v.number(),
    budgetMatch: v.number(),
    durationMatch: v.number(),
    activityMatch: v.number(),

    groupSizeMatch: v.number(),
    dateAvailability: v.number(),
  }),
  adjustmentSuggestions: v.array(v.object({
    type: v.union(
      v.literal("price_adjustment"),
      v.literal("date_change"),
      v.literal("group_size_adjustment"),
      v.literal("activity_modification"),
      v.literal("accommodation_upgrade"),
      v.literal("duration_extension")
    ),
    description: v.string(),
    impact: v.number(), // Expected score improvement
    cost: v.number(), // Additional cost (if any)
  })),
  conversionProbability: v.number(), // 0-100
});

export const MatchingSessionResult = v.object({
  requestId: v.id("packageRequests"),
  algorithm: MatchingAlgorithmType,
  executionTime: v.number(),
  totalPackagesAnalyzed: v.number(),
  matches: v.array(PackageMatchResult),
  performanceMetrics: v.object({
    processingTimeMs: v.number(),
    matchesFound: v.number(),
    averageMatchScore: v.number(),
    highConfidenceMatches: v.number(),
  }),
  recommendations: v.array(v.string()),
});

/**
 * Execute matching algorithm for a package request
 */
export const executeMatching = action({
  args: {
    requestId: v.id("packageRequests"),
    algorithm: v.optional(MatchingAlgorithmType),
    maxResults: v.optional(v.number()),
    minScore: v.optional(v.number()),
  },
  returns: MatchingSessionResult,
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const { 
      requestId, 
      algorithm = "hybrid", 
      maxResults = 10, 
      minScore = 40 
    } = args;

    // Get package request details
    const request = await ctx.runQuery(api.domains.packages.queries.getPackageRequestDetails, {
      requestId
    });

    if (!request) {
      throw new Error("Package request not found");
    }

    // Get all available packages
    const allPackages = await ctx.runQuery(api.domains.packages.queries.getAllPackages);
    
    let matches: any[] = [];
    
    // Execute the specified matching algorithm
    switch (algorithm) {
      case "similarity_score":
        matches = await executeSimilarityMatching(ctx, request, allPackages);
        break;
      case "ml_clustering":
        matches = await executeMLClusteringMatching(ctx, request, allPackages);
        break;
      case "preference_weighted":
        matches = await executePreferenceWeightedMatching(ctx, request, allPackages);
        break;
      case "budget_optimized":
        matches = await executeBudgetOptimizedMatching(ctx, request, allPackages);
        break;
      case "hybrid":
        matches = await executeHybridMatching(ctx, request, allPackages);
        break;
    }

    // Filter by minimum score and limit results
    matches = matches
      .filter(match => match.matchScore >= minScore)
      .slice(0, maxResults);

    // Calculate performance metrics
    const endTime = Date.now();
    const performanceMetrics = {
      processingTimeMs: endTime - startTime,
      matchesFound: matches.length,
      averageMatchScore: matches.length > 0 
        ? matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length 
        : 0,
      highConfidenceMatches: matches.filter(m => m.confidenceLevel === "high").length,
    };

    // Generate recommendations
    const recommendations = generateMatchingRecommendations(request, matches, performanceMetrics);

    return {
      requestId,
      algorithm,
      executionTime: endTime - startTime,
      totalPackagesAnalyzed: allPackages.length,
      matches,
      performanceMetrics,
      recommendations,
    };
  },
});

/**
 * Similarity-based matching algorithm
 */
async function executeSimilarityMatching(ctx: any, request: any, packages: any[]): Promise<any[]> {
  const matches: any[] = [];

  for (const pkg of packages) {
    const matchFactors = calculateSimilarityFactors(request, pkg);
    const matchScore = calculateWeightedScore(matchFactors, {
      destinationMatch: 0.25,
      budgetMatch: 0.20,
      durationMatch: 0.15,
      activityMatch: 0.15,
  
      groupSizeMatch: 0.10,
      dateAvailability: 0.05,
    });

    if (matchScore >= 40) {
      const adjustmentSuggestions = generateAdjustmentSuggestions(request, pkg, matchFactors);
      const conversionProbability = calculateConversionProbability(matchScore, matchFactors);
      
      matches.push({
        packageId: pkg._id,
        matchScore,
        confidenceLevel: getConfidenceLevel(matchScore),
        matchFactors,
        adjustmentSuggestions,
        conversionProbability,
      });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * ML Clustering-based matching (simplified implementation)
 */
async function executeMLClusteringMatching(ctx: any, request: any, packages: any[]): Promise<any[]> {
  // Simplified clustering approach - in production, this would use proper ML algorithms
  const requestVector = createFeatureVector(request);
  const matches: any[] = [];

  for (const pkg of packages) {
    const packageVector = createPackageFeatureVector(pkg);
    const distance = calculateEuclideanDistance(requestVector, packageVector);
    
    // Convert distance to similarity score (0-100)
    const matchScore = Math.max(0, 100 - (distance * 10));
    
    if (matchScore >= 40) {
      const matchFactors = calculateSimilarityFactors(request, pkg);
      const adjustmentSuggestions = generateAdjustmentSuggestions(request, pkg, matchFactors);
      const conversionProbability = calculateConversionProbability(matchScore, matchFactors);
      
      matches.push({
        packageId: pkg._id,
        matchScore,
        confidenceLevel: getConfidenceLevel(matchScore),
        matchFactors,
        adjustmentSuggestions,
        conversionProbability,
      });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Preference-weighted matching algorithm
 */
async function executePreferenceWeightedMatching(ctx: any, request: any, packages: any[]): Promise<any[]> {
  const matches: any[] = [];
  
  // Create custom weights based on user preferences
  const customWeights = createCustomWeights(request);

  for (const pkg of packages) {
    const matchFactors = calculateSimilarityFactors(request, pkg);
    const matchScore = calculateWeightedScore(matchFactors, customWeights);

    if (matchScore >= 40) {
      const adjustmentSuggestions = generateAdjustmentSuggestions(request, pkg, matchFactors);
      const conversionProbability = calculateConversionProbability(matchScore, matchFactors);
      
      matches.push({
        packageId: pkg._id,
        matchScore,
        confidenceLevel: getConfidenceLevel(matchScore),
        matchFactors,
        adjustmentSuggestions,
        conversionProbability,
      });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Budget-optimized matching algorithm
 */
async function executeBudgetOptimizedMatching(ctx: any, request: any, packages: any[]): Promise<any[]> {
  const matches: any[] = [];
  const budget = request.tripDetails.budget;

  // Sort packages by how close they are to the budget
  const budgetSortedPackages = packages
    .map(pkg => ({
      ...pkg,
      budgetDiff: Math.abs(pkg.basePrice - budget),
      budgetRatio: pkg.basePrice / budget,
    }))
    .sort((a, b) => a.budgetDiff - b.budgetDiff);

  for (const pkg of budgetSortedPackages.slice(0, 50)) { // Limit to top 50 by budget
    const matchFactors = calculateSimilarityFactors(request, pkg);
    
    // Give extra weight to budget factor
    const budgetOptimizedWeights = {
      destinationMatch: 0.20,
      budgetMatch: 0.35, // Increased weight for budget
      durationMatch: 0.15,
      activityMatch: 0.10,
  
      groupSizeMatch: 0.05,
      dateAvailability: 0.05,
    };

    const matchScore = calculateWeightedScore(matchFactors, budgetOptimizedWeights);

    if (matchScore >= 40) {
      const adjustmentSuggestions = generateAdjustmentSuggestions(request, pkg, matchFactors);
      const conversionProbability = calculateConversionProbability(matchScore, matchFactors);
      
      matches.push({
        packageId: pkg._id,
        matchScore,
        confidenceLevel: getConfidenceLevel(matchScore),
        matchFactors,
        adjustmentSuggestions,
        conversionProbability,
      });
    }
  }

  return matches.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Hybrid matching algorithm (combines multiple approaches)
 */
async function executeHybridMatching(ctx: any, request: any, packages: any[]): Promise<any[]> {
  // Execute multiple algorithms and combine results
  const similarityMatches = await executeSimilarityMatching(ctx, request, packages);
  const preferenceMatches = await executePreferenceWeightedMatching(ctx, request, packages);
  const budgetMatches = await executeBudgetOptimizedMatching(ctx, request, packages);

  // Combine results using ensemble method
  const combinedMatches = new Map<string, any>();

  // Add similarity matches with weight 0.4
  for (const match of similarityMatches.slice(0, 20)) {
    combinedMatches.set(match.packageId, {
      ...match,
      hybridScore: match.matchScore * 0.4,
      algorithmContributions: { similarity: 0.4 },
    });
  }

  // Add preference matches with weight 0.35
  for (const match of preferenceMatches.slice(0, 20)) {
    const existing = combinedMatches.get(match.packageId);
    if (existing) {
      existing.hybridScore += match.matchScore * 0.35;
      existing.algorithmContributions.preference = 0.35;
    } else {
      combinedMatches.set(match.packageId, {
        ...match,
        hybridScore: match.matchScore * 0.35,
        algorithmContributions: { preference: 0.35 },
      });
    }
  }

  // Add budget matches with weight 0.25
  for (const match of budgetMatches.slice(0, 20)) {
    const existing = combinedMatches.get(match.packageId);
    if (existing) {
      existing.hybridScore += match.matchScore * 0.25;
      existing.algorithmContributions.budget = 0.25;
    } else {
      combinedMatches.set(match.packageId, {
        ...match,
        hybridScore: match.matchScore * 0.25,
        algorithmContributions: { budget: 0.25 },
      });
    }
  }

  // Convert to array and sort by hybrid score
  const finalMatches = Array.from(combinedMatches.values())
    .map(match => ({
      ...match,
      matchScore: Math.round(match.hybridScore),
      confidenceLevel: getConfidenceLevel(match.hybridScore),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  return finalMatches;
}

/**
 * Calculate similarity factors between request and package
 */
function calculateSimilarityFactors(request: any, pkg: any): any {
  const factors = {
    destinationMatch: 0,
    budgetMatch: 0,
    durationMatch: 0,
    activityMatch: 0,

    groupSizeMatch: 0,
    dateAvailability: 0,
  };

  // Destination match
  const requestDest = request.tripDetails.destination.toLowerCase();
  const packageCategory = pkg.category.toLowerCase();
  const packageName = pkg.name.toLowerCase();
  
  if (packageCategory.includes(requestDest) || 
      requestDest.includes(packageCategory) ||
      packageName.includes(requestDest)) {
    factors.destinationMatch = 100;
  } else {
    // Partial match based on keywords
    const destWords = requestDest.split(' ');
    const catWords = packageCategory.split(' ');
    const matchingWords = destWords.filter(word => catWords.includes(word));
    factors.destinationMatch = (matchingWords.length / destWords.length) * 80;
  }

  // Budget match
  const budgetDiff = Math.abs(pkg.basePrice - request.tripDetails.budget);
  const budgetPercentage = budgetDiff / request.tripDetails.budget;
  
  if (budgetPercentage <= 0.05) factors.budgetMatch = 100;
  else if (budgetPercentage <= 0.10) factors.budgetMatch = 90;
  else if (budgetPercentage <= 0.20) factors.budgetMatch = 75;
  else if (budgetPercentage <= 0.30) factors.budgetMatch = 60;
  else if (budgetPercentage <= 0.50) factors.budgetMatch = 40;
  else factors.budgetMatch = Math.max(0, 30 - (budgetPercentage * 50));

  // Duration match
  const durationDiff = Math.abs(pkg.duration - request.tripDetails.duration);
  if (durationDiff === 0) factors.durationMatch = 100;
  else if (durationDiff <= 1) factors.durationMatch = 85;
  else if (durationDiff <= 2) factors.durationMatch = 70;
  else if (durationDiff <= 3) factors.durationMatch = 55;
  else factors.durationMatch = Math.max(0, 40 - (durationDiff * 10));

  // Activity match
  if (request.preferences.activities.length > 0) {
    const packageContent = (pkg.description + ' ' + pkg.highlights.join(' ')).toLowerCase();
    let activityMatches = 0;
    
    for (const activity of request.preferences.activities) {
      if (packageContent.includes(activity.toLowerCase())) {
        activityMatches++;
      }
    }
    
    factors.activityMatch = (activityMatches / request.preferences.activities.length) * 100;
  } else {
    factors.activityMatch = 50; // Neutral if no preferences specified
  }



  // Group size match
  if (pkg.maxGuests >= request.tripDetails.groupSize) {
    factors.groupSizeMatch = 100;
  } else {
    const sizeDiff = request.tripDetails.groupSize - pkg.maxGuests;
    factors.groupSizeMatch = Math.max(0, 50 - (sizeDiff * 20));
  }

  // Date availability (simplified - would need real availability check)
  factors.dateAvailability = request.tripDetails.startDate ? 80 : 60;

  return factors;
}

/**
 * Calculate weighted score from factors
 */
function calculateWeightedScore(factors: any, weights: any): number {
  let score = 0;
  for (const [factor, value] of Object.entries(factors)) {
    if (weights[factor]) {
      score += (value as number) * weights[factor];
    }
  }
  return Math.round(score);
}

/**
 * Create custom weights based on user preferences
 */
function createCustomWeights(request: any): any {
  const baseWeights = {
    destinationMatch: 0.25,
    budgetMatch: 0.20,
    durationMatch: 0.15,
    activityMatch: 0.15,

    groupSizeMatch: 0.10,
    dateAvailability: 0.05,
  };

  // Adjust weights based on budget flexibility
  if (request.tripDetails.budgetFlexibility === "rigid") {
    baseWeights.budgetMatch += 0.10;
    baseWeights.activityMatch -= 0.05;
    
  } else if (request.tripDetails.budgetFlexibility === "very_flexible") {
    baseWeights.budgetMatch -= 0.10;
    baseWeights.activityMatch += 0.05;
    
  }

  // Adjust for date flexibility
  if (request.tripDetails.flexibleDates) {
    baseWeights.dateAvailability -= 0.03;
    baseWeights.destinationMatch += 0.03;
  }

  // Adjust for group size importance
  if (request.tripDetails.groupSize > 6) {
    baseWeights.groupSizeMatch += 0.05;
    baseWeights.activityMatch -= 0.05;
  }

  return baseWeights;
}

/**
 * Generate adjustment suggestions for improving match
 */
function generateAdjustmentSuggestions(request: any, pkg: any, factors: any): any[] {
  const suggestions: any[] = [];

  // Price adjustment suggestions
  if (factors.budgetMatch < 70) {
    const priceDiff = pkg.basePrice - request.tripDetails.budget;
    if (priceDiff > 0) {
      suggestions.push({
        type: "price_adjustment",
        description: `Reduzir preço em R$ ${priceDiff.toFixed(2)} para atender orçamento`,
        impact: 30,
        cost: -priceDiff,
      });
    }
  }

  // Duration adjustment suggestions
  if (factors.durationMatch < 70) {
    const durationDiff = pkg.duration - request.tripDetails.duration;
    if (durationDiff !== 0) {
      suggestions.push({
        type: "duration_extension",
        description: durationDiff > 0 
          ? `Reduzir duração em ${durationDiff} dia(s)`
          : `Estender duração em ${Math.abs(durationDiff)} dia(s)`,
        impact: 25,
        cost: durationDiff < 0 ? Math.abs(durationDiff) * 200 : 0,
      });
    }
  }

  // Group size adjustment
  if (factors.groupSizeMatch < 70 && pkg.maxGuests < request.tripDetails.groupSize) {
    suggestions.push({
      type: "group_size_adjustment",
      description: `Ajustar capacidade para ${request.tripDetails.groupSize} pessoas`,
      impact: 20,
      cost: (request.tripDetails.groupSize - pkg.maxGuests) * 100,
    });
  }

  // Activity modifications
  if (factors.activityMatch < 60) {
    suggestions.push({
      type: "activity_modification",
      description: "Adicionar atividades conforme preferências do cliente",
      impact: 15,
      cost: 300,
    });
  }

  return suggestions.sort((a, b) => b.impact - a.impact);
}

/**
 * Calculate conversion probability
 */
function calculateConversionProbability(matchScore: number, factors: any): number {
  let probability = matchScore * 0.8; // Base probability from match score

  // Boost for high budget match
  if (factors.budgetMatch > 80) probability += 10;

  // Boost for exact duration match
  if (factors.durationMatch === 100) probability += 5;

  // Boost for good activity match
  if (factors.activityMatch > 70) probability += 8;

  return Math.min(100, Math.round(probability));
}

/**
 * Get confidence level from match score
 */
function getConfidenceLevel(score: number): "high" | "medium" | "low" {
  if (score >= 80) return "high";
  if (score >= 60) return "medium";
  return "low";
}

/**
 * Create feature vector for ML clustering
 */
function createFeatureVector(request: any): number[] {
  return [
    request.tripDetails.budget / 10000, // Normalized budget
    request.tripDetails.duration / 30, // Normalized duration
    request.tripDetails.groupSize / 20, // Normalized group size
    request.preferences.activities.length / 10, // Activity preferences count
    request.preferences.accommodationType.length / 5, // Accommodation preferences
    request.tripDetails.flexibleDates ? 1 : 0, // Date flexibility
    request.tripDetails.budgetFlexibility === "very_flexible" ? 1 : 
      request.tripDetails.budgetFlexibility === "flexible" ? 0.5 : 0, // Budget flexibility
  ];
}

/**
 * Create feature vector for packages
 */
function createPackageFeatureVector(pkg: any): number[] {
  return [
    pkg.basePrice / 10000, // Normalized price
    pkg.duration / 30, // Normalized duration
    pkg.maxGuests / 20, // Normalized capacity
    pkg.highlights.length / 10, // Features count
    pkg.accommodationId ? 1 : 0, // Has accommodation
    pkg.isFeatured ? 1 : 0, // Featured package
    pkg.discountPercentage || 0 / 100, // Discount percentage
  ];
}

/**
 * Calculate Euclidean distance between vectors
 */
function calculateEuclideanDistance(vec1: number[], vec2: number[]): number {
  const sum = vec1.reduce((acc, val, idx) => 
    acc + Math.pow(val - (vec2[idx] || 0), 2), 0
  );
  return Math.sqrt(sum);
}

/**
 * Generate matching recommendations
 */
function generateMatchingRecommendations(request: any, matches: any[], metrics: any): string[] {
  const recommendations: string[] = [];

  if (matches.length === 0) {
    recommendations.push("Nenhum pacote compatível encontrado - considere criar pacote personalizado");
    recommendations.push("Revise os critérios de busca ou orçamento do cliente");
  } else {
    recommendations.push(`${matches.length} pacote(s) compatível(eis) encontrado(s)`);
    
    const highConfidenceCount = matches.filter(m => m.confidenceLevel === "high").length;
    if (highConfidenceCount > 0) {
      recommendations.push(`${highConfidenceCount} pacote(s) com alta confiança de conversão`);
    }

    if (metrics.averageMatchScore > 80) {
      recommendations.push("Excelente compatibilidade - proceder com conversão automática");
    } else if (metrics.averageMatchScore > 60) {
      recommendations.push("Boa compatibilidade - revisar sugestões de ajuste");
    } else {
      recommendations.push("Compatibilidade moderada - personalização pode ser necessária");
    }

    // Budget-specific recommendations
    const topMatch = matches[0];
    if (topMatch.matchFactors.budgetMatch < 60) {
      recommendations.push("Considere negociar preço ou ofertar opções mais econômicas");
    }

    // Duration recommendations
    if (topMatch.matchFactors.durationMatch < 70) {
      recommendations.push("Ajustar duração do pacote pode melhorar a satisfação");
    }
  }

  return recommendations;
}

/**
 * Get matching statistics for dashboard
 */
export const getMatchingStatistics = query({
  args: {
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d")
    )),
  },
  returns: v.object({
    totalRequests: v.number(),
    matchedRequests: v.number(),
    averageMatchScore: v.number(),
    conversionRate: v.number(),
    topPerformingPackages: v.array(v.object({
      packageId: v.id("packages"),
      packageName: v.string(),
      matchCount: v.number(),
      averageScore: v.number(),
    })),
    algorithmPerformance: v.object({
      similarity: v.number(),
      preference: v.number(),
      budget: v.number(),
      hybrid: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    // In a real implementation, this would analyze stored matching results
    // For now, return mock statistics
    return {
      totalRequests: 150,
      matchedRequests: 120,
      averageMatchScore: 72,
      conversionRate: 65,
      topPerformingPackages: [
        {
          packageId: "placeholder" as Id<"packages">,
          packageName: "Pacote Fernando de Noronha Completo",
          matchCount: 45,
          averageScore: 85,
        },
        {
          packageId: "placeholder2" as Id<"packages">,
          packageName: "Pacote Romântico Noronha",
          matchCount: 32,
          averageScore: 78,
        },
      ],
      algorithmPerformance: {
        similarity: 68,
        preference: 72,
        budget: 75,
        hybrid: 80,
      },
    };
  },
});