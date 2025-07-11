import { v } from "convex/values";
import { query, mutation, action } from "../../_generated/server";
import { api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
// RBAC functions called via queries from actions

/**
 * Package Request to Booking Conversion API
 * Main API endpoints for converting package requests to actual bookings
 */

// Conversion workflow status
const ConversionStatus = v.union(
  v.literal("analysis_pending"),
  v.literal("analysis_complete"),
  v.literal("matching_in_progress"),
  v.literal("matches_found"),
  v.literal("custom_package_required"),
  v.literal("pricing_calculated"),
  v.literal("ready_for_conversion"),
  v.literal("conversion_in_progress"),
  v.literal("conversion_complete"),
  v.literal("conversion_failed"),
  v.literal("customer_approval_pending"),
  v.literal("customer_approved"),
  v.literal("customer_rejected")
);

// Conversion session structure
const ConversionSession = v.object({
  id: v.string(),
  requestId: v.id("packageRequests"),
  adminId: v.id("users"),
  status: ConversionStatus,
  analysisResult: v.optional(v.any()),
  matchingResult: v.optional(v.any()),
  pricingResult: v.optional(v.any()),
  customPackageId: v.optional(v.string()),
  selectedOption: v.optional(v.object({
    type: v.union(
      v.literal("existing_package"),
      v.literal("custom_package"),
      v.literal("modified_package")
    ),
    packageId: v.optional(v.id("packages")),
    customPackageId: v.optional(v.string()),
    finalPrice: v.number(),
    adjustments: v.optional(v.array(v.string())),
  })),
  timeline: v.array(v.object({
    timestamp: v.number(),
    event: v.string(),
    description: v.string(),
    userId: v.optional(v.id("users")),
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
});

/**
 * Start conversion process for a package request
 */
export const startConversionProcess = action({
  args: {
    requestId: v.id("packageRequests"),
    conversionType: v.optional(v.union(
      v.literal("automatic"), // Fully automated
      v.literal("assisted"), // Admin-assisted
      v.literal("manual") // Fully manual
    )),
  },
  returns: v.object({
    success: v.boolean(),
    sessionId: v.optional(v.string()),
    status: ConversionStatus,
    nextSteps: v.array(v.string()),
    estimatedCompletionTime: v.optional(v.string()),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get current user info
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        success: false,
        status: "analysis_pending" as const,
        nextSteps: [],
        message: "Acesso negado. Usuário não autenticado.",
      };
    }

    const currentUser = await ctx.runQuery(api.domains.users.queries.getCurrentUser);
    if (!currentUser) {
      return {
        success: false,
        status: "analysis_pending" as const,
        nextSteps: [],
        message: "Usuário não encontrado.",
      };
    }

    const userId = currentUser._id;
    const userRole = currentUser.role;
    const { requestId, conversionType = "assisted" } = args;

    // Verify permissions
    if (!["master", "partner", "employee"].includes(userRole || "")) {
      return {
        success: false,
        status: "analysis_pending" as const,
        nextSteps: [],
        message: "Acesso negado. Apenas admins podem iniciar conversões.",
      };
    }

    // Check if request exists
    const request = await ctx.runQuery(api.domains.packages.queries.getPackageRequestDetails, {
      requestId
    });

    if (!request) {
      return {
        success: false,
        status: "analysis_pending" as const,
        nextSteps: [],
        message: "Solicitação de pacote não encontrada.",
      };
    }

    // Check if conversion already in progress
    const existingSession = await getExistingConversionSession(ctx, requestId);
    if (existingSession && existingSession.id) {
      return {
        success: true,
        sessionId: existingSession.id,
        status: existingSession.status,
        nextSteps: getNextSteps(existingSession.status),
        message: "Conversão já em andamento.",
      };
    }

    try {
      // Create new conversion session
      const sessionId = `CONV_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // Start analysis process
      let analysisResult;
      try {
        analysisResult = await ctx.runAction(api.domains.packages.requestAnalysis.analyzePackageRequest, {
          requestId,
          includeCustomSuggestions: true,
        });
      } catch (error) {
        console.error("Analysis failed:", error);
        analysisResult = null;
      }

      const session: any = {
        id: sessionId,
        requestId,
        adminId: userId,
        status: analysisResult ? "analysis_complete" : "analysis_pending",
        analysisResult,
        timeline: [
          {
            timestamp: Date.now(),
            event: "conversion_started",
            description: `Processo de conversão iniciado por ${userRole}`,
            userId,
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // For automatic conversion, proceed with matching
      if (conversionType === "automatic" && analysisResult) {
        try {
          const matchingResult = await ctx.runAction(api.domains.packages.matchingEngine.executeMatching, {
            requestId,
            algorithm: "hybrid",
            maxResults: 5,
            minScore: 60,
          });

          session.matchingResult = matchingResult;
          session.status = "matches_found";
          session.timeline.push({
            timestamp: Date.now(),
            event: "matching_complete",
            description: `${matchingResult.matches.length} correspondências encontradas`,
          });
        } catch (error) {
          console.error("Matching failed:", error);
        }
      }

      // Store session (in real implementation)
      // await storeConversionSession(ctx, session);

      const nextSteps = getNextSteps(session.status);
      const estimatedTime = getEstimatedCompletionTime(conversionType, session.status);

      return {
        success: true,
        sessionId,
        status: session.status,
        nextSteps,
        estimatedCompletionTime: estimatedTime,
        message: "Processo de conversão iniciado com sucesso.",
      };
    } catch (error) {
      return {
        success: false,
        status: "analysis_pending" as const,
        nextSteps: [],
        message: `Erro ao iniciar conversão: ${error}`,
      };
    }
  },
});

/**
 * Get conversion session status
 */
export const getConversionStatus = query({
  args: {
    sessionId: v.optional(v.string()),
    requestId: v.optional(v.id("packageRequests")),
  },
  returns: v.union(ConversionSession, v.null()),
  handler: async (ctx, args) => {
    // Get current user info
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const currentUser = await ctx.runQuery(api.domains.users.queries.getCurrentUser);
    if (!currentUser) {
      return null;
    }

    const userId = currentUser._id;
    const { sessionId, requestId } = args;

    // In a real implementation, this would fetch from database
    // For now, return mock data
    if (sessionId || requestId) {
      return {
        id: sessionId || "mock_session",
        requestId: requestId || ("mock_request" as Id<"packageRequests">),
        adminId: userId,
        status: "matches_found" as const,
        analysisResult: {
          overallScore: 85,
          autoConversionRecommendation: "high_confidence",
          topMatches: [
            {
              packageId: "pkg_123" as Id<"packages">,
              packageName: "Pacote Fernando de Noronha Completo",
              matchScore: 88,
              conversionProbability: 90,
            }
          ],
        },
        matchingResult: {
          matches: [
            {
              packageId: "pkg_123" as Id<"packages">,
              matchScore: 88,
              confidenceLevel: "high",
            }
          ],
          totalPackagesAnalyzed: 25,
          performanceMetrics: {
            processingTimeMs: 1500,
            matchesFound: 3,
            averageMatchScore: 75,
            highConfidenceMatches: 1,
          },
        },
        timeline: [
          {
            timestamp: Date.now() - 3600000,
            event: "conversion_started",
            description: "Processo iniciado",
          },
          {
            timestamp: Date.now() - 1800000,
            event: "analysis_complete",
            description: "Análise concluída com sucesso",
          },
          {
            timestamp: Date.now() - 900000,
            event: "matching_complete",
            description: "3 correspondências encontradas",
          },
        ],
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now() - 900000,
      };
    }

    return null;
  },
});

/**
 * Execute package matching for a conversion session
 */
export const executePackageMatching = action({
  args: {
    sessionId: v.string(),
    algorithm: v.optional(v.union(
      v.literal("similarity_score"),
      v.literal("preference_weighted"),
      v.literal("budget_optimized"),
      v.literal("hybrid")
    )),
    filters: v.optional(v.object({
      minScore: v.number(),
      maxResults: v.number(),
      priceRange: v.optional(v.object({
        min: v.number(),
        max: v.number(),
      })),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    matches: v.optional(v.array(v.any())),
    metrics: v.optional(v.any()),
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
    const { sessionId, algorithm = "hybrid", filters } = args;

    try {
      // Get session (mock for now)
      const session = await getConversionSessionById(ctx, sessionId);
      if (!session) {
        return {
          success: false,
          message: "Sessão de conversão não encontrada.",
        };
      }

      // Execute matching
      const matchingResult = await ctx.runAction(api.domains.packages.matchingEngine.executeMatching, {
        requestId: session.requestId,
        algorithm,
        maxResults: filters?.maxResults || 10,
        minScore: filters?.minScore || 40,
      });

      // Filter by price range if specified
      let filteredMatches = matchingResult.matches;
      if (filters?.priceRange) {
        filteredMatches = matchingResult.matches.filter((match: any) => {
          // Would need to get package price here
          return true; // Simplified for now
        });
      }

      // Update session (in real implementation)
      // await updateConversionSession(ctx, sessionId, {
      //   status: "matches_found",
      //   matchingResult,
      //   updatedAt: Date.now(),
      // });

      return {
        success: true,
        matches: filteredMatches,
        metrics: matchingResult.performanceMetrics,
        message: `${filteredMatches.length} correspondências encontradas.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao executar correspondência: ${error}`,
      };
    }
  },
});

/**
 * Calculate pricing for conversion options
 */
export const calculateConversionPricing = action({
  args: {
    sessionId: v.string(),
    option: v.object({
      type: v.union(
        v.literal("existing_package"),
        v.literal("custom_package"),
        v.literal("modified_package")
      ),
      packageId: v.optional(v.id("packages")),
      customComponents: v.optional(v.array(v.any())),
      modifications: v.optional(v.array(v.string())),
    }),
    pricingStrategy: v.optional(v.union(
      v.literal("cost_plus"),
      v.literal("value_based"),
      v.literal("competitive"),
      v.literal("dynamic")
    )),
  },
  returns: v.object({
    success: v.boolean(),
    pricing: v.optional(v.any()),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { sessionId, option, pricingStrategy = "dynamic" } = args;

    try {
      const session = await getConversionSessionById(ctx, sessionId);
      if (!session) {
        return {
          success: false,
          message: "Sessão de conversão não encontrada.",
        };
      }

      // Calculate pricing based on option type
      let pricingResult;
      
      if (option.type === "existing_package" && option.packageId) {
        // Get package details and calculate pricing
        const packageData = await ctx.runQuery(api.domains.packages.queries.getPackageById, {
          id: option.packageId,
        });

        if (!packageData) {
          return {
            success: false,
            message: "Pacote não encontrado.",
          };
        }

        pricingResult = await ctx.runAction(api.domains.packages.pricingEngine.calculateDynamicPricing, {
          requestId: session.requestId,
          packageComponents: [
            {
              type: "package",
              basePrice: packageData.basePrice,
              quantity: 1,
            }
          ],
          strategy: pricingStrategy,
        });
      } else if (option.type === "custom_package" && option.customComponents) {
        // Calculate pricing for custom components
        pricingResult = await ctx.runAction(api.domains.packages.pricingEngine.calculateDynamicPricing, {
          requestId: session.requestId,
          packageComponents: option.customComponents,
          strategy: pricingStrategy,
        });
      }

      return {
        success: true,
        pricing: pricingResult,
        message: "Preços calculados com sucesso.",
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao calcular preços: ${error}`,
      };
    }
  },
});

/**
 * Select conversion option and proceed
 */
export const selectConversionOption = mutation({
  args: {
    sessionId: v.string(),
    selectedOption: v.object({
      type: v.union(
        v.literal("existing_package"),
        v.literal("custom_package"),
        v.literal("modified_package")
      ),
      packageId: v.optional(v.id("packages")),
      customPackageId: v.optional(v.string()),
      finalPrice: v.number(),
      adjustments: v.optional(v.array(v.string())),
      adminNotes: v.optional(v.string()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    nextStep: v.optional(v.string()),
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
    const { sessionId, selectedOption } = args;

    try {
      // Update session with selected option
      // In real implementation, this would update the database
      
      // Log timeline event
      const timelineEvent = {
        timestamp: Date.now(),
        event: "option_selected",
        description: `Opção selecionada: ${selectedOption.type} - Preço: R$ ${selectedOption.finalPrice}`,
        userId,
      };

      // Update package request status
      const session = await getConversionSessionById(ctx, sessionId);
      if (session) {
        await ctx.runMutation(api.domains.packages.mutations.updatePackageRequestStatus, {
          requestId: session.requestId,
          status: "approved",
          adminNotes: `Conversão em andamento - ${selectedOption.type} selecionado por R$ ${selectedOption.finalPrice}`,
        });
      }

      return {
        success: true,
        nextStep: "customer_approval",
        message: "Opção selecionada. Aguardando aprovação do cliente.",
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao selecionar opção: ${error}`,
      };
    }
  },
});

/**
 * Execute final conversion to booking
 */
export const executeConversionToBooking = action({
  args: {
    sessionId: v.string(),
    customerApproval: v.boolean(),
    paymentMethod: v.optional(v.union(
      v.literal("card"),
      v.literal("pix"),
      v.literal("transfer"),
      v.literal("cash")
    )),
  },
  returns: v.object({
    success: v.boolean(),
    bookingId: v.optional(v.string()),
    confirmationCode: v.optional(v.string()),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const { sessionId, customerApproval, paymentMethod = "card" } = args;

    if (!customerApproval) {
      return {
        success: false,
        message: "Conversão cancelada - cliente não aprovou.",
      };
    }

    try {
      const session = await getConversionSessionById(ctx, sessionId);
      if (!session || !session.selectedOption) {
        return {
          success: false,
          message: "Sessão inválida ou opção não selecionada.",
        };
      }

      // Create actual booking based on selected option
      let bookingId: string;
      let confirmationCode: string;

      if (session.selectedOption.type === "existing_package") {
        // Create package booking
        const result = await createPackageBooking(ctx, session, paymentMethod);
        bookingId = result.bookingId;
        confirmationCode = result.confirmationCode;
      } else if (session.selectedOption.type === "custom_package") {
        // Convert custom package to actual package and book
        const result = await createCustomPackageBooking(ctx, session, paymentMethod);
        bookingId = result.bookingId;
        confirmationCode = result.confirmationCode;
      } else {
        // Handle modified package
        const result = await createModifiedPackageBooking(ctx, session, paymentMethod);
        bookingId = result.bookingId;
        confirmationCode = result.confirmationCode;
      }

      // Update package request status to completed
      await ctx.runMutation(api.domains.packages.mutations.updatePackageRequestStatus, {
        requestId: session.requestId,
        status: "completed",
        adminNotes: `Convertido para reserva ${bookingId}`,
      });

      // Send confirmation email (would be implemented)
      // await sendConversionConfirmationEmail(ctx, session, bookingId, confirmationCode);

      return {
        success: true,
        bookingId,
        confirmationCode,
        message: "Conversão concluída com sucesso!",
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao executar conversão: ${error}`,
      };
    }
  },
});

/**
 * Get conversion analytics
 */
export const getConversionAnalytics = query({
  args: {
    timeRange: v.optional(v.union(
      v.literal("7d"),
      v.literal("30d"),
      v.literal("90d")
    )),
    partnerId: v.optional(v.id("users")),
  },
  returns: v.object({
    totalConversions: v.number(),
    conversionRate: v.number(),
    averageConversionTime: v.number(),
    revenueGenerated: v.number(),
    conversionsByType: v.object({
      existingPackage: v.number(),
      customPackage: v.number(),
      modifiedPackage: v.number(),
    }),
    topPerformingMatches: v.array(v.object({
      packageId: v.id("packages"),
      packageName: v.string(),
      conversions: v.number(),
      conversionRate: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    // Mock analytics data
    return {
      totalConversions: 45,
      conversionRate: 75, // 75%
      averageConversionTime: 2.5, // 2.5 hours
      revenueGenerated: 125000,
      conversionsByType: {
        existingPackage: 28,
        customPackage: 12,
        modifiedPackage: 5,
      },
      topPerformingMatches: [
        {
          packageId: "pkg_123" as Id<"packages">,
          packageName: "Pacote Fernando de Noronha Completo",
          conversions: 18,
          conversionRate: 85,
        },
        {
          packageId: "pkg_456" as Id<"packages">,
          packageName: "Pacote Romântico Noronha",
          conversions: 12,
          conversionRate: 80,
        },
      ],
    };
  },
});

// Helper functions (would be implemented fully in real system)

async function getExistingConversionSession(ctx: any, requestId: Id<"packageRequests">): Promise<any | null> {
  // Would query database for existing session
  // For now, return null to indicate no existing session
  return null;
}

async function getConversionSessionById(ctx: any, sessionId: string) {
  // Would fetch session from database
  return {
    id: sessionId,
    requestId: "mock_request" as Id<"packageRequests">,
    adminId: "mock_admin" as Id<"users">,
    status: "matches_found" as const,
    selectedOption: {
      type: "existing_package" as const,
      packageId: "pkg_123" as Id<"packages">,
      finalPrice: 2500,
      adjustments: [],
    },
  };
}

async function createPackageBooking(ctx: any, session: any, paymentMethod: string) {
  // Would create actual package booking
  return {
    bookingId: `PKG_${Date.now()}`,
    confirmationCode: `CONF_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  };
}

async function createCustomPackageBooking(ctx: any, session: any, paymentMethod: string) {
  // Would create custom package and booking
  return {
    bookingId: `CUSTOM_${Date.now()}`,
    confirmationCode: `CONF_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  };
}

async function createModifiedPackageBooking(ctx: any, session: any, paymentMethod: string) {
  // Would create modified package booking
  return {
    bookingId: `MOD_${Date.now()}`,
    confirmationCode: `CONF_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
  };
}

function getNextSteps(status: string): string[] {
  switch (status) {
    case "analysis_pending":
      return ["Executar análise da solicitação", "Identificar preferências do cliente"];
    case "analysis_complete":
      return ["Executar busca de correspondências", "Avaliar opções disponíveis"];
    case "matches_found":
      return ["Revisar correspondências", "Calcular preços", "Selecionar melhor opção"];
    case "custom_package_required":
      return ["Criar pacote personalizado", "Calcular preços customizados"];
    case "pricing_calculated":
      return ["Revisar preços", "Selecionar opção final"];
    case "ready_for_conversion":
      return ["Enviar proposta ao cliente", "Aguardar aprovação"];
    case "customer_approval_pending":
      return ["Aguardar resposta do cliente"];
    case "customer_approved":
      return ["Executar conversão final", "Criar reserva"];
    case "conversion_complete":
      return ["Enviar confirmação", "Acompanhar cliente"];
    default:
      return ["Revisar status da conversão"];
  }
}

function getEstimatedCompletionTime(conversionType: string, status: string): string {
  if (conversionType === "automatic") {
    return "15-30 minutos";
  } else if (conversionType === "assisted") {
    return "1-3 horas";
  } else {
    return "4-8 horas";
  }
}