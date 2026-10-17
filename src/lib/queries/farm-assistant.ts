// ~/lib/queries/farm-assistant.ts
import "server-only";

export interface FarmAssistantQuery {
  question: string;
  farmContext: {
    farmType: "crop" | "livestock" | "mixed";
    farmSize: number;
    soilType: string;
    location: string;
    primaryCrop?: string;
    primaryLivestock?: string;
    experience: "beginner" | "intermediate" | "expert";
    language: string;
  };
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

export interface FarmAssistantResponse {
  answer: string;
  sources?: Array<{
    title: string;
    url: string;
    relevance: number;
  }>;
  recommendations?: Array<{
    type: "immediate" | "short_term" | "long_term";
    action: string;
    priority: "high" | "medium" | "low";
    rationale: string;
  }>;
  followUpQuestions?: string[];
  language: string;
  timestamp: Date;
}

export interface LearningResource {
  id: number;
  title: string;
  description: string;
  category: "soil" | "planting" | "irrigation" | "pest" | "harvest" | "storage" | "marketing" | "livestock" | "finance" | "technology";
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // in minutes
  language: string;
  url?: string;
  tags: string[];
}

/**
 * Query Gemini AI for farm assistance
 * Context: Provides personalized farming advice based on farm context and user question
 */
export async function queryFarmAssistant(
  params: FarmAssistantQuery
): Promise<FarmAssistantResponse> {
  try {
    // Get Gemini API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    // Construct the prompt with farm context
    const systemPrompt = `
      You are an expert farm assistant AI specializing in agricultural best practices.
      The farmer has the following context:
      - Farm Type: ${params.farmContext.farmType}
      - Farm Size: ${params.farmContext.farmSize} hectares
      - Soil Type: ${params.farmContext.soilType}
      - Location: ${params.farmContext.location}
      - Primary Crop: ${params.farmContext.primaryCrop || "Not specified"}
      - Primary Livestock: ${params.farmContext.primaryLivestock || "Not specified"}
      - Experience Level: ${params.farmContext.experience}
      
      Instructions:
      1. Respond in ${params.farmContext.language} language
      2. Tailor advice to their specific context (farm type, size, location, experience)
      3. Provide practical, actionable recommendations
      4. Consider local climate and seasonal factors for ${params.farmContext.location}
      5. Prioritize sustainable and cost-effective methods
      6. If discussing crops/livestock not in their context, explain relevance
      7. Include specific measurements/quantities when possible
      8. Mention potential risks and how to mitigate them
      9. Suggest follow-up actions based on their experience level
      10. Keep explanations clear and avoid excessive technical jargon
      
      Previous conversation context:
      ${params.conversationHistory?.map(msg => `${msg.role}: ${msg.content}`).join('\n') || 'No previous conversation'}
    `;

    // Prepare the request body for Gemini API
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt
            },
            {
              text: `Question from farmer: ${params.question}`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract the response text
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "I apologize, but I couldn't generate a response. Please try again.";

    // Generate structured response
    return {
      answer: answer,
      sources: generateRelevantSources(params.question, params.farmContext),
      recommendations: generateRecommendations(params.question, params.farmContext),
      followUpQuestions: generateFollowUpQuestions(params.question, params.farmContext),
      language: params.farmContext.language,
      timestamp: new Date(),
    };

  } catch (error) {
    console.error("Failed to query farm assistant:", error);
    
    // Fallback response if Gemini fails
    return {
      answer: getFallbackResponse(params.question, params.farmContext),
      language: params.farmContext.language,
      timestamp: new Date(),
    };
  }
}

/**
 * Get fallback response when Gemini API is unavailable
 */
function getFallbackResponse(question: string, context: FarmAssistantQuery['farmContext']): string {
  const fallbackResponses = {
    soil: `For ${context.soilType} soil in ${context.location}, I recommend testing pH levels first. ${context.soilType === "Clay" ? "Add organic matter and sand to improve drainage." : "Ensure proper nutrient balance based on your crop requirements."}`,
    irrigation: `For your ${context.farmSize}-hectare farm, consider ${context.farmSize > 10 ? "drip or sprinkler irrigation" : "manual watering with proper scheduling"}. Water in early morning to reduce evaporation.`,
    pest: `For ${context.primaryCrop || "your crops"}, use integrated pest management. Start with neem oil sprays and introduce beneficial insects. Monitor regularly for early detection.`,
    harvest: `Harvest timing depends on crop maturity indicators. For best quality, harvest during cooler parts of the day and handle produce carefully to avoid bruising.`,
    default: `Based on your ${context.experience} level and ${context.farmType} farming in ${context.location}, I recommend consulting local agricultural extension services for specific advice about "${question}".`
  };

  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('soil')) return fallbackResponses.soil;
  if (questionLower.includes('water') || questionLower.includes('irrigation')) return fallbackResponses.irrigation;
  if (questionLower.includes('pest') || questionLower.includes('disease')) return fallbackResponses.pest;
  if (questionLower.includes('harvest')) return fallbackResponses.harvest;
  
  return fallbackResponses.default;
}

/**
 * Generate relevant sources based on question and context
 */
function generateRelevantSources(question: string, context: FarmAssistantQuery['farmContext']): FarmAssistantResponse['sources'] {
  const sources = [
    {
      title: "FAO Sustainable Agriculture Practices",
      url: "https://www.fao.org/sustainable-agriculture",
      relevance: 0.9
    },
    {
      title: `${context.location} Agricultural Extension Service`,
      url: `https://extension.${context.location.toLowerCase().replace(/\s+/g, '')}.gov`,
      relevance: 0.95
    },
    {
      title: "Integrated Pest Management Guide",
      url: "https://www.ipmguides.org",
      relevance: question.toLowerCase().includes('pest') ? 0.85 : 0.6
    },
    {
      title: `${context.primaryCrop || 'Crop'} Production Manual`,
      url: `https://cropmanual.org/${context.primaryCrop?.toLowerCase() || 'general'}`,
      relevance: 0.8
    }
  ];

  return sources.filter(s => s.relevance > 0.7);
}

/**
 * Generate recommendations based on question and context
 */
function generateRecommendations(question: string, context: FarmAssistantQuery['farmContext']): FarmAssistantResponse['recommendations'] {
  const recommendations = [];
  
  // Always include soil health recommendation for crop farms
  if (context.farmType === 'crop' || context.farmType === 'mixed') {
    recommendations.push({
      type: "short_term" as const,
      action: "Conduct soil test to determine pH and nutrient levels",
      priority: "high" as const,
      rationale: "Essential for proper fertilizer application and crop selection"
    });
  }

  // Add water management for larger farms
  if (context.farmSize > 5) {
    recommendations.push({
      type: "long_term" as const,
      action: "Consider installing rainwater harvesting system",
      priority: "medium" as const,
      rationale: "Cost-effective water security for dry seasons"
    });
  }

  // Experience-specific recommendations
  if (context.experience === 'beginner') {
    recommendations.push({
      type: "immediate" as const,
      action: "Start with small plot to practice new techniques",
      priority: "high" as const,
      rationale: "Reduces risk while learning"
    });
  }

  return recommendations.length > 0 ? recommendations : undefined;
}

/**
 * Generate follow-up questions
 */
function generateFollowUpQuestions(question: string, context: FarmAssistantQuery['farmContext']): string[] {
  const baseQuestions = [
    "Would you like more specific information about timing or quantities?",
    "Do you need help implementing this on your specific farm layout?",
    "Are you interested in cost estimates for these recommendations?"
  ];

  const contextQuestions = [
    `How has the recent weather in ${context.location} affected your farm?`,
    `What challenges are you currently facing with your ${context.primaryCrop || context.primaryLivestock || 'farming operations'}?`,
    `Are you looking to expand or diversify your ${context.farmType} farming?`
  ];

  return [...baseQuestions, ...contextQuestions].slice(0, 3);
}

/**
 * Get learning resources based on category and difficulty
 */
export async function getLearningResources(
  category?: FarmAssistantQuery['farmContext']['farmType'],
  difficulty?: FarmAssistantQuery['farmContext']['experience'],
  language: string = "English"
): Promise<LearningResource[]> {
  try {
    // This would typically query a database or external API
    // For now, returning mock data structured for farm learning
    
    const resources: LearningResource[] = [
      {
        id: 1,
        title: "Soil Health and Management",
        description: "Comprehensive guide to soil testing, improvement, and maintenance",
        category: "soil",
        difficulty: "beginner",
        duration: 15,
        language: language,
        tags: ["soil", "fertility", "testing", "organic matter"]
      },
      {
        id: 2,
        title: "Efficient Irrigation Systems",
        description: "Modern irrigation techniques for water conservation",
        category: "irrigation",
        difficulty: "intermediate",
        duration: 20,
        language: language,
        tags: ["water", "irrigation", "conservation", "drip"]
      },
      {
        id: 3,
        title: "Integrated Pest Management",
        description: "Natural and chemical pest control methods",
        category: "pest",
        difficulty: "intermediate",
        duration: 25,
        language: language,
        tags: ["pests", "diseases", "organic", "control"]
      },
      {
        id: 4,
        title: "Harvest and Post-Harvest Handling",
        description: "Best practices for harvesting, storage, and quality maintenance",
        category: "harvest",
        difficulty: "beginner",
        duration: 18,
        language: language,
        tags: ["harvest", "storage", "quality", "preservation"]
      },
      {
        id: 5,
        title: "Farm Business Management",
        description: "Financial planning and marketing for small-scale farmers",
        category: "finance",
        difficulty: "advanced",
        duration: 30,
        language: language,
        tags: ["finance", "marketing", "business", "profit"]
      }
    ];

    // Filter based on parameters
    let filtered = resources.filter(r => r.language === language);
    
    if (category) {
      if (category === 'crop') {
        filtered = filtered.filter(r => 
          ['soil', 'planting', 'irrigation', 'pest', 'harvest', 'storage'].includes(r.category)
        );
      } else if (category === 'livestock') {
        filtered = filtered.filter(r => r.category === 'livestock');
      }
    }
    
    if (difficulty) {
      filtered = filtered.filter(r => r.difficulty === difficulty);
    }

    return filtered;

  } catch (error) {
    console.error("Failed to fetch learning resources:", error);
    return [];
  }
}

/**
 * Save chat conversation for future reference
 */
export async function saveConversation(
  userId: string,
  messages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>
): Promise<boolean> {
  try {
    // In a real implementation, this would save to a database
    console.log(`Saving conversation for user ${userId} with ${messages.length} messages`);
    return true;
  } catch (error) {
    console.error("Failed to save conversation:", error);
    return false;
  }
}

/**
 * Get conversation history for a user
 */
export async function getConversationHistory(
  userId: string,
  limit: number = 50
): Promise<Array<{
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}>> {
  try {
    // This would query your database for previous conversations
    // Returning empty array for now
    return [];
  } catch (error) {
    console.error("Failed to fetch conversation history:", error);
    return [];
  }
}