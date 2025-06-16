"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// Função helper para inicializar OpenAI apenas quando necessário
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada");
  }
  
  const OpenAI = require('openai');
  return new OpenAI({ apiKey });
};

const userPreferencesValidator = v.object({
  tripDuration: v.string(),
  companions: v.string(),
  interests: v.array(v.string()),
  budget: v.number(),
  personalityProfile: v.object({
    adventureLevel: v.number(),
    luxuryPreference: v.number(),
    socialLevel: v.number(),
    activityIntensity: v.number(),
  }),
  moodTags: v.array(v.string()),
  experienceGoals: v.array(v.string()),
});

export const generateAIRecommendations = action({
  args: {
    userPreferences: userPreferencesValidator,
    baseRecommendations: v.array(v.any()),
  },
  returns: v.object({
    recommendations: v.array(v.any()),
    personalizedMessage: v.string(),
    confidenceScore: v.number(),
    processingTime: v.number(),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    try {
      // Verificar se OpenAI está disponível
      const openai = getOpenAI();
      const prompt = createRecommendationPrompt(args.userPreferences, args.baseRecommendations);
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em turismo de Fernando de Noronha. 
            Crie recomendações ultra-personalizadas baseadas no perfil do viajante.
            Responda SEMPRE em JSON válido.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });
      
      const aiResponse = response.choices[0].message.content;
      if (!aiResponse) {
        throw new Error("Resposta vazia da OpenAI");
      }
      
      const parsed = parseAIRecommendations(aiResponse, args.baseRecommendations);
      
      return {
        recommendations: parsed.recommendations,
        personalizedMessage: parsed.personalizedMessage,
        confidenceScore: calculateConfidenceScore(args.userPreferences, parsed.recommendations),
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Erro OpenAI:", error);
      
      return {
        recommendations: args.baseRecommendations.map((rec: any) => ({
          ...rec,
          reasoning: `Algoritmo inteligente: ${rec.reasoning}`,
          aiGenerated: false,
        })),
        personalizedMessage: "🎯 Recomendações criadas com algoritmo inteligente",
        confidenceScore: 85,
        processingTime: Date.now() - startTime,
      };
    }
  },
});

function createRecommendationPrompt(userPreferences: any, baseRecommendations: any[]): string {
  const profileText = `
    Perfil: ${userPreferences.tripDuration}, ${userPreferences.companions}
    Orçamento: R$ ${userPreferences.budget}
    Personalidade: Aventura(${userPreferences.personalityProfile.adventureLevel}%), 
    Luxo(${userPreferences.personalityProfile.luxuryPreference}%)
    Interesses: ${userPreferences.interests.join(', ')}
    Vibes: ${userPreferences.moodTags.join(', ')}
    Objetivos: ${userPreferences.experienceGoals.join(', ')}
  `;

  return `
    PERFIL DO VIAJANTE:
    ${profileText}
    
    RECOMENDAÇÕES BASE COM IDs ÚNICOS:
    ${baseRecommendations.map((rec, i) => 
      `${i + 1}. ID: "${rec.id}" | ${rec.title}: ${rec.description} (Score: ${rec.matchScore}%)`
    ).join('\n')}
    
    IMPORTANTE: Use EXATAMENTE os IDs fornecidos acima. Cada ID deve aparecer apenas UMA VEZ.
    Melhore estas recomendações com insights personalizados para Fernando de Noronha.
    
    Responda em JSON:
    {
      "personalizedMessage": "mensagem pessoal (máx 150 chars)",
      "recommendations": [
        {
          "id": "USAR_ID_EXATO_DA_LISTA_ACIMA",
          "reasoning": "motivo personalizado (máx 100 chars)",
          "matchScore": number,
          "aiInsights": ["insight1", "insight2"]
        }
      ]
    }
    
    ATENÇÃO: Retorne no máximo ${Math.min(6, baseRecommendations.length)} recomendações com IDs únicos.
  `;
}

function parseAIRecommendations(aiResponse: string, baseRecommendations: any[]) {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    
    // Verificar se temos recomendações válidas da IA
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      console.log("IA não retornou recomendações válidas, usando base");
      return {
        recommendations: baseRecommendations.map(rec => ({ ...rec, aiGenerated: false })),
        personalizedMessage: parsed.personalizedMessage || "🎯 Recomendações inteligentes criadas para você!",
      };
    }
    
    // Mapear apenas recomendações que têm match válido
    const enhanced: any[] = [];
    const usedIds = new Set<string>();
    
    for (const aiRec of parsed.recommendations) {
      if (!aiRec.id) continue;
      
      const baseRec = baseRecommendations.find(rec => rec.id === aiRec.id);
      if (baseRec && !usedIds.has(baseRec.id)) {
        enhanced.push({
          ...baseRec,
          reasoning: aiRec.reasoning || baseRec.reasoning,
          matchScore: Math.min(100, Math.max(0, aiRec.matchScore || baseRec.matchScore)),
          aiGenerated: true,
          aiInsights: aiRec.aiInsights || [],
        });
        usedIds.add(baseRec.id);
      }
    }
    
    // Se não conseguimos mapear recomendações suficientes, completar com as bases restantes
    if (enhanced.length < Math.min(6, baseRecommendations.length)) {
      const remainingBase = baseRecommendations.filter(rec => !usedIds.has(rec.id));
      const needed = Math.min(6, baseRecommendations.length) - enhanced.length;
      
      for (let i = 0; i < needed && i < remainingBase.length; i++) {
        enhanced.push({
          ...remainingBase[i],
          aiGenerated: false
        });
      }
    }
    
    return {
      recommendations: enhanced,
      personalizedMessage: parsed.personalizedMessage || "🌊 Recomendações IA para você!",
    };
  } catch (error) {
    console.error("Erro ao parsear resposta da IA:", error);
    return {
      recommendations: baseRecommendations.map(rec => ({ ...rec, aiGenerated: false })),
      personalizedMessage: "🎯 Recomendações inteligentes criadas para você!",
    };
  }
}

function calculateConfidenceScore(userPreferences: any, recommendations: any[]): number {
  const profileScore = [
    userPreferences.tripDuration,
    userPreferences.interests?.length > 0,
    userPreferences.budget > 0,
    userPreferences.moodTags?.length > 0,
  ].filter(Boolean).length / 4;
  
  const avgMatch = recommendations.length > 0 
    ? recommendations.reduce((acc, rec) => acc + (rec.matchScore || 0), 0) / recommendations.length 
    : 0;
  
  return Math.round((profileScore * 0.3 + avgMatch * 0.7));
} 