// src/lib/gemini/client.ts
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";

if (!apiKey) {
  console.warn("⚠️ GEMINI_API_KEY is not set. AI advice will be unavailable.");
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface FarmContext {
  farm: {
    name: string;
    farmType: string;
    totalAreaHa: number;
    cultivableHa?: number | null;
    soilType?: string | null;
    soilPh?: number | null;
    irrigationType?: string | null;
    irrigationSource?: string | null;
    currentCrop?: string | null;
    cropVariety?: string | null;
    plantingDate?: string | null;
    expectedHarvest?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  field?: {
    name?: string | null;
    fieldNumber: string;
    areaHa: number;
    soilType?: string | null;
    soilDepth?: number | null;
    irrigationMethod?: string | null;
  } | null;
  weather?: {
    temperatureC?: number | null;
    humidityPct?: number | null;
    rainfallMm?: number | null;
    forecast3Day?: string | null;
  } | null;
  recentActivity?: Array<{
    activityType: string;
    activityDate: string;
    notes?: string | null;
  }>;
  language?: string;
}

export interface GeminiAdviceResult {
  adviceText: string;
  actionItems: string[];
  confidenceScore: number;
  modelUsed: string;
  rawResponse: any;
}

export const GEMINI_ADVICE_TYPES = [
  "IRRIGATION",
  "FERTILIZER",
  "PEST",
  "DISEASE",
  "PLANTING",
  "HARVEST",
  "GENERAL",
] as const;

export type GeminiAdviceType = (typeof GEMINI_ADVICE_TYPES)[number];

// ============================================================
// PROMPTS
// ============================================================

function buildPrompt(type: GeminiAdviceType, ctx: FarmContext): string {
  const lines: string[] = [];

  lines.push(
    "You are an expert agronomist advising smallholder farmers in Nigeria."
  );
  lines.push(
    "Return only valid JSON, no markdown fences, no extra prose, matching this schema:"
  );
  lines.push(
    '{"advice_text":"string","action_items":["string"],"confidence_score":0.0}'
  );
  lines.push("");
  lines.push(`Advice type: ${type}`);
  lines.push("Farm:");
  lines.push(`- Name: ${ctx.farm.name}`);
  lines.push(`- Type: ${ctx.farm.farmType}`);
  lines.push(`- Total area: ${ctx.farm.totalAreaHa} ha`);
  if (ctx.farm.cultivableHa)
    lines.push(`- Cultivable area: ${ctx.farm.cultivableHa} ha`);
  if (ctx.farm.soilType) lines.push(`- Soil type: ${ctx.farm.soilType}`);
  if (ctx.farm.soilPh != null) lines.push(`- Soil pH: ${ctx.farm.soilPh}`);
  if (ctx.farm.irrigationType)
    lines.push(`- Irrigation: ${ctx.farm.irrigationType}`);
  if (ctx.farm.irrigationSource)
    lines.push(`- Water source: ${ctx.farm.irrigationSource}`);
  if (ctx.farm.currentCrop)
    lines.push(`- Current crop: ${ctx.farm.currentCrop}`);
  if (ctx.farm.cropVariety)
    lines.push(`- Crop variety: ${ctx.farm.cropVariety}`);
  if (ctx.farm.plantingDate)
    lines.push(`- Planting date: ${ctx.farm.plantingDate}`);
  if (ctx.farm.expectedHarvest)
    lines.push(`- Expected harvest: ${ctx.farm.expectedHarvest}`);
  if (ctx.farm.latitude != null && ctx.farm.longitude != null)
    lines.push(`- GPS: ${ctx.farm.latitude}, ${ctx.farm.longitude}`);

  if (ctx.field) {
    lines.push("Field:");
    lines.push(
      `- ${ctx.field.name ?? "Unnamed"} (#${ctx.field.fieldNumber}), ${ctx.field.areaHa} ha`
    );
    if (ctx.field.soilType)
      lines.push(`- Field soil: ${ctx.field.soilType}`);
    if (ctx.field.soilDepth != null)
      lines.push(`- Soil depth: ${ctx.field.soilDepth} cm`);
    if (ctx.field.irrigationMethod)
      lines.push(`- Irrigation: ${ctx.field.irrigationMethod}`);
  }

  if (ctx.weather) {
    lines.push("Weather:");
    if (ctx.weather.temperatureC != null)
      lines.push(`- Temperature: ${ctx.weather.temperatureC}°C`);
    if (ctx.weather.humidityPct != null)
      lines.push(`- Humidity: ${ctx.weather.humidityPct}%`);
    if (ctx.weather.rainfallMm != null)
      lines.push(`- Rainfall: ${ctx.weather.rainfallMm} mm`);
    if (ctx.weather.forecast3Day)
      lines.push(`- 3-day forecast: ${ctx.weather.forecast3Day}`);
  }

  if (ctx.recentActivity?.length) {
    lines.push("Recent activity:");
    for (const a of ctx.recentActivity.slice(0, 5)) {
      lines.push(`- ${a.activityDate}: ${a.activityType}`);
    }
  }

  lines.push("");
  lines.push(
    `Respond in ${ctx.language ?? "ENGLISH"}. Advice text should be 3–6 sentences. Provide 3–6 concrete action items for the next 7 days. Confidence between 0 and 1.`
  );

  return lines.join("\n");
}

// ============================================================
// PUBLIC API — Interactions API
// ============================================================

export async function generateFarmAdvice(
  type: GeminiAdviceType,
  ctx: FarmContext
): Promise<GeminiAdviceResult> {
  if (!ai) {
    throw new Error("Gemini is not configured (missing GEMINI_API_KEY)");
  }

  const prompt = buildPrompt(type, ctx);

  // Interactions API: model + input, returns an "interaction" with output_text
  const interaction = await ai.interactions.create({
    model: modelName,
    input: prompt,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: {
        type: "object",
        properties: {
          advice_text: { type: "string" },
          action_items: { type: "array", items: { type: "string" } },
          confidence_score: { type: "number" },
        },
        required: ["advice_text", "action_items"],
      },
    },
  });

  const rawText: string =
    (interaction as any).output_text ??
    (interaction as any)?.outputText ??
    "";

  const clean = String(rawText)
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(clean);
  } catch {
    return {
      adviceText: clean || rawText,
      actionItems: [],
      confidenceScore: 0.5,
      modelUsed: modelName,
      rawResponse: interaction,
    };
  }

  return {
    adviceText: String(parsed.advice_text ?? parsed.adviceText ?? clean),
    actionItems: Array.isArray(parsed.action_items ?? parsed.actionItems)
      ? (parsed.action_items ?? parsed.actionItems).map(String)
      : [],
    confidenceScore:
      typeof parsed.confidence_score === "number"
        ? parsed.confidence_score
        : typeof parsed.confidenceScore === "number"
          ? parsed.confidenceScore
          : 0.6,
    modelUsed: modelName,
    rawResponse: interaction,
  };
}