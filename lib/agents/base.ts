import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { memory } from "@/lib/memory/store";
import type { Settings } from "@/types";

export function getAIClient(settings: Settings) {
  if (settings.anthropicApiKey) {
    return new Anthropic({ apiKey: settings.anthropicApiKey });
  }
  return null;
}

export function getOpenAIClient(settings: Settings) {
  if (settings.openaiApiKey) {
    return new OpenAI({ apiKey: settings.openaiApiKey });
  }
  return null;
}

export async function runClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const settings = await memory.getSettings();
  const client = getAIClient(settings);
  if (!client) throw new Error("Anthropic API key not configured");

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  return content.text;
}

export async function runGPT(systemPrompt: string, userMessage: string): Promise<string> {
  const settings = await memory.getSettings();
  const client = getOpenAIClient(settings);
  if (!client) throw new Error("OpenAI API key not configured");

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_object" },
  });

  return response.choices[0].message.content ?? "{}";
}

export function parseJSON<T>(text: string, fallback: T): T {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const raw = match ? match[1] : text;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
