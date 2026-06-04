import { generateImageAI } from "./base";
import { memory } from "@/lib/memory/store";

/**
 * Visual Agent
 * Primary:  Gemini Imagen (gemini-2.0-flash-exp-image-generation)
 * Fallback: OpenAI DALL-E 3
 *
 * Returns { url } for OpenAI results (hosted URL)
 *      or { url } for Gemini results (data URL so it can be used in <img>)
 */
export async function generateImage(params: {
  prompt: string;
  size?: "1024x1024" | "1024x1792" | "1792x1024";
}): Promise<{ url: string; source: "gemini" | "openai"; revisedPrompt?: string }> {
  const brand = await memory.getBrand();
  const brandContext = brand
    ? ` Style: modern, professional, Instagram-ready. Brand colors: ${brand.colorPalette.join(", ")}.`
    : " Style: modern, professional, Instagram-ready.";

  const enrichedPrompt = params.prompt + brandContext;
  const result = await generateImageAI(enrichedPrompt);

  // Gemini returns base64 — convert to data URL
  if (result.source === "gemini" && result.base64) {
    const dataUrl = `data:${result.mimeType ?? "image/png"};base64,${result.base64}`;
    return { url: dataUrl, source: "gemini" };
  }

  // OpenAI returns a hosted URL
  return { url: result.url ?? "", source: "openai" };
}

export async function generateMultipleVariants(
  basePrompt: string,
  count = 3
): Promise<string[]> {
  const results: string[] = [];
  for (let i = 0; i < count; i++) {
    try {
      const r = await generateImage({ prompt: `${basePrompt} — variation ${i + 1}` });
      if (r.url) results.push(r.url);
    } catch {
      /* skip failed variants */
    }
  }
  return results;
}
