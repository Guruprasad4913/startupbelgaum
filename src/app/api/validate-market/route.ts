import { NextRequest, NextResponse } from "next/server";
import { validateMarketIdea } from "@/lib/ai-engine";
import { fetchLiveMarketSignals } from "@/lib/market-api";
import { StartupIdea, FounderProfile } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idea, profile, apiKey, tavilyApiKey } = body as {
      idea: StartupIdea;
      profile: FounderProfile;
      apiKey?: string;
      tavilyApiKey?: string;
    };

    if (!idea || !idea.id) {
      return NextResponse.json({ error: "Valid startup idea is required." }, { status: 400 });
    }

    // 1. Run live market signals and validation concurrently for ultra-fast response
    const signalsPromise = fetchLiveMarketSignals(
      idea.domain,
      idea.tags || [],
      tavilyApiKey,
      idea.name
    ).catch((e) => {
      console.warn("Live market signals fetch error:", e);
      return { trends: [], tavilyAnswer: undefined, usedTavily: false };
    });

    const validationPromise = validateMarketIdea(idea, profile, {
      apiKey,
      tavilyApiKey,
    }).catch((e) => {
      console.warn("Validation error:", e);
      return null;
    });

    const [liveSignals, preliminaryValidation] = await Promise.all([
      signalsPromise,
      validationPromise,
    ]);

    let validation = preliminaryValidation;
    if (!validation) {
      validation = await validateMarketIdea(idea, profile, { apiKey });
    }

    // 2. Attach Tavily indicators and verified citations
    if (liveSignals.usedTavily) {
      validation.usedTavily = true;
      if (liveSignals.tavilyAnswer) {
        validation.tavilyResearchSummary = liveSignals.tavilyAnswer;
      }
    }

    if (liveSignals.trends && liveSignals.trends.length > 0) {
      validation.realTimeTrends = liveSignals.trends.slice(0, 4);
    }

    return NextResponse.json({ success: true, validation });
  } catch (error: any) {
    console.error("Error in validate-market route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to validate market" },
      { status: 500 }
    );
  }
}

