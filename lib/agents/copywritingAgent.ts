import { runClaude, parseJSON } from "./base";
import { memory } from "@/lib/memory/store";
import { generateId } from "@/lib/utils";
import type { ContentItem, ContentType, ContentObjective } from "@/types";

const SYSTEM = `You are a Professional Instagram Copywriting Agent.
Write high-converting, engaging Instagram captions with strong hooks and CTAs.
Always match the brand's tone of voice. ALWAYS return valid JSON only.`;

export async function generateCopy(input: {
  type: ContentType;
  objective: ContentObjective;
  topic: string;
  pillar?: string;
  additionalContext?: string;
}): Promise<ContentItem> {
  const brand = memory.getBrand();
  const history = memory.getContentHistory().slice(-20);
  const strategy = memory.getStrategy();

  const recentTopics = history.map((c) => c.hook).slice(0, 10);

  const prompt = `Write Instagram ${input.type} copy for this brand.

Brand tone: ${brand?.toneOfVoice ?? "professional"}
Brand keywords: ${brand?.keywords?.join(", ") ?? ""}
Target audience: ${brand?.targetAudience ?? "general"}
Language: ${brand?.language ?? "tr"}

Content request:
- Type: ${input.type}
- Objective: ${input.objective}
- Topic: ${input.topic}
- Content pillar: ${input.pillar ?? "general"}
- Additional context: ${input.additionalContext ?? "none"}

Recent topics to AVOID repeating: ${recentTopics.join("; ")}

Return JSON:
{
  "caption": string (full Instagram caption, ${brand?.language === "en" ? "English" : "Turkish"}, engaging, ${input.type === "reel" ? "short punchy" : "detailed"}),
  "hook": string (first line that grabs attention, max 125 chars),
  "cta": string (clear call to action),
  "hashtags": [20-25 relevant hashtags without #],
  "imagePrompt": string (detailed Stable Diffusion / DALL-E image prompt for this post)
}`;

  const raw = await runClaude(SYSTEM, prompt);
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

  memory.addContent(item);
  return item;
}

export async function checkDuplication(
  hook: string
): Promise<{ isDuplicate: boolean; similarityScore: number; suggestion?: string }> {
  const history = memory.getContentHistory();
  if (history.length === 0) return { isDuplicate: false, similarityScore: 0 };

  const prompt = `Check if this new content hook is too similar to recent content.

New hook: "${hook}"

Recent hooks:
${history
  .slice(-30)
  .map((c, i) => `${i + 1}. "${c.hook}"`)
  .join("\n")}

Return JSON:
{
  "isDuplicate": boolean,
  "similarityScore": 0-100,
  "suggestion": string (if duplicate, suggest alternative angle)
}`;

  const raw = await runClaude(SYSTEM, prompt);
  return parseJSON(raw, { isDuplicate: false, similarityScore: 0 });
}
