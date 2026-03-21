'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PORTFOLIO_MOVEMENT_EXPLANATION_PROMPT } from "@/lib/inngest/prompts";

export async function generatePortfolioInsight(data: {
  stock_names: string;
  price_changes: string;
  trend: string;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not configured in .env");
    return "AI configuration missing. Please add GEMINI_API_KEY to your .env file.";
  }

  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = PORTFOLIO_MOVEMENT_EXPLANATION_PROMPT
    .replace("{{stock_names}}", data.stock_names || "N/A")
    .replace("{{price_changes}}", data.price_changes || "N/A")
    .replace("{{trend}}", data.trend || "Neutral");

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting portfolio insight with model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
              maxOutputTokens: 100,
          }
      });
      
      const response = await result.response;
      const text = response.text().trim();
      
      if (text) {
        console.log(`Successfully generated insight with ${modelName}`);
        return text;
      }
    } catch (error: any) {
      console.error(`Error with model ${modelName}:`, error?.message || error);
      // Continue to next model if it's a 429 or 404
      if (error?.status === 429) {
          return "Our AI is taking a quick break due to high traffic. Your insights will refresh shortly!";
      }
      // If it's a 404 or other error, try the next model
      continue;
    }
  }

  return "Analyzing your portfolio... We're currently updating our AI models, please check back in a moment.";
}
