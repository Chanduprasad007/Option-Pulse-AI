import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface MarketAnalysis {
  sentiment: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  reasoning: string;
  suggestedStrategy: string;
  keyEvents: string[];
  riskLevel: "Low" | "Medium" | "High";
}

let lastMarketPrices: any[] = [];
let lastAnalysis: MarketAnalysis | null = null;

export async function analyzeMarket(marketData: any, news: string[]): Promise<MarketAnalysis> {
  const prompt = `
    As a professional options trader and market analyst, analyze the following market data and world news to provide an options expiry strategy for Nifty, Bank Nifty, and Sensex.
    
    Market Data:
    ${JSON.stringify(marketData, null, 2)}
    
    Recent World Events/News:
    ${news.join("\n")}
    
    Provide a detailed analysis including:
    1. Overall market sentiment.
    2. Confidence level (0-100).
    3. Reasoning based on events and data.
    4. Suggested options strategy (e.g., Bull Call Spread, Iron Condor, etc.).
    5. Key events impacting the market.
    6. Risk level.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            suggestedStrategy: { type: Type.STRING },
            keyEvents: { type: Type.ARRAY, items: { type: Type.STRING } },
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
          },
          required: ["sentiment", "confidence", "reasoning", "suggestedStrategy", "keyEvents", "riskLevel"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    lastAnalysis = result;
    return result;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429) {
      if (lastAnalysis) return lastAnalysis;
    }
    throw new Error("Failed to analyze market data. Rate limit might have been exceeded.");
  }
}

export async function getCurrentMarketPrices(): Promise<{ name: string; value: number; change: number; changePercent: number }[]> {
  const prompt = `
    Search for the absolute latest live market prices for the following Indian indices:
    1. NIFTY 50
    2. BANK NIFTY
    3. SENSEX
    
    Use reliable sources like NSE India, Google Finance, or Yahoo Finance. 
    Ensure the data is from the current trading session (if open) or the last closing price.
    
    Return the data in a JSON array format with exactly these fields:
    {
      "name": string,
      "value": number (current price),
      "change": number (absolute change),
      "changePercent": number (percentage change)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              value: { type: Type.NUMBER },
              change: { type: Type.NUMBER },
              changePercent: { type: Type.NUMBER },
            },
            required: ["name", "value", "change", "changePercent"],
          },
        },
      },
    });

    const result = JSON.parse(response.text || "[]");
    if (result.length > 0) {
      lastMarketPrices = result;
    }
    return result;
  } catch (error: any) {
    console.error("Failed to fetch live prices:", error);
    if (error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429) {
      return lastMarketPrices;
    }
    return lastMarketPrices;
  }
}
