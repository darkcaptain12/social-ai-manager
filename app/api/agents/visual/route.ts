import { NextRequest, NextResponse } from "next/server";
import { generateImage, generateMultipleVariants } from "@/lib/agents/visualAgent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    if (action === "generate") {
      const result = await generateImage(payload);
      return NextResponse.json({ success: true, ...result });
    }

    if (action === "variants") {
      const urls = await generateMultipleVariants(payload.prompt, payload.count ?? 3);
      return NextResponse.json({ success: true, urls });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
