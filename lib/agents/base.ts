import OpenAI from "openai";
import { memory } from "@/lib/memory/store";

// ─── SINGLE AI CLIENT (OpenAI / GPT-4o) ──────────────────────────────────────
async function getClient() {
  const settings = await memory.getSettings();
  if (!settings.openaiApiKey) throw new Error("OpenAI API key ayarlanmamış. Ayarlar sayfasından ekleyin.");
  return new OpenAI({ apiKey: settings.openaiApiKey });
}

/**
 * Primary AI runner — used by all agents.
 * Always returns a string (JSON expected from the model).
 */
export async function runAI(systemPrompt: string, userMessage: string): Promise<string> {
  const client = await getClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  return response.choices[0].message.content ?? "{}";
}

/**
 * Parse JSON from model output. Falls back to `fallback` on error.
 */
export function parseJSON<T>(text: string, fallback: T): T {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const raw = match ? match[1] : text;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
