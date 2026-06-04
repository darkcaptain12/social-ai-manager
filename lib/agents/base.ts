import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { memory } from "@/lib/memory/store";

// ─── TEXT: OpenAI GPT-4o → fallback Gemini 1.5 Flash ─────────────────────────
const TR_SUFFIX = "\n\nÖNEMLİ: Tüm metin içerikleri (açıklamalar, öneriler, analizler, hook'lar, caption'lar, başlıklar) MUTLAKA TÜRKÇE olmalı. JSON key'leri İngilizce kalabilir ama value'lar Türkçe olmalı.";

export async function runAI(systemPrompt: string, userMessage: string): Promise<string> {
  const settings = await memory.getSettings();

  // 1️⃣ Try OpenAI first
  if (settings.openaiApiKey) {
    try {
      const client = new OpenAI({ apiKey: settings.openaiApiKey });
      const response = await client.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt + TR_SUFFIX },
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
        `${systemPrompt}${TR_SUFFIX}\n\n${userMessage}\n\nSadece geçerli JSON döndür.`
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] } as any,
      });

      const parts = result.response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inlineData = (part as any).inlineData;
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

  // 2️⃣ Fallback: OpenAI image generation (tries gpt-image-1, then dall-e-3, then dall-e-2)
  if (settings.openaiApiKey) {
    const client = new OpenAI({ apiKey: settings.openaiApiKey });

    const imageModels = ["gpt-image-1", "dall-e-3", "dall-e-2"];
    for (const model of imageModels) {
      try {
        const params: Parameters<typeof client.images.generate>[0] = {
          model,
          prompt,
          n: 1,
        };

        // gpt-image-1 uses different size/quality params
        if (model === "gpt-image-1") {
          params.size = "1024x1024";
          params.quality = "standard";
        } else if (model === "dall-e-3") {
          params.size = "1024x1024";
          params.quality = "hd";
        } else {
          params.size = "512x512";
        }

        const response = await client.images.generate(params);

        // gpt-image-1 returns base64, others return url
        const img = response.data?.[0];
        if (img) {
          if ("b64_json" in img && img.b64_json) {
            return {
              url: `data:image/png;base64,${img.b64_json}`,
              source: "openai",
            };
          } else if (img.url) {
            return { url: img.url, source: "openai" };
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[Image] ${model} failed: ${msg}`);
        // Try next model
      }
    }
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
