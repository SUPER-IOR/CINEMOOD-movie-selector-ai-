import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MovieRecommendation {
  title: string;
  year: string;
  vibe: string;
  explanation: string;
  streamingPlatform: string;
}

export interface CineResponse {
  recommendations: MovieRecommendation[];
  acknowledgment?: string;
}

export async function getMovieRecommendations(
  userPrompt: string, 
  industry: string = 'Hollywood',
  energyLevel: number = 50,
  streamingService: string = 'Any'
): Promise<CineResponse> {
  const energyContext = energyLevel < 30 
    ? "Suggest slow-burn, meditative, or deeply relaxing films. The user needs to unwind or sleep."
    : energyLevel > 70 
    ? "Suggest fast-paced, high-octane, or intensely exciting films. The user needs high energy and adrenaline."
    : "Suggest films with a balanced pace, neither too slow nor overwhelming.";

  const systemInstruction = `
    You are CineMood, a highly intuitive film expert specializing in mood-based curation.
    Your task is to receive a user's current mood and recommend exactly 3 movies from the ${industry} film industry.

    Current Context:
    - Target Industry: ${industry}
    - Energy Level: ${energyLevel}/100. ${energyContext}
    - Preferred Streaming Realm: ${streamingService}

    For each movie, provide:
    1. Title and Year.
    2. The "Vibe" (A short, evocative phrase).
    3. A brief explanation of why this movie aligns with the mood AND energy level (under 50 words).
    4. "Streaming Location": Note where this is typically available (e.g., "${streamingService}", "Netflix", "Rental"), or advise to check local listings.

    Constraints:
    - ONLY recommend movies from the ${industry} industry.
    - Choose movies that are accessible but critically well-regarded.
    - Return output strictly in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["recommendations"],
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "year", "vibe", "explanation", "streamingPlatform"],
                properties: {
                  title: { type: Type.STRING },
                  year: { type: Type.STRING },
                  vibe: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  streamingPlatform: { type: Type.STRING },
                },
              },
            },
            acknowledgment: { type: Type.STRING },
          },
        },
      },
    });

    if (!response.text) {
      throw new Error("Empty response from AI");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    throw error;
  }
}
