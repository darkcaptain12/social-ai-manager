import { runAI, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { ContentItem, ContentType, ContentObjective } from "@/types";

const SYSTEM = `You are a Professional Instagram Copywriting Agent. Write high-converting captions with strong hooks and CTAs. Match brand tone. ALWAYS return valid JSON only.`;

export async function generateCopy(input: {
  type: ContentType; objective: ContentObjective;
  topic: string; pillar?: string; additionalContext?: string;
}): Promise<ContentItem> {
  const brand = await memory.getBrand();
  const history = (await memory.getContentHistory()).slice(-20);
  const strategy = await memory.getStrategy();
  const recentTopics = history.map((c) => c.hook).slice(0, 10);

  const prompt = `Write Instagram ${input.type} copy for this brand.
Brand tone: ${brand?.toneOfVoice ?? "professional"}
Keywords: ${brand?.keywords?.join(", ") ?? ""}
Audience: ${brand?.targetAudience ?? "general"}
Language: ${brand?.language ?? "tr"}
Type: ${input.type} | Objective: ${input.objective}
Topic: ${input.topic}
Pillar: ${input.pillar ?? "general"}
Context: ${input.additionalContext ?? "none"}
AVOID repeating: ${recentTopics.join("; ")}
Return JSON:
{
  "caption": string (full ${brand?.language === "en" ? "English" : "Turkish"} caption),
  "hook": string (first line, max 125 chars),
  "cta": string,
  "hashtags": [20-25 without #],
  "imagePrompt": string (detailed DALL-E prompt)
}`;

  const raw = await runAI(SYSTEM, prompt);
  const parsed = parseJSON<Partial<ContentItem>>(raw, {});

  const item: ContentItem = {
    id: generateId(),
    type: input.type,
    status: "draft",
    objective: input.objective,
    caption: parsed.caption ?? "",
    hook: parsed.hook ?? "",
    cta: parsed.cta ?? "",
    hashtags: parsed.hashtags ?? [],
    imagePrompt: parsed.imagePrompt,
    pillar: input.pillar ?? strategy?.pillars?.[0]?.name,
    createdAt: new Date().toISOString(),
  };

  await memory.addContent(item);
  return item;
}

export async function checkDuplication(hook: string): Promise<{
  isDuplicate: boolean; similarityScore: number; suggestion?: string;
}> {
  const history = await memory.getContentHistory();
  if (history.length === 0) return { isDuplicate: false, similarityScore: 0 };

  const prompt = `Check if this hook is too similar to recent content.
New: "${hook}"
Recent:\n${history.slice(-30).map((c, i) => `${i + 1}. "${c.hook}"`).join("\n")}
Return JSON: { "isDuplicate": boolean, "similarityScore": 0-100, "suggestion": string }`;

  const raw = await runAI(SYSTEM, prompt);
  return parseJSON(raw, { isDuplicate: false, similarityScore: 0 });
}
