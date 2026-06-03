import OpenAI from "openai";
import { memory } from "@/lib/memory/store";

export async function generateImage(params: {
  prompt: string;
  style?: "natural" | "vivid";
  size?: "1024x1024" | "1024x1792" | "1792x1024";
}): Promise<{ url: string; revisedPrompt?: string }> {
  const settings = memory.getSettings();
  if (!settings.openaiApiKey) throw new Error("OpenAI API key not configured");

  const client = new OpenAI({ apiKey: settings.openaiApiKey });
  const brand = memory.getBrand();

  // Enrich prompt with brand colors/style
  const brandContext = brand
    ? ` Brand colors: ${brand.colorPalette.join(", ")}. Style: modern, professional, Instagram-ready.`
    : "";

  const enrichedPrompt = params.prompt + brandContext;

  const response = await client.images.generate({
    model: "dall-e-3",
    prompt: enrichedPrompt,
    size: params.size ?? "1024x1024",
    quality: "hd",
    style: params.style ?? "vivid",
    n: 1,
  });

  return {
    url: response.data[0].url ?? "",
    revisedPrompt: response.data[0].revised_prompt,
  };
}

export async function generateMultipleVariants(
  basePrompt: string,
  count: number = 3
): Promise<string[]> {
  const settings = memory.getSettings();
  if (!settings.openaiApiKey) throw new Error("OpenAI API key not configured");

  const client = new OpenAI({ apiKey: settings.openaiApiKey });
  const urls: string[] = [];

  const styles: Array<"vivid" | "natural"> = ["vivid", "natural", "vivid"];
  for (let i = 0; i < Math.min(count, 3); i++) {
    try {
      const response = await client.images.generate({
        model: "dall-e-3",
        prompt: `${basePrompt} - variation ${i + 1}`,
        size: "1024x1024",
        quality: "standard",
        style: styles[i],
        n: 1,
      });
      if (response.data[0].url) urls.push(response.data[0].url);
    } catch {
      // Skip failed variants
    }
  }
  return urls;
}
