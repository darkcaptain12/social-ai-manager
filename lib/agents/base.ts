import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { memory } from "@/lib/memory/store";

// ─── TEXT: OpenAI GPT-4o → fallback Gemini 1.5 Flash ─────────────────────────
export async function runAI(systemPrompt: string, userMessage: string): Promise<string> {
  const settings = await memory.getSettings();

  // 1️⃣ Try OpenAI first
  if (settings.openaiApiKey) {
    try {
      const client = new OpenAI({ apiKey: settings.openaiApiKey });
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI] OpenAI failed (${msg}), falling back to Gemini...`);
    }
  }

  // 2️⃣ Fallback: Gemini 1.5 Flash
  if (settings.geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(
        `${systemPrompt}\n\n${userMessage}\n\nRespond with valid JSON only.`
      );
      return result.response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Both OpenAI and Gemini failed. Last error: ${msg}`);
    }
  }

  throw new Error(
    "API key yapılandırılmamış. Ayarlar sayfasından OpenAI veya Gemini API key ekleyin."
  );
}

// ─── IMAGE: Gemini Imagen → fallback DALL-E 3 ────────────────────────────────
export async function generateImageAI(prompt: string): Promise<{
  url?: string;
  base64?: string;
  mimeType?: string;
  source: "gemini" | "openai";
}> {
  const settings = await memory.getSettings();

  // 1️⃣ Gemini Imagen (primary for images)
  if (settings.geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp-image-generation",
      });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        // @ts-expect-error responseModalities is a valid config for image models
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      });

      const parts = result.response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        // @ts-expect-error inlineData exists on image parts
        const inlineData = part.inlineData;
        if (inlineData?.data) {
          return {
            base64: inlineData.data,
            mimeType: inlineData.mimeType ?? "image/png",
            source: "gemini",
          };
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[Image] Gemini Imagen failed (${msg}), falling back to DALL-E...`);
    }
  }

  // 2️⃣ Fallback: OpenAI DALL-E 3
  if (settings.openaiApiKey) {
    const client = new OpenAI({ apiKey: settings.openaiApiKey });
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
      n: 1,
    });
    return {
      url: response.data?.[0]?.url ?? "",
      source: "openai",
    };
  }

  throw new Error(
    "Görsel üretilemedi. Ayarlar'dan Gemini veya OpenAI key ekleyin."
  );
}

// ─── JSON PARSER ──────────────────────────────────────────────────────────────
export function parseJSON<T>(text: string, fallback: T): T {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const raw = match ? match[1] : text;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
