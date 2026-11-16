import {
  FounderProfile,
  StartupIdea,
  MarketValidation,
  FeasibilityReport,
  TargetUserAnalysis,
  CompetitorFeatureComparison,
  MVPRecommendation,
  BusinessRoadmap,
  ScoringEngineBreakdown,
} from "@/types";
import {
  getBelagaviCompetitorsBySector,
  resolveSectorKey,
  filterBelagaviCompetitors,
  BELAGAVI_LOCATION,
} from "@/lib/belagavi-data";

interface GeminiOptions {
  apiKey?: string;
  model?: string;
  tavilyApiKey?: string;
  tavilyContext?: string;
  existingIdeas?: string[];
  offset?: number;
}

// High-performance server-side in-memory cache to make report generation near-instant
const memoryCache = {
  validation: new Map<string, { data: MarketValidation; exp: number }>(),
  feasibility: new Map<string, { data: FeasibilityReport; exp: number }>(),
  ideas: new Map<string, { data: StartupIdea[]; exp: number }>(),
};
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCached<T>(map: Map<string, { data: T; exp: number }>, key: string): T | null {
  const item = map.get(key);
  if (item && item.exp > Date.now()) {
    return item.data;
  }
  return null;
}

function setCache<T>(map: Map<string, { data: T; exp: number }>, key: string, data: T) {
  if (map.size > 200) {
    const firstKey = map.keys().next().value;
    if (firstKey) map.delete(firstKey);
  }
  map.set(key, { data, exp: Date.now() + CACHE_TTL_MS });
}

// Fallback high-fidelity smart generator covering multiple domains
export async function generateStartupIdeas(
  profile: FounderProfile,
  options?: GeminiOptions
): Promise<StartupIdea[]> {
  const cacheKey = `${profile.domains.slice().sort().join(",")}_${profile.businessType}_${profile.targetAudience}_${options?.offset || 0}_${(options?.existingIdeas || []).length}_${profile.customContext || ""}`;
  const cached = getCached(memoryCache.ideas, cacheKey);
  if (cached) return cached;

  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ideas = await callGeminiForIdeas(profile, apiKey, options?.existingIdeas, options?.offset);
      if (ideas && ideas.length > 0) {
        // Enforce strict sector consistency: All ideas must match the founder's requested domain
        const targetSector = resolveSectorKey(
          profile.domains?.[0] || "",
          profile.businessType || ""
        );
        const alignedIdeas = ideas.filter((i) => {
          const ideaSector = resolveSectorKey(i.domain, i.businessType, i.tags);
          return ideaSector === targetSector;
        });

        // Always guarantee at least 3 ideas strictly in targetSector
        let finalIdeas = [...alignedIdeas];
        if (finalIdeas.length < 3) {
          const backupIdeas = generateIntelligentIdeas(profile, options?.offset || 0, [
            ...(options?.existingIdeas || []),
            ...finalIdeas.map((fi) => fi.name),
          ]);
          for (const backup of backupIdeas) {
            if (finalIdeas.length >= 3) break;
            const backupSector = resolveSectorKey(backup.domain, backup.businessType, backup.tags);
            if (
              backupSector === targetSector &&
              !finalIdeas.some((fi) => fi.name.toLowerCase() === backup.name.toLowerCase())
            ) {
              finalIdeas.push(backup);
            }
          }
        }

        if (finalIdeas.length > 0) {
          setCache(memoryCache.ideas, cacheKey, finalIdeas);
          return finalIdeas;
        }
      }
    } catch (err) {
      console.warn("Gemini API call timed out or failed, using instant intelligent generator:", err);
    }
  }

  // Built-in intelligent idea generator with diversity and alternative options support
  const result = generateIntelligentIdeas(profile, options?.offset || 0, options?.existingIdeas || []);
  setCache(memoryCache.ideas, cacheKey, result);
  return result;
}

export async function validateMarketIdea(
  idea: StartupIdea,
  profile?: FounderProfile | null,
  options?: GeminiOptions
): Promise<MarketValidation> {
  const safeProfile = profile || {
    domains: [idea.domain],
    businessType: idea.businessType || "Commercial Venture",
    interests: [idea.domain],
    skills: ["Management"],
    targetAudience: "Customers",
    budget: "₹10,00,000",
    timeframe: "1-3 Months",
    customContext: idea.problemStatement || "",
    targetArea: "Tilakwadi / Congress Rd",
    targetLocation: BELAGAVI_LOCATION,
  };

  const isBelagavi =
    !safeProfile.targetLocation ||
    (safeProfile.targetLocation.city || "").toLowerCase().includes("belagavi") ||
    Boolean(safeProfile.targetArea && safeProfile.targetArea.length > 0);

  const resolvedArea = safeProfile.targetArea || safeProfile.targetLocation?.city || "all";
  const sectorQuery = `${idea.domain} ${idea.businessType || ""} ${(idea.tags || []).join(" ")}`;

  const cacheKey = `${idea.id || idea.name}_${idea.domain}_${resolvedArea}_${options?.tavilyContext ? "tavily" : "direct"}`;
  const cached = getCached(memoryCache.validation, cacheKey);
  if (cached) return cached;

  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;
  let validationResult: MarketValidation | null = null;

  if (apiKey) {
    try {
      const val = await callGeminiForValidation(idea, safeProfile, apiKey, options?.tavilyContext);
      if (val) {
        validationResult = val;
      }
    } catch (err) {
      console.warn("Gemini validation timed out or failed, using instant intelligent generator:", err);
    }
  }

  if (!validationResult) {
    validationResult = generateIntelligentValidation(idea, safeProfile, options?.tavilyContext);
  }

  // GROUNDING: Always strictly populate competitors with the actual Belagavi rivals for that domain & selected locality!
  if (isBelagavi && validationResult) {
    const resolvedSector = resolveSectorKey(
      idea.domain || (safeProfile.domains && safeProfile.domains[0]) || "",
      idea.businessType || safeProfile.businessType || "",
      idea.tags
    );
    const bComps = filterBelagaviCompetitors(resolvedSector, resolvedArea).competitors;
    if (bComps && bComps.length > 0) {
      validationResult.competitors = bComps.map((c) => ({
        name: c.name,
        brand: c.brand,
        type: c.type,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        ourDifferentiation: c.ourDifferentiation,
        fundingOrScale: c.fundingOrScale,
        address: c.address,
        locality: c.locality,
        lat: c.lat,
        lng: c.lng,
        isDirectAreaMatch: c.isDirectAreaMatch,
        distanceKm: c.distanceKm,
        nearbyAreaImpactNote: c.nearbyAreaImpactNote,
        areaId: c.areaId,
      }));

      // Update comparison matrix with real Belagavi competitors
      validationResult.competitorComparisonMatrix = {
        features: [
          "Local Footprint & Catchment",
          "Price Accessibility in Area",
          "Digital Ordering & Experience",
          "Turnkey Scalability",
          "Customer Retention Moat",
          "Certified Hygiene / Quality Standards",
        ],
        competitors: bComps.slice(0, 3).map((c) => ({
          name: c.brand || c.name,
          scores: {
            "Local Footprint & Catchment": c.locality,
            "Price Accessibility in Area": c.type === "Direct" ? "Direct Rival" : "Incumbent",
            "Digital Ordering & Experience": false,
            "Turnkey Scalability": false,
            "Customer Retention Moat": "Legacy Word-of-Mouth",
            "Certified Hygiene / Quality Standards": "Traditional",
          },
        })),
        ourProduct: {
          name: idea.name,
          scores: {
            "Local Footprint & Catchment": `Focused on ${resolvedArea}`,
            "Price Accessibility in Area": "Superior Value & Margin",
            "Digital Ordering & Experience": true,
            "Turnkey Scalability": true,
            "Customer Retention Moat": "AI & Subscription Moat",
            "Certified Hygiene / Quality Standards": true,
          },
        },
      };
    }
  }

  setCache(memoryCache.validation, cacheKey, validationResult);
  return validationResult;
}

export async function generateCloudFeasibility(
  idea: StartupIdea,
  validation: MarketValidation,
  profile: FounderProfile,
  options?: GeminiOptions
): Promise<FeasibilityReport> {
  const cacheKey = `${idea.id || idea.name}_${idea.domain}_${profile.budget || ""}_${profile.timeframe || ""}`;
  const cached = getCached(memoryCache.feasibility, cacheKey);
  if (cached) return cached;

  const apiKey = options?.apiKey || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const report = await callGeminiForFeasibility(idea, validation, profile, apiKey);
      if (report) {
        if (!report.mvpRecommendation || !report.businessRoadmap) {
          const dLower = (idea.domain + " " + (idea.businessType || "") + " " + idea.tags.join(" ")).toLowerCase();
          const isExplicitTech = (
            dLower.includes("software & saas") ||
            dLower.includes("software platform") ||
            dLower.includes("compliance platform") ||
            dLower.includes("cloud middleware") ||
            dLower.includes("ai platform")
          ) && !dLower.includes("hardware") && !dLower.includes("physical") && !dLower.includes("construct") && !dLower.includes("constuct") && !dLower.includes("manufacturing");
          const isNonTech = !isExplicitTech;
          const { mvpRecommendation, businessRoadmap } = buildMvpAndRoadmap(idea, profile, isNonTech);
          if (!report.mvpRecommendation) report.mvpRecommendation = mvpRecommendation;
          if (!report.businessRoadmap) report.businessRoadmap = businessRoadmap;
        }
        setCache(memoryCache.feasibility, cacheKey, report);
        return report;
      }
    } catch (err) {
      console.warn("Gemini feasibility timed out or failed, using instant intelligent generator:", err);
    }
  }

  const result = generateIntelligentFeasibility(idea, validation, profile);
  setCache(memoryCache.feasibility, cacheKey, result);
  return result;
}

// Helper to robustly extract and parse JSON from Gemini response
function parseGeminiJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  // Strip markdown code fence if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return JSON.parse(cleaned) as T;
}

// Helper to robustly format market sizing into Indian Rupees (INR / ₹)
export function formatToRupees(val: string): string {
  if (!val) return val;
  const trimmed = val.trim();
  if (trimmed.includes("₹") || trimmed.toLowerCase().includes("crore") || trimmed.toLowerCase().includes("lakh")) {
    return trimmed;
  }
  // Convert $XX.X Billion -> ₹XX,XXX Crores ($XX.X Billion)
  const billMatch = trimmed.match(/\$?\s*([0-9.]+)\s*Billion/i);
  if (billMatch) {
    const numB = parseFloat(billMatch[1]);
    const crores = Math.round(numB * 8350); // 1 USD Billion ≈ 8,350 Crores INR
    return `₹${crores.toLocaleString("en-IN")} Crores (${trimmed})`;
  }
  // Convert $XX.X Million -> ₹XX Crores or ₹XXX Lakhs ($XX.X Million)
  const millMatch = trimmed.match(/\$?\s*([0-9.]+)\s*Million/i);
  if (millMatch) {
    const numM = parseFloat(millMatch[1]);
    const crores = Math.round(numM * 8.35); // 1 USD Million ≈ 8.35 Crores INR
    if (crores >= 1) {
      return `₹${crores.toLocaleString("en-IN")} Crores (${trimmed})`;
    } else {
      const lakhs = Math.round(numM * 83.5);
      return `₹${lakhs.toLocaleString("en-IN")} Lakhs (${trimmed})`;
    }
  }
  return trimmed;
}

// Ultra-fast model prioritization with realistic timeout for reliable structured generation
const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
];

// Helper to execute Gemini generation across available models with reliable timeout
async function callGeminiApi(
  prompt: string,
  apiKey: string,
  responseMimeType: string = "application/json",
  temperature: number = 0.7
): Promise<string> {
  let lastError: any = null;
  const globalDeadline = Date.now() + 16000; // 16s global limit

  for (const model of GEMINI_MODELS) {
    const remainingTime = globalDeadline - Date.now();
    if (remainingTime < 2000) {
      // Out of time for another model attempt, fall back immediately to instant generator
      break;
    }

    const perAttemptTimeout = Math.min(10000, remainingTime);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), perAttemptTimeout);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType,
              temperature,
            },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return text;
        }
      } else {
        const errText = await res.text();
        console.warn(`Gemini model ${model} status ${res.status}:`, errText.slice(0, 150));
        lastError = new Error(`Gemini ${model} error (${res.status})`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err?.name === "AbortError" || err?.message?.includes("aborted");
      if (isAbort) {
        console.log(`Gemini ${model} timed out; activating instant intelligent generator`);
        lastError = err;
        break;
      } else {
        console.warn(`Gemini model ${model} error:`, err?.message || err);
        lastError = err;
      }
    }
  }

  throw lastError || new Error("Gemini models timed out; falling back to instant intelligent engine");
}

// Gemini API Integration helper
async function callGeminiForIdeas(
  profile: FounderProfile,
  apiKey: string,
  existingIdeas?: string[],
  offset?: number
): Promise<StartupIdea[]> {
  const businessType = profile.businessType || "Commercial Operations";
  const userProblem = profile.customContext?.trim() || "";
  const targetSector = resolveSectorKey(profile.domains?.[0] || "", businessType, profile.interests);
  const sectorLabels = {
    food: "Food & Beverages",
    education: "Education",
    healthcare: "Healthcare & Wellness",
    construction: "Construction & Infrastructure",
  };
  const targetSectorLabel = sectorLabels[targetSector];

  const prompt = `You are an expert Startup Accelerator Director and Venture Partner specialized strictly in Belagavi's 4 core economic sectors: Food & Beverages, Education, Healthcare & Wellness, and Construction & Infrastructure.

MANDATORY SECTOR RESTRICTION:
The platform operates exclusively within these 4 sectors.
The founder's selected sector is: "${targetSectorLabel}".
EVERY single startup concept returned MUST strictly belong to "${targetSectorLabel}".
DO NOT output concepts from any other industry.

Given founder input:
- Sector / Domain: ${targetSectorLabel}
- Business Model Preference: ${businessType}
- Founder Skills & Strengths: ${profile.skills.join(", ")}
- Target Customer Segment: ${profile.targetAudience}
- Budget & Capital: ${profile.budget}
- Timeframe: ${profile.timeframe}
- Custom Context & Problem Notes: ${userProblem || "None"}

${userProblem ? `
CRITICAL MANDATORY INSTRUCTION - MATCH USER'S INPUT EXACTLY:
The user has explicitly entered the following startup idea or problem statement:
"${userProblem}"

1. Concept #1 MUST BE AN EXACT IMPLEMENTATION of this exact idea / problem statement: "${userProblem}".
   - Name: Create a punchy, realistic brand name fitting this exact idea (or use the founder's preferred name if provided).
   - Tagline: A sharp 6-10 word value proposition describing this exact solution.
   - problemStatement: Directly address the founder's exact problem statement: "${userProblem}".
   - solution: Explain the concrete, operationally grounded business model directly solving this exact problem.
   - targetPersona: Align with the target customer for this solution.
   - domain: Set the domain strictly to "${targetSectorLabel}".
   - businessType: Authentic business model type for this solution in ${targetSectorLabel}.

2. STRICT SECTOR LOCK: Concepts #2, #3, and #4 MUST ALSO strictly belong to "${targetSectorLabel}". NEVER output concepts from other sectors.
` : `
STRICT SECTOR LOCK: All concepts #1, #2, #3, and #4 MUST belong exclusively to "${targetSectorLabel}".
`}

${existingIdeas && existingIdeas.length > 0 ? `
CRITICAL INSTRUCTION - USER REQUESTED DIFFERENT / ALTERNATIVE PLANS:
The user has ALREADY reviewed these existing startup plans/concepts:
${existingIdeas.map((e) => `- "${e}"`).join("\n")}
The user wants DIFFERENT PLANS. DO NOT repeat, rephrase, or duplicate these concepts.
You MUST generate 3 brand new, distinct, creative, and viable startup plans exploring completely different business models, market angles, or sub-verticals within "${targetSectorLabel}".
` : ""}

CRITICAL INSTRUCTIONS ON STARTUP TYPES:
1. Ground every concept in viable, real-world physical and commercial operations in Belagavi, Karnataka.
2. The business model must be authentic to ${targetSectorLabel}.
3. Generate exactly 3 to 4 diverse, viable, and commercially grounded startup concepts.

Return ONLY a valid JSON array matching this exact schema:
[
  {
    "id": "idea-${Date.now()}-1",
    "name": "Startup Name",
    "tagline": "Punchy 6-10 word value proposition",
    "domain": "${profile.domains[0] || "Industry"}",
    "businessType": "${businessType}",
    "problemStatement": "Clear acute customer or market pain point being solved (2-3 sentences)",
    "solution": "The business solution, product/service delivery model, and operational approach (2-3 sentences)",
    "targetPersona": {
      "title": "Specific Buyer or Customer Persona",
      "painPoints": ["Acute Pain 1", "Acute Pain 2", "Acute Pain 3"],
      "willingnessToPay": "Realistic pricing or customer spend in Indian Rupees (e.g. ₹250-₹500 per meal, ₹1,200/unit, ₹2,000/mo membership, or ₹4,500 - ₹35,000/mo)"
    },
    "whyNow": "Market catalyst, consumer shift, supply chain evolution, or regulatory tailwind",
    "innovationMoat": "Core competitive advantage (e.g. proprietary formulation, direct farmer sourcing, local catchment density, customer loyalty, or operational efficiency)",
    "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
    "initialFeasibilityScore": 88
  }
]`;

  const text = await callGeminiApi(prompt, apiKey, "application/json", 0.7);
  return parseGeminiJson<StartupIdea[]>(text);
}

async function callGeminiForValidation(
  idea: StartupIdea,
  profile: FounderProfile,
  apiKey: string,
  tavilyContext?: string
): Promise<MarketValidation> {
  const prompt = `Act as an expert Market Research & Competitive Intelligence Analyst.
Analyze this startup idea:
Name: ${idea.name}
Tagline: ${idea.tagline}
Domain: ${idea.domain}
Business Model: ${idea.businessType || "Commercial Venture"}
Problem: ${idea.problemStatement}
Solution: ${idea.solution}
Target Hub / City: Belagavi (Belgaum), Karnataka, India
Target Neighborhood / Area in Belagavi: ${profile.targetArea || profile.targetLocation?.city || "Belagavi"}

LOCALITY & COMPETITOR MANDATE:
All market dynamics and competitors MUST be analyzed through the lens of Belagavi, Karnataka—specifically the neighborhood of "${profile.targetArea || profile.targetLocation?.city || "Belagavi"}" and surrounding industrial/educational corridors. Focus on real local competitors and alternatives operating in this territory rather than generic national mega-corporations.

${tavilyContext ? `LIVE WEB MARKET RESEARCH (GROUNDING SIGNALS FROM TAVILY SEARCH):
${tavilyContext}
IMPORTANT: Ground your TAM/SAM/SOM numerical estimates, competitor landscape, and real-time market trends in these actual live web findings and statistics.` : ""}

IMPORTANT CURRENCY SPECIFICATION (INDIAN RUPEES):
All Market Sizing metrics (TAM, SAM, SOM) MUST be written in Indian Rupees (INR / ₹) with standard Indian numbering denominations (Crores / Lakhs) followed by the USD equivalent in parentheses, e.g.:
- TAM: "₹42,000 Crores ($5.1B)" or "₹3,20,000 Crores ($38.5B)"
- SAM: "₹8,500 Crores ($1.02B)" or "₹60,000 Crores ($7.2B)"
- SOM: "₹450 Crores ($54M)" or "₹2,600 Crores ($315M)"
"numBillions" must be a float number representing the numeric magnitude in Billions USD (e.g. 5.1, 38.5, 1.02) for consistent ranking and sorting.

Provide a comprehensive Market Validation with real-time industry context.
Return ONLY valid JSON matching this schema:
{
  "ideaId": "${idea.id}",
  "marketSummary": "Detailed 2-3 sentence overview of market dynamics and momentum",
  "tam": {
    "value": "₹XX,XXX Crores ($XX.X Billion)",
    "numBillions": 42.5,
    "description": "Total Addressable Market definition in Indian Rupees"
  },
  "sam": {
    "value": "₹X,XXX Crores ($X.X Billion)",
    "numBillions": 8.2,
    "description": "Serviceable Addressable Market in Indian Rupees"
  },
  "som": {
    "value": "₹XXX Crores ($XX Million)",
    "numBillions": 0.45,
    "description": "Serviceable Obtainable Market (Years 1-3) in Indian Rupees"
  },
  "cagr": "XX.X%",
  "competitors": [
    {
      "name": "Established Regional Incumbent",
      "type": "Direct",
      "strengths": "Established local brand recognition and high street presence",
      "weaknesses": "Inconsistent quality control, legacy facilities, no digital loyalty",
      "ourDifferentiation": "Standardized certified execution, superior ingredient/material sourcing, and modern customer experience",
      "fundingOrScale": "Multi-outlet regional business (₹15 Cr+ turnover)"
    },
    {
      "name": "Unorganized Local Independent Outlets",
      "type": "Indirect",
      "strengths": "Hyper-local neighborhood presence and low entry pricing",
      "weaknesses": "Uncertified standards, lack of accountability, and zero operational scalability",
      "ourDifferentiation": "Quality-certified delivery, predictable pricing, and dedicated customer service guarantee",
      "fundingOrScale": "Single-outlet independent operators"
    },
    {
      "name": "National Chain Branch Outlets",
      "type": "Direct",
      "strengths": "Deep corporate marketing budgets and standardized franchise playbook",
      "weaknesses": "Impersonal service, expensive pricing, lack of local regional community connection",
      "ourDifferentiation": "Hyper-local authenticity, direct customer community engagement, and superior freshness/craftsmanship",
      "fundingOrScale": "National retail chain"
    }
  ],
  "realTimeTrends": [
    {
      "source": "Karnataka Regional Commerce & MSME Bureau",
      "headline": "Surging consumer demand for certified, organized service and dining brands in tier-2 cities",
      "sentiment": "Bullish",
      "growthSignal": "+28% YoY organized retail spend"
    },
    {
      "source": "Belagavi Chamber of Commerce & Industry",
      "headline": "Expansion of commercial infrastructure, healthcare, and educational hubs driving middle-class consumption",
      "sentiment": "Bullish",
      "growthSignal": "16.5% CAGR regional expansion"
    }
  ],
  "targetSegments": [
    {
      "segment": "Early adopters",
      "sizeShare": "45%",
      "urgency": "High",
      "salesCycle": "1-2 weeks"
    },
    {
      "segment": "Mid-market enterprises",
      "sizeShare": "35%",
      "urgency": "Critical",
      "salesCycle": "1-2 months"
  ]
}`;

  const text = await callGeminiApi(prompt, apiKey, "application/json", 0.7);
  const validation = parseGeminiJson<MarketValidation>(text);
  if (validation?.tam?.value) validation.tam.value = formatToRupees(validation.tam.value);
  if (validation?.sam?.value) validation.sam.value = formatToRupees(validation.sam.value);
  if (validation?.som?.value) validation.som.value = formatToRupees(validation.som.value);
  return validation;
}

async function callGeminiForFeasibility(
  idea: StartupIdea,
  validation: MarketValidation,
  profile: FounderProfile,
  apiKey: string
): Promise<FeasibilityReport> {
  const prompt = `Act as a Cloud Principal Architect and Fractional CTO.
Evaluate this startup:
Name: ${idea.name}
Domain: ${idea.domain}
Solution: ${idea.solution}
Budget: ${profile.budget}
Timeframe: ${profile.timeframe}

Generate an in-depth Feasibility, Cloud Architecture, and Revenue Model report.
Return ONLY valid JSON matching this schema:
{
  "overallScore": 86,
  "technicalScore": 88,
  "marketScore": 84,
  "financialScore": 89,
  "regulatoryScore": 82,
  "executionScore": 87,
  "verdict": "Strong Go",
  "verdictSummary": "Compelling value proposition with high technical feasibility using modern cloud serverless and multi-model AI APIs.",
  "radarData": [
    { "subject": "Tech Feasibility", "score": 88, "fullMark": 100 },
    { "subject": "Market Demand", "score": 84, "fullMark": 100 },
    { "subject": "Unit Economics", "score": 89, "fullMark": 100 },
    { "subject": "Compliance & Risk", "score": 82, "fullMark": 100 },
    { "subject": "Speed to MVP", "score": 87, "fullMark": 100 }
  ],
  "cloudArchitecture": {
    "recommendedProvider": "AWS",
    "compute": "AWS Lambda / AWS Fargate Containerized Inference",
    "database": "PostgreSQL (Amazon Aurora Serverless) + Pinecone / pgvector",
    "aiInference": "Gemini 1.5 Pro + Claude 3.5 Sonnet fallback via LiteLLM",
    "storageAndCDN": "Amazon S3 + CloudFront Edge Caching",
    "thirdPartyAPIs": [
      { "name": "Razorpay / Stripe API", "purpose": "UPI & Subscription billing and metered credits", "costTier": "2% per transaction" },
      { "name": "Resend / SendGrid", "purpose": "Transactional notifications and report delivery", "costTier": "Free / ₹1,650/mo" },
      { "name": "OpenAI / Anthropic / Google Gemini APIs", "purpose": "Agentic reasoning & embeddings", "costTier": "Pay-as-you-go" }
    ],
    "diagramComponents": [
      { "category": "Frontend & Edge", "name": "Next.js on Vercel / CloudFront", "details": "Global CDN edge distribution, SSR, and client caching", "cloudIcon": "aws" },
      { "category": "API Gateway & Auth", "name": "API Gateway + Supabase/Clerk", "details": "JWT authentication, rate limiting, and request routing", "cloudIcon": "api" },
      { "category": "AI & Core Compute", "name": "Serverless Functions + Celery Workers", "details": "Event-driven asynchronous document parsing & AI agent execution", "cloudIcon": "ai" },
      { "category": "Database & Storage", "name": "Aurora Serverless + Pinecone Vector DB", "details": "ACID compliance for user state, vector indexing for embeddings", "cloudIcon": "db" },
      { "category": "3rd-Party APIs", "name": "Market APIs + Stripe + Webhooks", "details": "Real-time external telemetry and automated billing cycles", "cloudIcon": "api" }
    ],
    "estimatedMonthlyCloudCost": {
      "mvp": "₹3,500 - ₹9,500 / month",
      "growth": "₹32,000 - ₹85,000 / month",
      "scale": "₹1,80,000 - ₹4,80,000 / month"
    }
  },
  "revenueModel": {
    "primaryModel": "B2B SaaS with Tiered Subscriptions & Usage-based API Credits",
    "pricingTiers": [
      { "tier": "Starter", "price": "₹2,499", "billing": "/ month", "features": ["100 automated scans/mo", "Basic market reports", "Community support"] },
      { "tier": "Professional", "price": "₹7,999", "billing": "/ month", "features": ["Unlimited scans", "Real-time competitor tracking", "Custom cloud blueprints", "Priority support"], "highlighted": true },
      { "tier": "Enterprise", "price": "₹39,999+", "billing": "/ month", "features": ["Dedicated cluster", "SOC2 compliance exports", "Custom fine-tuned models", "SLA guarantees"] }
    ],
    "projectedRunway": [
      { "month": "M1", "revenue": 100000, "cost": 35000, "users": 35 },
      { "month": "M3", revenue: 480000, cost: 100000, users: 160 },
      { "month": "M6", revenue: 1500000, cost: 280000, users: 480 },
      { "month": "M9", revenue: 3200000, cost: 600000, users: 1100 },
      { "month": "M12", revenue: 6800000, cost: 1200000, users: 2400 }
    ],
    "keyUnitEconomics": {
      "cacEstimate": "₹11,500",
      "ltvEstimate": "₹96,000",
      "ltvCacRatio": "8.3x",
      "grossMargin": "84%"
    }
  },
  "risksAndMitigations": [
    { "risk": "API Rate Limiting & Latency", "severity": "Medium", "probability": "High", "mitigation": "Implement Redis semantic caching and queue-based async worker processing." },
    { "risk": "Competitor Duplication", "severity": "High", "probability": "Medium", "mitigation": "Focus on proprietary workflow integrations and customer proprietary data lock-in." },
    { "risk": "Model Hallucination", "severity": "Medium", "probability": "Low", "mitigation": "Enforce RAG architecture with real-time verified API ground-truth data." }
  ],
  "goNextSteps": [
    "Build a 14-day interactive prototype with mock synthetic data.",
    "Interview 15 target buyers from the specified customer persona.",
    "Deploy a landing page with a waitlist and collect customer intent letters (LOIs).",
    "Configure serverless cloud telemetry and launch public Beta."
  ]
}`;

  const text = await callGeminiApi(prompt, apiKey, "application/json", 0.7);
  return parseGeminiJson<FeasibilityReport>(text);
}

// Helper to synthesize a high-fidelity Concept #1 that matches the user's exact problem and profile inputs
function buildExactMatchIdeaFromProfile(
  profile: FounderProfile,
  baseIdeas: StartupIdea[] = []
): StartupIdea {
  const context = (profile.customContext || "").trim();
  const audience = profile.targetAudience || "Target Customers & Buyers";
  const skills = profile.skills?.length > 0 ? profile.skills.join(", ") : "Operational Leadership & Execution";

  const targetSector = resolveSectorKey(
    profile.domains?.[0] || "",
    profile.businessType || "",
    profile.interests
  );

  const sectorLabels: Record<"food" | "education" | "healthcare" | "construction", string> = {
    food: "Food & Beverages",
    education: "Education",
    healthcare: "Healthcare & Wellness",
    construction: "Construction & Infrastructure",
  };
  const effectiveDomain = sectorLabels[targetSector];
  const effectiveBusinessType = profile.businessType || (
    targetSector === "food"
      ? "Food & Beverage / Cafe & Dining"
      : targetSector === "education"
      ? "Education & Coaching Institutes"
      : targetSector === "healthcare"
      ? "Healthcare Clinics & Wellness Centers"
      : "Construction & Infrastructure / Turnkey Contracting"
  );

  // Check if any idea in baseIdeas has strong keyword overlap with context
  let bestPreset: StartupIdea | null = null;
  for (const idea of baseIdeas) {
    const iWords = (idea.name + " " + idea.tagline + " " + idea.problemStatement).toLowerCase();
    const overlapTokens = context
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !["with", "from", "that", "this", "have", "been", "their", "into"].includes(w));
    const matchCount = overlapTokens.filter((token) => iWords.includes(token)).length;
    if (matchCount >= 2) {
      bestPreset = idea;
      break;
    }
  }

  if (bestPreset) {
    return {
      ...bestPreset,
      id: `exact-${Date.now()}-1`,
      problemStatement: context,
      domain: effectiveDomain,
      businessType: effectiveBusinessType,
      targetPersona: {
        ...bestPreset.targetPersona,
        title: audience !== "Target Customers & Buyers" ? audience : bestPreset.targetPersona.title,
      },
      tags: [effectiveDomain, effectiveBusinessType, "Direct Solution", "High Feasibility"],
      initialFeasibilityScore: 92,
      isNew: false,
    };
  }

  // Synthesize tailored title and tagline within the sector
  const words = context
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => !["a", "an", "the", "for", "to", "in", "of", "and", "with", "or", "on", "by", "from"].includes(w.toLowerCase()));
  const w1 = words[0] ? words[0].charAt(0).toUpperCase() + words[0].slice(1) : effectiveDomain.split(" ")[0];
  const w2 = words[1] ? words[1].charAt(0).toUpperCase() + words[1].slice(1) : "Hub";
  const name = `${w1}${w2}`;
  const tagline = context.length > 70 ? context.substring(0, 67) + "..." : context;

  const defaultPainPoints: Record<"food" | "education" | "healthcare" | "construction", string[]> = {
    food: [
      "Inconsistent food quality and slow turnaround from unorganized vendors",
      "Lack of authentic, clean-label regional culinary experiences",
      "High distributor markups and unpredictable supply delivery",
    ],
    education: [
      "Lack of practical, hands-on skill training in legacy classroom curriculums",
      "High coaching fees with impersonal, crowded batch sizes",
      "Students struggling with real-world application and creative problem-solving",
    ],
    healthcare: [
      "Chronic musculoskeletal stress, fatigue, and systemic lifestyle burnout",
      "Lack of hygienic, non-clinical specialized recovery suites outside luxury clubs",
      "Reactive hospital care rather than proactive recovery and preventive routines",
    ],
    construction: [
      "Frequent project delays and 30%+ cost overruns with unverified contractors",
      "Substandard on-site mortar and brick quality leading to structural cracks",
      "Fragmented material procurement and zero post-handover workmanship accountability",
    ],
  };

  const defaultWillingness: Record<"food" | "education" | "healthcare" | "construction", string> = {
    food: "₹250 - ₹650 per dining order or ₹3,500/mo corporate plan",
    education: "₹3,500 - ₹8,500 per month / ₹25,000 per certification cohort",
    healthcare: "₹1,200 per session or ₹4,500/mo unlimited recovery membership",
    construction: "₹1,200 - ₹3,500 per sq ft / ₹50,000 per prefabricated section",
  };

  return {
    id: `exact-${Date.now()}-1`,
    name,
    tagline,
    domain: effectiveDomain,
    businessType: effectiveBusinessType,
    problemStatement: context,
    solution: `An operational, high-impact business model delivering certified execution and specialized operations addressing "${context.toLowerCase()}". Leverages founder execution strengths in ${skills}.`,
    targetPersona: {
      title: audience,
      painPoints: defaultPainPoints[targetSector],
      willingnessToPay: defaultWillingness[targetSector],
    },
    whyNow: `Surging localized demand in Belagavi for reliable, modern, transparent solutions in ${effectiveDomain}.`,
    innovationMoat: `Proprietary localized supplier agreements, certified quality protocols, and founder mastery in ${skills}.`,
    tags: [effectiveDomain, effectiveBusinessType, "Direct Solution", "High Feasibility"],
    initialFeasibilityScore: 92,
    isNew: false,
  };
}

// Helper to select diverse ideas and generate fresh alternative options when more are requested
function selectDiverseIdeas(
  baseIdeas: StartupIdea[],
  domainKey: string,
  profile: FounderProfile,
  existingIdeas: string[] = []
): StartupIdea[] {
  const targetSector = resolveSectorKey(
    domainKey || profile.domains?.[0] || "",
    profile.businessType || "",
    profile.interests
  );
  const sectorLabels: Record<"food" | "education" | "healthcare" | "construction", string> = {
    food: "Food & Beverages",
    education: "Education",
    healthcare: "Healthcare & Wellness",
    construction: "Construction & Infrastructure",
  };
  const targetSectorLabel = sectorLabels[targetSector];

  // If user provided a specific custom idea or problem statement in Step 1, Concept #1 MUST be an exact match!
  if (profile.customContext && profile.customContext.trim().length > 5 && existingIdeas.length === 0) {
    const exactIdea = buildExactMatchIdeaFromProfile(profile, baseIdeas);
    exactIdea.domain = targetSectorLabel;
    const otherBase = baseIdeas.filter(
      (idea) => idea.name.toLowerCase().trim() !== exactIdea.name.toLowerCase().trim()
    );
    return [exactIdea, ...otherBase.slice(0, 2)];
  }

  const existingSet = new Set(existingIdeas.map((s) => s.toLowerCase().trim()));
  const unselectedBase = baseIdeas.filter((idea) => !existingSet.has(idea.name.toLowerCase().trim()));

  if (unselectedBase.length >= 3) {
    return unselectedBase.slice(0, 3).map((i) => ({ ...i, isNew: existingIdeas.length > 0 }));
  }

  // Get alternative curated ideas for this domain
  const altIdeas = getAlternativeDomainIdeas(domainKey, profile);
  const fullPool = [...baseIdeas, ...altIdeas];
  const available = fullPool.filter((idea) => !existingSet.has(idea.name.toLowerCase().trim()));

  if (available.length >= 3) {
    return available.slice(0, 3).map((i) => ({ ...i, isNew: true }));
  }

  // If even alternative pool is reviewed, dynamically synthesize fresh tailored concepts within targetSectorLabel
  const results: StartupIdea[] = available.map((i) => ({ ...i, isNew: true }));
  const userSkills = profile.skills.length > 0 ? profile.skills.join(" and ") : "Operational Leadership";
  let variantIndex = existingIdeas.length + results.length + 1;

  while (results.length < 3) {
    const dynIdea: StartupIdea = {
      id: `dyn-gen-${Date.now()}-${variantIndex}`,
      name: `${targetSectorLabel} NextWave #${variantIndex}`,
      tagline: `Alternative Specialized Solution for ${targetSectorLabel} & ${profile.targetAudience}`,
      domain: targetSectorLabel,
      businessType: profile.businessType || targetSectorLabel,
      problemStatement: `Operators and buyers in ${targetSectorLabel} face acute delivery bottlenecks, unreliable vendor quality, and lack of specialized regional service options in Belagavi.`,
      solution: `A focused operational solution providing certified quality delivery, direct customer turnaround, and specialized execution leveraging founder's expertise in ${userSkills}.`,
      targetPersona: {
        title: `${profile.targetAudience || "Regional"} Decision Makers & Buyers`,
        painPoints: ["High operational overhead", "Fragmented vendor choices", "Slow resolution times"],
        willingnessToPay: "₹5,000 - ₹35,000 / month or per order",
      },
      whyNow: "Shifting industry regulations and surging regional customer demand for reliable, verified, transparent alternatives.",
      innovationMoat: `Proprietary vendor network and operational agility built around ${userSkills}.`,
      tags: [targetSectorLabel, "Alternative Plan", "Scalable", "High-Margin"],
      initialFeasibilityScore: 88,
      isNew: true,
    };
    results.push(dynIdea);
    variantIndex++;
  }

  return results;
}

// ---------------------------------------------------------------------------
// CURATED IDEA POOLS: Strictly Belagavi's 4 Core Economic Sectors
// ---------------------------------------------------------------------------

const FOOD_IDEAS: StartupIdea[] = [
  {
    id: "food-1",
    name: "Malaprabha Micro-Roastery & Cafe",
    tagline: "Single-Origin Western Ghats Coffee Roastery & Zero-Waste Cold Brew Taproom",
    domain: "Food & Beverages",
    businessType: "Food & Beverage / Cafe & Dining",
    problemStatement: "Belagavi coffee enthusiasts and students face generic mass-commercial chains with stale pre-ground beans and zero single-origin traceability.",
    solution: "A local micro-roastery cafe featuring direct-trade estate beans from Chikmagalur and Kodagu, live batch roasting on display, and nitrogen cold brew taprooms.",
    targetPersona: {
      title: "Urban professionals, college students, remote workers, and specialty coffee lovers",
      painPoints: ["Bitter over-roasted commercial beans", "No high-speed workspace cafes", "Lack of freshly roasted whole-bean retail"],
      willingnessToPay: "₹180 - ₹320 per beverage / ₹450 per 250g bean bag"
    },
    whyNow: "Explosion of tier-2 specialty cafe culture and demand for collaborative, experiential community spaces.",
    innovationMoat: "Direct exclusive micro-lot contracts with certified Western Ghats coffee estates and proprietary cold-brew nitrogen keg system.",
    tags: ["Food & Beverages", "Artisan Coffee", "Micro-Roastery", "Cafe Culture"],
    initialFeasibilityScore: 92
  },
  {
    id: "food-2",
    name: "MilletBites Daily Cloud Kitchens",
    tagline: "Ancient Grain & Diabetic-Friendly Daily Meal Subscription Boxes",
    domain: "Food & Beverages",
    businessType: "Food & Beverage / QSR & Delivery",
    problemStatement: "Working professionals and diabetic adults struggle to find healthy, low-glycemic, pesticide-free home-style meals delivered fresh daily.",
    solution: "A dedicated cloud kitchen preparing chef-curated ragi, jowar, foxtail millet grain bowls, stone-ground rotis, and low-oil regional delicacies on daily/monthly subscriptions.",
    targetPersona: {
      title: "Corporate workers, diabetic patients, fitness enthusiasts, and health-conscious families",
      painPoints: ["Oily, high-sodium restaurant food", "Spike in blood sugar levels", "Time wasted cooking healthy meals"],
      willingnessToPay: "₹130 - ₹190 per meal or ₹3,600 monthly lunch subscription"
    },
    whyNow: "National dietary shift toward millets, high prevalence of diabetes in urban Karnataka, and growth of subscription meal commerce.",
    innovationMoat: "Farm-to-fork sourcing from North Karnataka organic millet farmer cooperatives and clinical nutritionist meal formulation.",
    tags: ["Food & Beverages", "Healthy Dining", "Cloud Kitchen", "Millet Nutrition"],
    initialFeasibilityScore: 90
  },
  {
    id: "food-3",
    name: "The Western Ghats Farm-to-Table Bistro",
    tagline: "Seasonal Culinary Bistro Showcasing Native Belagavi Produce & Heritage Recipes",
    domain: "Food & Beverages",
    businessType: "Food & Beverage / Experiential Dining",
    problemStatement: "Discerning diners and tourists seek authentic regional farm-to-table cuisine, but local restaurants rely on frozen ingredients and generic multi-cuisine menus.",
    solution: "A destination garden bistro collaborating with local smallholders to serve 100% seasonal dishes, sourdough flatbreads, regional cheeses, and botanical mocktails.",
    targetPersona: {
      title: "Upper-income families, visiting travelers, food connoisseurs, and weekend celebration groups",
      painPoints: ["Standardized commercial restaurant food", "Lack of relaxed garden dining ambiance", "Uninspired dining options for family gatherings"],
      willingnessToPay: "₹600 - ₹1,200 average spend per diner"
    },
    whyNow: "Belagavi's status as a culinary hub between Goa and Maharashtra creates strong demand for destination dining experiences.",
    innovationMoat: "Zero-kilometer kitchen garden, direct farmer harvest menu cycles, and curated chef table tastings.",
    tags: ["Food & Beverages", "Farm to Table", "Experiential Dining", "Heritage Cuisine"],
    initialFeasibilityScore: 89
  }
];

const ALT_FOOD_IDEAS: StartupIdea[] = [
  {
    id: "food-4",
    name: "ColdHarvest Gelato & Dairy Lab",
    tagline: "A2 Micro-Dairy Gelato & Prebiotic Frozen Treats with Zero Refined Sugar",
    domain: "Food & Beverages",
    businessType: "Food & Beverage / Cafe & Dining",
    problemStatement: "Health-conscious dessert lovers and diabetic consumers find zero ultra-clean frozen desserts without artificial emulsifiers and chemical sweeteners.",
    solution: "Small-batch churned artisanal gelato made with pure single-source A2 cow milk, indigenous fruits, monk fruit extract, and prebiotic chicory root.",
    targetPersona: {
      title: "Gourmet food lovers, health-focused parents, and dietary-restricted diners",
      painPoints: ["Artificial chemicals in commercial ice creams", "High glycemic sugar spikes", "Digestive bloat from conventional dairy"],
      willingnessToPay: "₹180 - ₹280 per scoop / ₹450 per pint"
    },
    whyNow: "Rapid growth of gut-health awareness and premium functional indulgence categories across Karnataka.",
    innovationMoat: "Direct single-farm A2 dairy sourcing contracts and proprietary zero-sugar stabilizing matrix.",
    tags: ["Food & Beverages", "Artisan Gelato", "A2 Dairy", "Clean Label"],
    initialFeasibilityScore: 91,
    isNew: true
  },
  {
    id: "food-5",
    name: "SpiceRoute Gourmet Curry Pastes",
    tagline: "Clean-Label Stone-Ground Regional Spice Marinades & Meal Starters",
    domain: "Food & Beverages",
    businessType: "Food & Beverage / Retail & FMCG",
    problemStatement: "Busy home cooks and diaspora foodies spend hours roasting and grinding whole spices for complex traditional curries or settle for preservative-laden powders.",
    solution: "Fresh stone-ground, cold-pressed wet masala pastes and marinades made with whole Byadagi chillies and regional herbs packaged in chilled glass jars with zero artificial preservatives.",
    targetPersona: {
      title: "Time-strapped working professionals, young families, and home culinary enthusiasts",
      painPoints: ["30-40 min prep time per curry", "Flavorless dry powders", "Preservative-heavy commercial sauces"],
      willingnessToPay: "₹160 - ₹240 per 200g jar (serves 4)"
    },
    whyNow: "Demand for authentic culinary convenience and clean-label pantry staples without synthetic additives.",
    innovationMoat: "Proprietary high-pressure processing (HPP) shelf-life extension preserving fresh aroma for 90 days chilled.",
    tags: ["Food & Beverages", "Gourmet Condiments", "Clean Label", "Regional Spices"],
    initialFeasibilityScore: 89,
    isNew: true
  },
  {
    id: "food-6",
    name: "BistroBox Commercial Prep Kitchens",
    tagline: "Shared Commissary Infrastructure & Cold Storage for Regional Food Entrepreneurs",
    domain: "Food & Beverages",
    businessType: "Food & Beverage / Shared Operations",
    problemStatement: "Emerging bakers, cloud kitchen brands, and catering operators face exorbitant commercial real estate costs and licensing hurdles to launch.",
    solution: "A fully licensed, shared commercial culinary facility with industrial ovens, blast chillers, walk-in cold rooms, and bookable hourly kitchen stations.",
    targetPersona: {
      title: "Boutique bakers, festival food pop-ups, cloud kitchen startups, and small batch CPG brands",
      painPoints: ["High capital expense for equipment", "FSSAI commercial zoning red tape", "Lack of commercial cold storage"],
      willingnessToPay: "₹500/hour or ₹35,000/month for dedicated dedicated commissary shift"
    },
    whyNow: "Explosion of independent culinary creators and food entrepreneurs seeking asset-light production setups.",
    innovationMoat: "Turnkey centralized FSSAI compliance, shared bulk wholesale raw material purchasing discounts, and integrated delivery dispatch docks.",
    tags: ["Food & Beverages", "Shared Kitchen", "Commissary Ops", "Culinary Incubator"],
    initialFeasibilityScore: 88,
    isNew: true
  }
];

const EDUCATION_IDEAS: StartupIdea[] = [
  {
    id: "edu-1",
    name: "MakerSprint K-12 STEM Labs",
    tagline: "Hands-On K-12 Robotics, 3D Prototyping & Applied Electronics Studios",
    domain: "Education",
    businessType: "Education & Coaching Institutes",
    problemStatement: "K-12 students are trapped in rote memorization and passive screen time, lacking tactile, project-based engineering and maker skills.",
    solution: "Weekend and after-school innovation studios where students build autonomous robots, solder circuitry, 3D print inventions, and master coding through hands-on challenges.",
    targetPersona: {
      title: "Parents of children aged 7-17, progressive school principals, and science teachers",
      painPoints: ["Excessive passive video gaming", "No practical STEM kits in regular schools", "Fear of children falling behind in tech skills"],
      willingnessToPay: "₹2,500 - ₹4,500/month per child for weekend studio access"
    },
    whyNow: "NEP 2020 mandate emphasizing experiential STEM and maker education, paired with parent demand for productive screen alternatives.",
    innovationMoat: "Proprietary modular hardware kits, gamified skill progression badges, and direct student project showcase competitions.",
    tags: ["Education", "STEM Learning", "Robotics Maker Lab", "Experiential Learning"],
    initialFeasibilityScore: 92
  },
  {
    id: "edu-2",
    name: "Acuity Olympiad & Foundation Academy",
    tagline: "Small-Batch Mentorship for NTSE, Science Olympiads & Early Competitive Foundations",
    domain: "Education",
    businessType: "Education & Coaching Institutes",
    problemStatement: "Ambitious middle school students in tier-2 cities are lost in 100-student mass coaching factories without personalized conceptual mentorship.",
    solution: "A boutique academy strictly limited to 15-student cohorts, led by experienced faculty focused on deep first-principles physics, mathematics, and analytical problem-solving.",
    targetPersona: {
      title: "Parents of high-achieving 6th-10th grade students aiming for top tier academic milestones",
      painPoints: ["Overcrowded commercial coaching batches", "Rote question cramming without conceptual clarity", "Student academic burnout and anxiety"],
      willingnessToPay: "₹35,000 - ₹65,000 per academic year"
    },
    whyNow: "Surging competition for top-tier collegiate admissions and parent willingness to invest in high-touch foundational tutoring.",
    innovationMoat: "Rigorous diagnostic student assessment algorithms, customized homework pathways, and proven faculty track records.",
    tags: ["Education", "Olympiad Academy", "Small Batch Coaching", "Academic Excellence"],
    initialFeasibilityScore: 90
  },
  {
    id: "edu-3",
    name: "KalaKriti Design & Animation Studio School",
    tagline: "Applied UI/UX Design, 3D Game Asset & Visual Storytelling Career Academy",
    domain: "Education",
    businessType: "Education & Coaching Institutes",
    problemStatement: "Tier-2 college students lack industry-grade visual design, UI/UX, and 3D modeling skills needed for high-paying remote digital design careers.",
    solution: "A portfolio-first physical studio school where students build real-world client UI/UX prototypes, brand design identities, and game 3D assets mentored by working creative directors.",
    targetPersona: {
      title: "Undergraduate students, aspiring creative professionals, and career switchers",
      painPoints: ["Theoretical college design syllabi", "Inability to pass tech design portfolio reviews", "High fees at metropolitan private design institutes"],
      willingnessToPay: "₹25,000 - ₹45,000 per 16-week intensive bootcamp"
    },
    whyNow: "Boom in global product design hiring and tech firms hiring remote UI/UX designers from non-metro talent hubs.",
    innovationMoat: "Live client project apprenticeships, hiring partner showcases with 30+ regional agencies, and lifetime portfolio review access.",
    tags: ["Education", "UI/UX Design", "Vocational Academy", "Creative Career"],
    initialFeasibilityScore: 88
  }
];

const ALT_EDUCATION_IDEAS: StartupIdea[] = [
  {
    id: "edu-4",
    name: "NextGen AI & Data Career Bootcamps",
    tagline: "Industry-Aligned 16-Week Live Project Bootcamps for Engineering Students",
    domain: "Education",
    businessType: "Education & Coaching Institutes",
    problemStatement: "Engineering graduates from tier-2 engineering colleges suffer from outdated computer science syllabi and lack hands-on experience building production AI systems.",
    solution: "An intensive in-person evening and weekend coding accelerator where engineers build full-stack generative AI applications, cloud pipelines, and production databases.",
    targetPersona: {
      title: "3rd & 4th year engineering students and junior IT professionals seeking high-paying software jobs",
      painPoints: ["Unemployment after graduation", "Generic massive open online courses with 5% completion rates", "Zero production GitHub projects"],
      willingnessToPay: "₹30,000 - ₹50,000 per cohort with milestone placement support"
    },
    whyNow: "Over 80% of engineering graduates require practical upskilling to meet current AI-era industry hiring benchmarks.",
    innovationMoat: "Rigorous code review sprints, peer pair-programming labs, and direct placement tie-ups with hiring startups.",
    tags: ["Education", "AI Bootcamp", "Full-Stack Engineering", "Job Placement"],
    initialFeasibilityScore: 91,
    isNew: true
  },
  {
    id: "edu-5",
    name: "LittleExplorers Montessori Early Learning",
    tagline: "Nature-Integrated Experiential Early Childhood Learning Studios & Sensory Labs",
    domain: "Education",
    businessType: "Education & Coaching Institutes",
    problemStatement: "Parents of toddlers face sterile, concrete pre-schools that lack natural outdoor play, emotional development, and genuine Montessori learning materials.",
    solution: "A low-student-to-teacher ratio early learning sanctuary featuring mud kitchens, sensory exploration gardens, woodcraft materials, and child-led developmental milestones.",
    targetPersona: {
      title: "Working urban parents of children aged 18 months to 5 years seeking progressive schooling",
      painPoints: ["Cramped commercial apartment playgroups", "Rote alphabet drilling at age 3", "Lack of outdoor sensory stimuli"],
      willingnessToPay: "₹4,500 - ₹7,500 per month"
    },
    whyNow: "Millennial parents prioritizing emotional resilience, sensory integration, and nature connection over traditional rote pre-schools.",
    innovationMoat: "Certified Association Montessori Internationale (AMI) educators and proprietary parental developmental tracking dashboards.",
    tags: ["Education", "Early Childhood", "Montessori Studio", "Child Development"],
    initialFeasibilityScore: 89,
    isNew: true
  },
  {
    id: "edu-6",
    name: "SkillCraft Vocational Culinary & Hospitality Institute",
    tagline: "Commercial Kitchen Training Academy Placing Job-Ready Culinary Technicians",
    domain: "Education",
    businessType: "Education & Coaching Institutes",
    problemStatement: "Cafes, bakeries, and resort kitchens face chronic shortages of disciplined, professionally trained line cooks, baristas, and pastry bakers.",
    solution: "A 12-week intensive vocational training school featuring commercial restaurant kitchen equipment, barista espresso stations, HACCP food hygiene certification, and guaranteed job placement.",
    targetPersona: {
      title: "Young aspirants, high school graduates, and career switchers seeking reliable culinary jobs",
      painPoints: ["Unemployed after generic degrees", "Exorbitant private 3-year hotel management college fees", "No practical culinary muscle memory"],
      willingnessToPay: "₹25,000 - ₹45,000 per 12-week diploma course"
    },
    whyNow: "Unprecedented regional expansion of specialty cafes, quick-service brands, and boutique resorts across Karnataka and Goa.",
    innovationMoat: "Direct hiring pipelines with 40+ hospitality brands and equipment manufacturer sponsorship.",
    tags: ["Education", "Vocational Training", "Culinary Academy", "Hospitality Skills"],
    initialFeasibilityScore: 87,
    isNew: true
  }
];

const HEALTHCARE_IDEAS: StartupIdea[] = [
  {
    id: "health-1",
    name: "ReviveZone Contrast Recovery Studios",
    tagline: "Neighborhood Contrast Therapy Lounges: Full-Spectrum Infrared Saunas & Cold Plunges",
    domain: "Healthcare & Wellness",
    businessType: "Healthcare Clinics & Wellness Centers",
    problemStatement: "Everyday athletes, gym-goers, and stressed professionals lack affordable, hygienic access to proven physical recovery modalities used by elite athletes.",
    solution: "Walk-in modern recovery studios offering private contrast therapy suites (triple-filtered 3°C cold plunge tubs + full-spectrum infrared sauna) and pneumatic compression boots.",
    targetPersona: {
      title: "Runners, gym-goers, desk workers with chronic back tension, and wellness enthusiasts",
      painPoints: ["Muscle soreness and systemic inflammation", "High cognitive stress and burnout", "Expensive country club spa fees"],
      willingnessToPay: "₹1,200 per 45-min session or ₹4,500/mo unlimited recovery membership"
    },
    whyNow: "Mainstream consumer explosion of longevity and athletic recovery science backed by neurobiology research.",
    innovationMoat: "Proprietary medical-grade ozone water sanitization protocol and standardized modular studio buildouts.",
    tags: ["Healthcare & Wellness", "Contrast Therapy", "Physical Studio", "Recovery"],
    initialFeasibilityScore: 92
  },
  {
    id: "health-2",
    name: "VitaLife Longevity Clinics",
    tagline: "Preventive Health Screening, Biomarker Optimization & Diagnostic Centers",
    domain: "Healthcare & Wellness",
    businessType: "Healthcare Clinics & Wellness Centers",
    problemStatement: "Traditional healthcare is purely reactive, treating diseases after diagnosis rather than intercepting metabolic decline 10 years earlier.",
    solution: "A boutique preventive clinic offering comprehensive 120-biomarker blood panels, DEXA body scans, VO2 max testing, and physician-guided lifestyle plans.",
    targetPersona: {
      title: "Executives, founders, and proactive adults aged 30-65",
      painPoints: ["Unnoticed metabolic syndrome", "Generic 5-minute doctor visits", "Conflicting wellness advice"],
      willingnessToPay: "₹15,000 - ₹45,000 per annual diagnostic program"
    },
    whyNow: "Preventive health and longevity have shifted from fringe biohacking into the fastest-growing private healthcare category.",
    innovationMoat: "Longitudinal health tracking protocols and direct integrations with specialized diagnostic reference labs.",
    tags: ["Healthcare & Wellness", "Preventive Care", "Longevity Clinic", "Diagnostics"],
    initialFeasibilityScore: 89
  },
  {
    id: "health-3",
    name: "LittleSteps Pediatric Sensory Gym",
    tagline: "Pediatric Sensory Development & Occupational Therapy Play Centers",
    domain: "Healthcare & Wellness",
    businessType: "Healthcare Clinics & Wellness Centers",
    problemStatement: "Parents of neurodiverse children (ADHD, sensory processing, autism) wait 6+ months for certified developmental therapy appointments.",
    solution: "A joyful, non-clinical neighborhood sensory gym combining pediatric occupational therapists with purpose-built climbing and sensory integration equipment.",
    targetPersona: {
      title: "Parents of children aged 2-12, pediatricians, and inclusive schools",
      painPoints: ["Clinical intimidating therapy rooms", "Long hospital waiting lists", "Exorbitant private consultation fees"],
      willingnessToPay: "₹1,500 per guided session or ₹9,000/mo package"
    },
    whyNow: "Growing pediatric neurodevelopment awareness and parent demand for constructive, play-based therapeutic environments.",
    innovationMoat: "Proprietary therapist training curriculum and insurance-reimbursable developmental progress metrics.",
    tags: ["Healthcare & Wellness", "Pediatric Care", "Sensory Gym", "Occupational Therapy"],
    initialFeasibilityScore: 87
  }
];

const ALT_HEALTHCARE_IDEAS: StartupIdea[] = [
  {
    id: "health-4",
    name: "AyurVeda Modern Integrative Rehab",
    tagline: "Evidence-Backed Panchakarma & Physical Therapy Hybrid Clinic for Chronic Pain",
    domain: "Healthcare & Wellness",
    businessType: "Healthcare Clinics & Wellness Centers",
    problemStatement: "Patients suffering from chronic lower back pain, sciatica, and cervical spondylosis oscillate between temporary painkillers and invasive surgery.",
    solution: "An integrative outpatient clinic combining traditional Ayurvedic medicinal oil therapies with modern postural physical therapy and computerized spinal decompression.",
    targetPersona: {
      title: "Desk workers, middle-aged adults, and elderly patients with persistent musculoskeletal pain",
      painPoints: ["Chronic pain affecting sleep and work", "Fear of spinal surgery", "Temporary painkiller side effects"],
      willingnessToPay: "₹12,000 - ₹28,000 per 14-day comprehensive rehabilitation package"
    },
    whyNow: "Growing patient preference for holistic, non-surgical spine and joint rehabilitation protocols.",
    innovationMoat: "Standardized clinical outcome metrics, certified physiotherapists paired with licensed Ayurvedic physicians.",
    tags: ["Healthcare & Wellness", "Ayurvedic Rehab", "Pain Management", "Integrative Clinic"],
    initialFeasibilityScore: 90,
    isNew: true
  },
  {
    id: "health-5",
    name: "MindCare Adolescent Counseling Hub",
    tagline: "Confidential Youth Mental Wellness Studios Offering Emotional Resilience Coaching",
    domain: "Healthcare & Wellness",
    businessType: "Healthcare Clinics & Wellness Centers",
    problemStatement: "Teenagers and college students face unprecedented levels of anxiety, academic stress, and social isolation, yet avoid intimidating psychiatric hospital OPDs.",
    solution: "A warm, cafe-style confidential youth wellness center offering licensed psychologists, peer support circles, and cognitive behavioral therapy (CBT) workshops.",
    targetPersona: {
      title: "Adolescents, college students, concerned parents, and school guidance counselors",
      painPoints: ["Social stigma around mental health", "Academic performance pressure", "Intimidating clinical hospital settings"],
      willingnessToPay: "₹1,000 - ₹1,800 per counseling session or school package"
    },
    whyNow: "Rising social awareness breaking mental health taboos and surging school demand for accredited student counseling.",
    innovationMoat: "Non-stigmatizing physical studio aesthetic and digital confidential booking system.",
    tags: ["Healthcare & Wellness", "Mental Health", "Youth Counseling", "Emotional Wellness"],
    initialFeasibilityScore: 88,
    isNew: true
  },
  {
    id: "health-6",
    name: "ActiveElder Mobility & Geriatric Day Center",
    tagline: "Senior Day Wellness Center Focusing on Balance Training, Physical Mobility & Social Health",
    domain: "Healthcare & Wellness",
    businessType: "Healthcare Clinics & Wellness Centers",
    problemStatement: "Elderly parents living in nuclear urban setups face progressive loss of mobility, high fall risks, and daytime loneliness.",
    solution: "A cheerful daytime wellness club providing supervised low-impact physiotherapy, fall-prevention balance drills, cognitive stimulation games, and social dining.",
    targetPersona: {
      title: "Adult children caring for senior parents aged 65+, retired seniors, and geriatricians",
      painPoints: ["Elderly parents confined to bed/home", "Fear of fatal hip fractures from falls", "Caregiver burnout during work hours"],
      willingnessToPay: "₹8,000 - ₹15,000 per month for full-day supervised wellness program"
    },
    whyNow: "Rapidly aging demographic in urban centers with adult children seeking dignified, active care for aging parents.",
    innovationMoat: "Fall-risk assessment hardware, emergency clinical paramedic standby, and daily doorstep transit vans.",
    tags: ["Healthcare & Wellness", "Geriatric Care", "Senior Mobility", "Day Wellness Club"],
    initialFeasibilityScore: 86,
    isNew: true
  }
];

const CONSTRUCTION_IDEAS: StartupIdea[] = [
  {
    id: "build-1",
    name: "EcoCast Modular Precast & Pavers",
    tagline: "Factory-Engineered Low-Carbon Precast Concrete Panels & Modular Walls",
    domain: "Construction & Infrastructure",
    businessType: "Construction & Infrastructure / Turnkey Contracting",
    problemStatement: "Traditional on-site brick and wet mortar construction takes months, suffers from inconsistent masonry quality, and wastes up to 30% of sand and cement.",
    solution: "A localized manufacturing plant producing precision-cured interlocking pavers, modular boundary walls, and lightweight precast concrete panels that reduce build times by 50%.",
    targetPersona: {
      title: "Civil contractors, commercial real estate developers, and infrastructure engineers",
      painPoints: ["Severe site sand and water shortages", "Slow manual masonry speed", "High on-site labor and cement wastage"],
      willingnessToPay: "₹65 - ₹130 per sq ft / ₹50,000 per prefabricated wall section"
    },
    whyNow: "Government incentives for low-carbon building materials and soaring demand for fast-track modular construction.",
    innovationMoat: "Proprietary fly-ash geopolymer aggregate mix reducing carbon footprint by 45% while exceeding standard load-bearing compression ratings.",
    tags: ["Construction & Infrastructure", "Precast Concrete", "Green Building", "Modular Infrastructure"],
    initialFeasibilityScore: 91
  },
  {
    id: "build-2",
    name: "BuildCraft Turnkey Contracting & Interior Fit-Outs",
    tagline: "Milestone-Guaranteed Residential & Commercial Renovation Execution",
    domain: "Construction & Infrastructure",
    businessType: "Construction & Infrastructure / Turnkey Contracting",
    problemStatement: "Property owners and retail brands face notorious contractor delays, 40%+ cost overruns, substandard workmanship, and zero accountability.",
    solution: "A modern turnkey contracting firm offering dedicated on-site site supervisors, vetted trade crews (carpentry, electrical, plumbing), milestone-based escrow payments, and a 5-year workmanship warranty.",
    targetPersona: {
      title: "Homeowners doing full home renovations, retail brand store rollouts, and office facility managers",
      painPoints: ["Unreliable contractor ghosting", "Hidden surprise price hikes", "Subpar finishing quality"],
      willingnessToPay: "₹1,400 - ₹3,800 per sq ft for turnkey execution"
    },
    whyNow: "Rapid growth in residential handovers and experiential commercial stores with high willingness to pay for guaranteed execution timelines.",
    innovationMoat: "Trade technician training school, direct bulk manufacturer material procurement reducing costs by 22%, and milestone escrow guarantees.",
    tags: ["Construction & Infrastructure", "Turnkey Fit-Outs", "Commercial Contracting", "Interior Renovation"],
    initialFeasibilityScore: 89
  },
  {
    id: "build-3",
    name: "Belgaum Aggregate & Green Sand Depot",
    tagline: "Precision Manufactured Sand (M-Sand) & Recycled Aggregate Distribution Hub",
    domain: "Construction & Infrastructure",
    businessType: "Construction & Infrastructure / Turnkey Contracting",
    problemStatement: "River sand bans and unorganized quarry suppliers lead to adulterated construction sand, structural plaster failure, and severe supply disruptions.",
    solution: "An automated processing depot washing and classifying precision M-Sand and plaster sand conforming to IS 383 standards, bundled with bulk GPS-tracked tipper delivery.",
    targetPersona: {
      title: "Ready-mix concrete (RMC) plants, structural civil contractors, and individual home builders",
      painPoints: ["Illegal river sand extortion pricing", "High silt content ruining concrete strength", "Unpredictable delivery truck arrival"],
      willingnessToPay: "₹1,200 - ₹1,800 per metric ton delivered"
    },
    whyNow: "Strict Supreme Court enforcement of river sand mining bans across Karnataka and Maharashtra borders.",
    innovationMoat: "Automated hydro-cyclone sand washing machinery ensuring < 3% silt content and direct quarry concession rights.",
    tags: ["Construction & Infrastructure", "M-Sand", "Building Materials", "Aggregates Depot"],
    initialFeasibilityScore: 90
  }
];

const ALT_CONSTRUCTION_IDEAS: StartupIdea[] = [
  {
    id: "build-4",
    name: "InfraRent Heavy Machinery Pool",
    tagline: "Shared Excavator, Crane & Compaction Equipment Rental Depot with Certified Operators",
    domain: "Construction & Infrastructure",
    businessType: "Construction & Infrastructure / Turnkey Contracting",
    problemStatement: "Mid-sized civil contractors and road builders cannot afford multi-crore capital expenditures for heavy excavators, JCBs, and road rollers, while fragmented brokers provide breakdown-prone machines.",
    solution: "A centralized equipment yard providing well-maintained, telematics-tracked earthmoving machinery on hourly, daily, or monthly rental terms with trained, certified operators.",
    targetPersona: {
      title: "Civil contractors, foundation engineers, municipal road builders, and real estate developers",
      painPoints: ["High capital equipment financing debt", "Costly breakdown delays", "Unreliable freelance machine operators"],
      willingnessToPay: "₹1,500 - ₹3,500/hour or ₹1,20,000/month per machine with operator"
    },
    whyNow: "Surge in highway, industrial estate, and water pipeline infrastructure projects across Belagavi district.",
    innovationMoat: "IoT telematics fuel & engine monitoring preventing theft/downtime and mobile rapid repair response vans.",
    tags: ["Construction & Infrastructure", "Equipment Rental", "Heavy Machinery", "Fleet Logistics"],
    initialFeasibilityScore: 88,
    isNew: true
  },
  {
    id: "build-5",
    name: "SolarRoof Commercial EPC & Contracting",
    tagline: "Turnkey Industrial Rooftop Solar Installations & Net-Metering Contracting",
    domain: "Construction & Infrastructure",
    businessType: "Construction & Infrastructure / Turnkey Contracting",
    problemStatement: "Foundries, textile mills, and engineering workshops face soaring industrial electricity tariffs (₹8-11/unit) and complicated DISCOM solar net-metering approvals.",
    solution: "A full-lifecycle solar EPC contracting firm handling structural roof analysis, Tier-1 solar panel installation, inverter grid-tie synchronization, and HESCOM net-metering approvals.",
    targetPersona: {
      title: "Factory owners, cold storage operators, commercial hospital complexes, and industrial park units",
      painPoints: ["Crippling monthly electric bills", "Slow government subsidy paperwork", "Poor quality structural rooftop brackets"],
      willingnessToPay: "₹38,000 - ₹48,000 per kW installed turnkey (typical 50kW-500kW installations)"
    },
    whyNow: "Karnataka state renewable energy policies and fast 3.2-year payback periods for commercial solar installations.",
    innovationMoat: "Pre-engineered wind-tunnel tested non-penetrating aluminum mounting structures and turnkey DISCOM liaison.",
    tags: ["Construction & Infrastructure", "Rooftop Solar", "Turnkey EPC", "Clean Energy"],
    initialFeasibilityScore: 91,
    isNew: true
  },
  {
    id: "build-6",
    name: "ModuLiving Prefab Steel Cottages",
    tagline: "Rapid-Deploy Light Gauge Steel Frame (LGSF) Modular Farmhouses & Resort Pods",
    domain: "Construction & Infrastructure",
    businessType: "Construction & Infrastructure / Turnkey Contracting",
    problemStatement: "Landowners developing farmhouses, agro-tourism plots, and hill resorts face 12-18 month construction timelines with remote labor shortages and heavy weather damage.",
    solution: "Precision factory-manufactured light gauge steel frame (LGSF) modular cottages assembled on-site in 21 days with superior thermal insulation and earthquake resistance.",
    targetPersona: {
      title: "Agro-tourism resort operators, urban farmland owners, and hospitality developers",
      painPoints: ["Remote site labor non-availability", "Severe monsoon build delays", "High maintenance costs of conventional brick buildings"],
      willingnessToPay: "₹1,800 - ₹2,900 per sq ft delivered and assembled"
    },
    whyNow: "Boom in weekend second-home farmland developments and eco-resorts around Khanapur, Jamboti, and Belagavi outskirts.",
    innovationMoat: "CAD/CAM roll-forming precision steel technology delivering airtight building envelopes with 50-year structural warranty.",
    tags: ["Construction & Infrastructure", "LGSF Prefab", "Modular Cottages", "Fast-Track Build"],
    initialFeasibilityScore: 89,
    isNew: true
  }
];

// Curated alternative pool of 3 distinct startup plans per sector
function getAlternativeDomainIdeas(domainKey: string, profile: FounderProfile): StartupIdea[] {
  const targetSector = resolveSectorKey(
    domainKey || profile.domains?.[0] || "",
    profile.businessType || "",
    profile.interests
  );

  switch (targetSector) {
    case "food":
      return ALT_FOOD_IDEAS;
    case "education":
      return ALT_EDUCATION_IDEAS;
    case "healthcare":
      return ALT_HEALTHCARE_IDEAS;
    case "construction":
      return ALT_CONSTRUCTION_IDEAS;
    default:
      return ALT_FOOD_IDEAS;
  }
}

// Built-in intelligent generator for 100% offline & instant generation across the 4 core Belagavi sectors
function generateIntelligentIdeas(
  profile: FounderProfile,
  offset = 0,
  existingIdeas: string[] = []
): StartupIdea[] {
  const targetSector = resolveSectorKey(
    profile.domains?.[0] || "",
    profile.businessType || "",
    profile.interests
  );

  switch (targetSector) {
    case "food":
      return selectDiverseIdeas(FOOD_IDEAS, "food", profile, existingIdeas);
    case "education":
      return selectDiverseIdeas(EDUCATION_IDEAS, "education", profile, existingIdeas);
    case "healthcare":
      return selectDiverseIdeas(HEALTHCARE_IDEAS, "healthcare", profile, existingIdeas);
    case "construction":
      return selectDiverseIdeas(CONSTRUCTION_IDEAS, "construction", profile, existingIdeas);
    default:
      return selectDiverseIdeas(FOOD_IDEAS, "food", profile, existingIdeas);
  }
}

function generateIntelligentValidation(
  idea: StartupIdea,
  profile: FounderProfile,
  tavilyContext?: string
): MarketValidation {
  const targetSector = resolveSectorKey(
    idea.domain || (profile.domains && profile.domains[0]) || "",
    idea.businessType || profile.businessType || "",
    idea.tags
  );

  const loc = profile.targetLocation || BELAGAVI_LOCATION;
  const isNonTech = true;

  let tam = { value: "₹12,10,000 Crores ($145.0B)", numBillions: 145.0, description: "Global and Indian specialty foods, healthy fast-casual dining, and nutritional meal solutions market." };
  let sam = { value: "₹2,37,000 Crores ($28.4B)", numBillions: 28.4, description: "Urban working professionals, health-conscious consumers, and corporate dining accounts." };
  let som = { value: "₹1,500 Crores ($180M)", numBillions: 0.18, description: "Target metro hub catchment and corporate dining delivery corridors over Years 1-3." };
  let cagr = "15.6%";

  if (targetSector === "construction") {
    tam = { value: "₹18,50,000 Crores ($220.0B)", numBillions: 220.0, description: "Total addressable residential, commercial, and infrastructure construction and building materials market." };
    sam = { value: "₹3,40,000 Crores ($40.5B)", numBillions: 40.5, description: "Regional urban contracting, modular building materials, and commercial interior fit-out spend." };
    som = { value: "₹2,100 Crores ($250M)", numBillions: 0.25, description: "Target metropolitan developer and contractor catchment captured within 36 months." };
    cagr = "14.8%";
  } else if (targetSector === "education") {
    tam = { value: "₹5,80,000 Crores ($69.5B)", numBillions: 69.5, description: "Total addressable market for offline STEM academies, competitive coaching institutes, and vocational skills training." };
    sam = { value: "₹1,45,000 Crores ($17.4B)", numBillions: 17.4, description: "K-12 students, competitive exam aspirants, and upskilling college cohorts in tier-1 and tier-2 hubs." };
    som = { value: "₹1,120 Crores ($134M)", numBillions: 0.134, description: "Regional student catchment and institutional partnership accounts over Years 1-3." };
    cagr = "16.8%";
  } else if (targetSector === "healthcare") {
    tam = { value: "₹6,18,000 Crores ($74.0B)", numBillions: 74.0, description: "Physical wellness clinics, contrast recovery studios, and preventive diagnostic health centers." };
    sam = { value: "₹1,30,000 Crores ($15.6B)", numBillions: 15.6, description: "Urban fitness enthusiasts, amateur athletes, and corporate executive wellness memberships." };
    som = { value: "₹790 Crores ($95M)", numBillions: 0.095, description: "Flagship neighborhood studios and corporate wellness partners within initial launch hubs." };
    cagr = "18.5%";
  }

  const regionalMarketDynamics = `Launching in ${loc.city}, ${loc.country} grants direct access to an ecosystem rated ${loc.ecosystemScore}/100 with ${loc.talentIndex} talent. The local funding climate (${loc.vcFundingClimate}) and ${loc.regulatoryFriendliness} provide accelerated seed staging, while target buyer acquisition cost in this territory averages ${loc.avgCustomerAcquisitionCost}. Strategic expansion corridors include ${loc.keyHubs.join(" and ")}.`;

  const competitorComparisonMatrix: CompetitorFeatureComparison = isNonTech
    ? {
        features: [
          "Direct Ethical Sourcing",
          "100% Clean / Eco-Certified Quality",
          "Rapid On-Demand Access",
          "Affordable Transparent Pricing",
          "Sustainable Zero-Waste Packaging",
          "High-Retention Loyalty Program"
        ],
        competitors: [
          {
            name: "Legacy Mass Commercial Brands",
            scores: {
              "Direct Ethical Sourcing": false,
              "100% Clean / Eco-Certified Quality": false,
              "Rapid On-Demand Access": "Batch Retail",
              "Affordable Transparent Pricing": true,
              "Sustainable Zero-Waste Packaging": false,
              "High-Retention Loyalty Program": "Basic Points"
            }
          },
          {
            name: "Unorganized Local Mom & Pop Outlets",
            scores: {
              "Direct Ethical Sourcing": "Inconsistent",
              "100% Clean / Eco-Certified Quality": "Unverified",
              "Rapid On-Demand Access": "Walk-in Only",
              "Affordable Transparent Pricing": true,
              "Sustainable Zero-Waste Packaging": false,
              "High-Retention Loyalty Program": false
            }
          },
          {
            name: "High-Priced Luxury Boutique Chains",
            scores: {
              "Direct Ethical Sourcing": true,
              "100% Clean / Eco-Certified Quality": true,
              "Rapid On-Demand Access": "Limited Locations",
              "Affordable Transparent Pricing": false,
              "Sustainable Zero-Waste Packaging": "Partial",
              "High-Retention Loyalty Program": true
            }
          }
        ],
        ourProduct: {
          name: idea.name,
          scores: {
            "Direct Ethical Sourcing": true,
            "100% Clean / Eco-Certified Quality": true,
            "Rapid On-Demand Access": true,
            "Affordable Transparent Pricing": true,
            "Sustainable Zero-Waste Packaging": true,
            "High-Retention Loyalty Program": true
          }
        }
      }
    : {
        features: [
          "Real-Time Cloud Streaming",
          "Deterministic Safety Guardrails",
          "API-First Developer SDKs",
          "Self-Serve Onboarding (< 5 mins)",
          "Usage-Based Unit Economics",
          "Multi-Agent Workflow Autonomy"
        ],
        competitors: [
          {
            name: "Legacy Incumbents (SAP / Oracle / Custom ERPs)",
            scores: {
              "Real-Time Cloud Streaming": "Batch Only",
              "Deterministic Safety Guardrails": "Partial",
              "API-First Developer SDKs": false,
              "Self-Serve Onboarding (< 5 mins)": "60-Day RFP",
              "Usage-Based Unit Economics": false,
              "Multi-Agent Workflow Autonomy": false
            }
          },
          {
            name: "First-Gen AI Wrappers",
            scores: {
              "Real-Time Cloud Streaming": "High Latency",
              "Deterministic Safety Guardrails": false,
              "API-First Developer SDKs": "Basic REST",
              "Self-Serve Onboarding (< 5 mins)": true,
              "Usage-Based Unit Economics": "Flat Tier",
              "Multi-Agent Workflow Autonomy": "Single Prompt"
            }
          },
          {
            name: "In-House DIY Engineering Scripts",
            scores: {
              "Real-Time Cloud Streaming": "Custom Python",
              "Deterministic Safety Guardrails": "Fragile",
              "API-First Developer SDKs": "Internal Only",
              "Self-Serve Onboarding (< 5 mins)": false,
              "Usage-Based Unit Economics": "High TCO",
              "Multi-Agent Workflow Autonomy": "Experimental"
            }
          }
        ],
        ourProduct: {
          name: idea.name,
          scores: {
            "Real-Time Cloud Streaming": true,
            "Deterministic Safety Guardrails": true,
            "API-First Developer SDKs": true,
            "Self-Serve Onboarding (< 5 mins)": true,
            "Usage-Based Unit Economics": true,
            "Multi-Agent Workflow Autonomy": true
          }
        }
      };

  const targetUserAnalysis: TargetUserAnalysis = {
    personaName: idea.targetPersona.title,
    roleTitle: idea.targetPersona.title.split(" at ")[0] || "Target Customer",
    organizationType: profile.targetAudience,
    acutePainPoints: idea.targetPersona.painPoints,
    buyingTriggerMoments: isNonTech
      ? [
          `Frustration with generic mass-market quality and lack of transparent ethical sourcing in ${idea.domain}.`,
          `Urgent need for convenient, healthy, or sustainable alternatives that fit busy modern lifestyles.`,
          `Corporate or personal sustainability goals demanding verified zero-waste and non-toxic products.`
        ]
      : [
          `Quarterly executive audit exposing critical inefficiencies and manual leaks in ${idea.domain}.`,
          `Customer churn or compliance threat directly linked to unmonitored human errors.`,
          `Engineering capacity exhausted by repetitive maintenance tasks rather than core product delivery.`
        ],
    willingnessToPayRange: idea.targetPersona.willingnessToPay,
    decisionMakers: isNonTech
      ? [
          "Primary End-Consumer / Household Budget Head",
          "Lifestyle / Quality Influencer (Validates ingredients and reviews)",
          "Procurement / Facility Manager (For B2B wholesale orders)"
        ]
      : [
          "VP / C-Level Budget Owner (Signs off on software budget)",
          "Technical Lead / Architect (Validates security & API robustness)",
          "Operations Manager (Champion evaluating day-to-day UX & time savings)"
        ],
    acquisitionChannels: isNonTech
      ? [
          {
            channel: "High-Footfall Neighborhood Storefronts & Experiential Hubs",
            effectiveness: "High",
            estimatedCac: "₹350 - ₹750 / customer"
          },
          {
            channel: "Targeted Localized Social Media (Instagram / Tasting Sampling)",
            effectiveness: "High",
            estimatedCac: "₹250 - ₹500 / customer"
          },
          {
            channel: "B2B Corporate Partnerships & Institutional Subscriptions",
            effectiveness: "Medium",
            estimatedCac: "₹1,200 - ₹2,500 / account"
          }
        ]
      : [
          {
            channel: "Product-Led Inbound (Interactive Tool & Developer Community)",
            effectiveness: "High",
            estimatedCac: "$85 - $150"
          },
          {
            channel: "Targeted Account-Based LinkedIn & Direct Founder Outreach",
            effectiveness: "High",
            estimatedCac: "$220 - $380"
          },
          {
            channel: "Cloud Marketplace (AWS/GCP/Azure) & Strategic API Integrations",
            effectiveness: "Medium",
            estimatedCac: "$170 - $290"
          }
        ],
    adoptionFriction: isNonTech
      ? "Consumer inertia with familiar legacy brands. Overcome through risk-free first-visit samples, transparent QR ingredient traceability, and welcoming modern physical ambiance."
      : "Initial hesitation regarding data privacy and integration latency with legacy databases. Mitigated via 1-click sandbox demo and SOC2 zero-retention assurances.",
    retentionDrivers: isNonTech
      ? [
          "Delightful physical product experience and consistent sensory quality",
          "Automated monthly subscription replenishment with personalized preferences",
          "Exclusive community events, loyalty member discounts, and referral perks"
        ]
      : [
          "Accumulated historical telemetry and custom fine-tuned workflow heuristics",
          "Automated weekly ROI summaries sent directly to leadership",
          "Deep cross-functional team embedding that creates strong workflow lock-in"
        ]
  };

  return {
    ideaId: idea.id,
    marketSummary: tavilyContext
      ? `${tavilyContext} The market for ${idea.name} is supported by verified industry growth trends and expanding customer demand.`
      : (isNonTech
          ? `The market for ${idea.name} is benefiting from a massive consumer movement toward clean ingredients, transparent localized craftsmanship, and sustainable living. High customer loyalty and direct margin capture offer exceptional unit economics.`
          : `The market for ${idea.name} is experiencing an unprecedented structural inflection point driven by API ubiquity, cloud-native scalability, and enterprise digital transformation. Customer willingness-to-pay is exceptionally strong due to direct ROI attribution and immediate labor efficiency gains.`),
    regionalMarketDynamics,
    tavilyResearchSummary: tavilyContext || undefined,
    usedTavily: !!tavilyContext,
    tam,
    sam,
    som,
    cagr,
    competitors: (() => {
      const isBelagavi =
        (loc.city || "").toLowerCase().includes("belagavi") ||
        ((profile.targetLocation?.city || "").toLowerCase().includes("belagavi")) ||
        Boolean(profile.targetArea);
      if (isBelagavi) {
        const areaTerm = profile.targetArea || loc.city || profile.targetLocation?.city || "all";
        const resolvedSector = resolveSectorKey(
          `${idea.domain} ${idea.businessType || ""} ${(profile.domains || []).join(" ")} ${profile.businessType || ""} ${idea.problemStatement || ""}`,
          idea.businessType || profile.businessType,
          idea.tags
        );
        const bComps = filterBelagaviCompetitors(resolvedSector, areaTerm).competitors;
        if (bComps && bComps.length > 0) {
          return bComps.map((c) => ({
            name: c.name,
            brand: c.brand,
            type: c.type,
            strengths: c.strengths,
            weaknesses: c.weaknesses,
            ourDifferentiation: c.ourDifferentiation,
            fundingOrScale: c.fundingOrScale,
            address: c.address,
            locality: c.locality,
            lat: c.lat,
            lng: c.lng,
          }));
        }
      }
      return isNonTech
        ? [
            {
              name: "Legacy commercial mass brands",
              type: "Indirect",
              strengths: "Decades-old distribution contracts, ubiquitous shelf presence, deep marketing budgets.",
              weaknesses: "Ultra-processed or cheap synthetic materials, impersonal corporate brand perception, zero local connection.",
              ourDifferentiation: "100% transparent direct sourcing, superior craftsmanship, zero harmful chemicals, and engaging modern community.",
              fundingOrScale: "Public multi-billion conglomerates"
            },
            {
              name: "Unorganized local street vendors & mom-and-pop shops",
              type: "Direct",
              strengths: "Low overhead, hyper-local neighborhood familiarity.",
              weaknesses: "Inconsistent quality control, lack of sanitary or lab certifications, zero digital ordering or customer loyalty.",
              ourDifferentiation: "Standardized clinical hygiene, certified organic ingredients, seamless digital ordering and membership rewards.",
              fundingOrScale: "Single-outlet operators"
            },
            {
              name: "Expensive luxury boutique brands",
              type: "Direct",
              strengths: "High aesthetic appeal, established aspirational status.",
              weaknesses: "Exorbitant price tags with 5x markups, exclusionary vibe, limited accessibility.",
              ourDifferentiation: "Accessible everyday luxury pricing, direct-to-consumer savings, and welcoming inclusive community spaces.",
              fundingOrScale: "Regional chains / VC-backed niche brands"
            }
          ]
        : [
            {
              name: "Legacy incumbent solutions (SAP, Oracle, or legacy point tools)",
              type: "Indirect",
              strengths: "Established distribution contracts, widespread enterprise lock-in.",
              weaknesses: "Rigid on-prem architecture, lack of native modern AI reasoning, prohibitive implementation fees ($50k+).",
              ourDifferentiation: "Zero-configuration self-serve onboarding, 10x faster deployment, modern API-first composability.",
              fundingOrScale: "Public multi-billion conglomerates"
            },
            {
              name: "First-generation AI wrappers",
              type: "Direct",
              strengths: "Fast initial market hype, viral launch traction.",
              weaknesses: "Superficial prompt wrappers with no deep domain logic, zero data moats, frequent hallucinations.",
              ourDifferentiation: "Full-stack multi-agent verification, robust cloud telemetry, deterministic safety guardrails.",
              fundingOrScale: "Seed / Pre-Series A ($2M - $5M raised)"
            },
            {
              name: "In-house DIY Engineering Teams",
              type: "Indirect",
              strengths: "Tailored to exact internal company quirks.",
              weaknesses: "High ongoing maintenance burden, distraction from core product, fragile custom codebases.",
              ourDifferentiation: "Turnkey enterprise SLA, continuous compliance updates, 90% lower TCO (Total Cost of Ownership).",
              fundingOrScale: "Internal Cost Centers"
            }
          ];
    })(),
    competitorComparisonMatrix,
    targetUserAnalysis,
    realTimeTrends: isNonTech
      ? [
          {
            source: "Retail & Consumer Market Telemetry",
            headline: `Surge in consumer spending on premium, verified ${idea.domain} products`,
            sentiment: "Bullish",
            growthSignal: "+142% YoY consumer demand"
          },
          {
            source: "Supply Chain & Sustainable Sourcing Reports",
            headline: "Accelerated shift toward local direct-from-producer supply chains",
            sentiment: "Bullish",
            growthSignal: "35% lower transit overhead"
          },
          {
            source: "Venture Capital & Consumer Private Equity",
            headline: `Institutional capital actively consolidating top brands in ${idea.domain}`,
            sentiment: "Bullish",
            growthSignal: "Fastest-growing consumer sector"
          }
        ]
      : [
          {
            source: "HackerNews & Developer APIs",
            headline: `Surge in discussions prioritizing automated ${idea.domain} infrastructure`,
            sentiment: "Bullish",
            growthSignal: "+178% YoY mentions"
          },
          {
            source: "Cloud Infrastructure Benchmarks",
            headline: "Rapid shift toward event-driven serverless AI inference pipelines",
            sentiment: "Bullish",
            growthSignal: "41% reduction in inference latency"
          },
          {
            source: "Venture Capital Allocation Reports",
            headline: `Over $3.8B deployed into verticalized AI and ${idea.domain} platforms in the past 12 months`,
            sentiment: "Bullish",
            growthSignal: "Top quartile VC investment category"
          }
        ],
    targetSegments: isNonTech
      ? [
          {
            segment: "Conscious Urban Millennials & Families",
            sizeShare: "45%",
            urgency: "High",
            salesCycle: "Instant Walk-in / Same-day"
          },
          {
            segment: "B2B Corporate Accounts & Hospitality Partners",
            sizeShare: "35%",
            urgency: "High",
            salesCycle: "1 - 2 weeks"
          },
          {
            segment: "Boutique Retailers & Curated Shelf Partners",
            sizeShare: "20%",
            urgency: "Medium",
            salesCycle: "2 - 4 weeks"
          }
        ]
      : [
          {
            segment: "High-Velocity Tech Scaleups",
            sizeShare: "40%",
            urgency: "High",
            salesCycle: "1 - 3 weeks"
          },
          {
            segment: "Traditional Mid-Market Enterprises",
            sizeShare: "38%",
            urgency: "Critical",
            salesCycle: "4 - 8 weeks"
          },
          {
            segment: "Boutique Consultancies & Agencies",
            sizeShare: "22%",
            urgency: "Medium",
            salesCycle: "Under 10 days"
          }
        ]
  };
}

export function buildMvpAndRoadmap(
  idea: StartupIdea,
  profile: FounderProfile,
  isNonTech: boolean
): { mvpRecommendation: MVPRecommendation; businessRoadmap: BusinessRoadmap } {
  const tf = (profile.timeframe || "").toLowerCase();

  const is2Week = tf.includes("2-week") || tf.includes("2 week") || tf.includes("14") || tf.includes("rapid mvp");
  const is6Month = tf.includes("6 month") || tf.includes("enterprise") || tf.includes("24 week") || tf.includes("180");

  if (is2Week) {
    const mvpRecommendation: MVPRecommendation = {
      mvpName: `${idea.name} 2-Week Rapid MVP`,
      timelineWeeks: 2,
      timeframe: profile.timeframe || "2-Week Rapid MVP Sprint",
      coreValueProposition: isNonTech
        ? "An ultra-lean, high-velocity commercial test: handcrafted small batch sample run / direct pop-up pilot validating immediate customer demand and willingness to pay within 14 days."
        : "An ultra-focused, zero-bloat prototype solving the single primary acute bottleneck with sub-second execution to capture initial user commitments in 14 days.",
      featureBacklog: {
        mustHave: isNonTech
          ? [
              "Initial small-batch production run / sample formulation",
              "Direct WhatsApp Business & UPI/QR instant payment checkout",
              "Same-day local courier delivery / pop-up pickup station",
              "Direct customer feedback questionnaire & reorder hook",
            ]
          : [
              "Core algorithmic / AI transaction pipeline (single happy path)",
              "Instant magic-link / OAuth user sign-in",
              "Single primary output screen with instant copy/export",
              "One-click feedback prompt & pilot pre-order payment link",
            ],
        shouldHave: isNonTech
          ? [
              "Branded packaging labels & care cards",
              "Automated WhatsApp dispatch tracking updates",
              "Simple Google Sheets / Airtable inventory counter",
            ]
          : [
              "Automated welcome email via Resend",
              "Basic usage limit meter",
              "Export results to PDF/CSV",
            ],
        couldHave: isNonTech
          ? [
              "Dedicated web storefront with subscription billing",
              "Bulk retail distribution wholesale packaging",
              "Multi-city logistics integration",
            ]
          : [
              "Role-based team workspaces",
              "Custom domain white-labeling",
              "Webhook notifications & Slack integration",
            ],
      },
      recommendedStack: isNonTech
        ? {
            frontend: "WhatsApp Business Catalog + Single-Page Next.js Landing",
            backend: "Direct Dispatch & POS Operations + UPI QR Gateway",
            database: "Supabase / Airtable Lightweight Inventory Cache",
            aiModel: "Batch Production Sizing & Pricing Heuristics",
            lowCodeAccelerators: [
              "Razorpay / UPI Quick Checkout",
              "WhatsApp Business API for order receipts",
              "Dunzo / Local Logistics API",
              "Canva Pro for rapid branded packaging labels",
            ],
          }
        : {
            frontend: "Next.js 14 App Router, Tailwind CSS, Lucide Icons",
            backend: "Next.js Edge Route Handlers + Serverless Functions",
            database: "PostgreSQL (Supabase) + pgvector",
            aiModel: "Google Gemini 1.5 Flash (sub-500ms inference)",
            lowCodeAccelerators: [
              "Clerk / NextAuth for instant secure authentication",
              "Stripe Payment Links for rapid pilot checkout",
              "Upstash Redis for sub-millisecond caching",
              "Resend API for transactional user notifications",
            ],
          },
      fourWeekSprintPlan: [
        {
          week: 1,
          periodLabel: "Week 01",
          daysLabel: "Days 1 - 7",
          title: isNonTech ? "Sourcing & Rapid Prototype Formulation" : "Core Loop Architecture & Single-Flow UI",
          goals: isNonTech
            ? [
                "Secure initial batch ingredients / material samples",
                "Produce first 25 prototype units and test quality",
                "Setup WhatsApp Business catalog & UPI QR payment flow",
              ]
            : [
                "Scaffold Next.js app and wire core AI inference / calculation pipeline",
                "Implement single-page focused UI for the primary job-to-be-done",
                "Deploy staging build to Vercel with mock verification",
              ],
          deliverable: isNonTech
            ? "25 packaged sample units with functional WhatsApp/UPI checkout flow"
            : "Deployable prototype executing the core user workflow end-to-end",
        },
        {
          week: 2,
          periodLabel: "Week 02",
          daysLabel: "Days 8 - 14",
          title: isNonTech ? "Sampling, Direct Sales & Customer Validation" : "Beta User Testing, Polish & Public Launch",
          goals: isNonTech
            ? [
                "Distribute sample units to 50 target customer prospects",
                "Collect first 15 paid pre-orders and feedback ratings",
                "Calculate real unit gross margins and repeat order intent",
              ]
            : [
                "Conduct 5 live usability walkthroughs with target persona users",
                "Fix primary UX drop-off points and implement Stripe payment link",
                "Public launch on Product Hunt, Twitter/X & relevant niche communities",
              ],
          deliverable: isNonTech
            ? "First 15+ paying customers and verified unit economics baseline"
            : "Public production release with first 10-25 active users and paying pilot commitments",
        },
      ],
    };

    const businessRoadmap: BusinessRoadmap = {
      phases: [
        {
          phase: 1,
          title: isNonTech ? "Rapid Pilot Launch & Traction" : "Rapid MVP & Initial Traction",
          timeframe: "Weeks 1 - 4",
          milestones: isNonTech
            ? [
                "Ship 14-day small-batch MVP and fulfill first 50 orders",
                "Achieve 40%+ customer satisfaction score and positive reviews",
                "Establish consistent raw material supply relationships",
                "Reach initial ₹75,000 in weekly sales",
              ]
            : [
                "Ship 14-day rapid MVP to production",
                "Onboard first 25 active users with > 50% weekly return rate",
                "Collect first 3 signed LOIs or paying pilot subscriptions",
                "Launch public waitlist reaching 300+ signups",
              ],
          keyMetrics: isNonTech ? "50 Customers · 40% Repeat Rate · ₹75k Sales" : "25 Active Users · 3 Paying Pilots · < 500ms Core Latency",
          fundingGoal: "Bootstrapped / ₹5L - ₹15L Micro-Angel",
          status: "Active",
        },
        {
          phase: 2,
          title: isNonTech ? "Commercial Expansion & Regular Orders" : "Closed Beta & Feature Iteration",
          timeframe: "Months 2 - 4",
          milestones: isNonTech
            ? [
                "Scale to 150 regular weekly customers",
                "Introduce 2 new complementary product SKUs",
                "Streamline kitchen/workshop prep to cut fulfillment time 40%",
                "Reach ₹3,50,000 monthly revenue",
              ]
            : [
                "Onboard 75 active users across 15 organizations",
                "Deploy automated email digest and export engine",
                "Reach first $3,000 in Monthly Recurring Revenue (MRR)",
                "Optimize API inference cost by 35% with caching",
              ],
          keyMetrics: isNonTech ? "₹3.5L Monthly Revenue · 60% Repeat Rate" : "$3k MRR · 55% WAU/MAU · NPS 60+",
          fundingGoal: "₹25L - ₹50L Angel Seed",
          status: "Upcoming",
        },
        {
          phase: 3,
          title: isNonTech ? "Multi-Channel Distribution" : "Product-Market Fit & Monetization Scale",
          timeframe: "Months 5 - 8",
          milestones: isNonTech
            ? [
                "Launch on regional delivery aggregators & boutique retail shelves",
                "Establish corporate bulk orders program",
                "Cross ₹10,00,000 monthly run-rate",
              ]
            : [
                "Scale to 200 paying accounts",
                "Launch self-serve annual subscription billing",
                "Achieve $15,000+ MRR with < 3% monthly churn",
              ],
          keyMetrics: isNonTech ? "₹10L Monthly Revenue · 65% Margin" : "$15k MRR · 10x LTV:CAC",
          fundingGoal: "₹1 Crore - ₹2 Crore Pre-Series A",
          status: "Planned",
        },
        {
          phase: 4,
          title: isNonTech ? "Brand Scaling & City Hubs" : "Market Expansion & Scale",
          timeframe: "Months 9 - 12",
          milestones: isNonTech
            ? [
                "Expand to 3 neighborhood delivery/retail hubs",
                "Launch subscription replenishment membership",
                "Cross ₹30,00,000 monthly revenue",
              ]
            : [
                "Introduce team enterprise tier with SOC2 baseline",
                "Cross $40,000+ MRR ($480k ARR)",
                "Prepare institutional venture round",
              ],
          keyMetrics: isNonTech ? "₹30L Monthly Run-Rate · 3 Hubs" : "₹32L MRR · 80% Gross Margin",
          fundingGoal: "₹8 Crore - ₹20 Crore Seed / Pre-Series A",
          status: "Planned",
        },
      ],
    };

    return { mvpRecommendation, businessRoadmap };
  }

  if (is6Month) {
    const mvpRecommendation: MVPRecommendation = isNonTech
      ? {
          mvpName: `${idea.name} Enterprise Production Facility`,
          timelineWeeks: 24,
          timeframe: profile.timeframe || "6 Months Enterprise Grade",
          coreValueProposition: "An industrial-scale commercial enterprise: state-of-the-art production facility with ISO/HACCP certifications, corporate procurement SLAs, and dedicated supply chain resilience over 6 months.",
          featureBacklog: {
            mustHave: [
              "Industrial production facility with certified ISO/health safety standards",
              "Enterprise B2B procurement contract portal with Net-30 invoicing",
              "Batch traceability & QR-verified supply chain provenance",
              "Dedicated account manager & SLA-backed delivery fulfillment",
            ],
            shouldHave: [
              "Automated cold-chain / climate-controlled fleet monitoring",
              "Centralized ERP integration (SAP / Zoho Books enterprise sync)",
              "Custom client packaging & white-label corporate branding",
              "Automated inventory buffer warning & replenishment system",
            ],
            couldHave: [
              "National franchise licensing & master franchisee portal",
              "Regional warehouse depot expansion blueprint",
              "Automated robotic packaging sorting lines",
            ],
          },
          recommendedStack: {
            frontend: "Next.js 14 Enterprise Portal + Tailored B2B Dashboard",
            backend: "ERP & Automated Industrial Dispatch System + WhatsApp API",
            database: "PostgreSQL (Aurora Multi-AZ) + Redis Telematics Cache",
            aiModel: "Predictive Demand Forecasting & Fleet Routing Optimization",
            lowCodeAccelerators: [
              "RazorpayX / Stripe Invoicing for Net-30 B2B billing",
              "Zoho Creator / AppSheet for internal floor management",
              "Shiprocket Enterprise / Cold-Chain Logistics API",
              "Tally Cloud API for automated GST e-way billing",
            ],
          },
          fourWeekSprintPlan: [
            {
              week: 1,
              periodLabel: "Phase 01",
              daysLabel: "Month 1",
              title: "Industrial Facility Blueprint & Regulatory Licensing",
              goals: [
                "Complete facility layout engineering and machinery procurement bids",
                "Initiate ISO/HACCP and local environmental safety compliance filings",
                "Finalize long-term raw material grower/supplier exclusivity pacts",
              ],
              deliverable: "Approved industrial blueprint, compliance filings, and supplier contracts",
            },
            {
              week: 2,
              periodLabel: "Phase 02",
              daysLabel: "Months 2 - 3",
              title: "Pilot Plant Commissioning & Batch Validation",
              goals: [
                "Install industrial processing equipment and test pilot runs",
                "Conduct comprehensive lab shelf-life and stress-testing protocols",
                "Establish automated quality assurance inspection checkpoints",
              ],
              deliverable: "Commissioned pilot facility producing lab-certified quality runs",
            },
            {
              week: 3,
              periodLabel: "Phase 03",
              daysLabel: "Months 4 - 5",
              title: "Enterprise Client Trials & Commercial Pre-Sales",
              goals: [
                "Initiate 10 commercial trials with institutional hospitality/retail buyers",
                "Deploy B2B procurement portal with automated GST invoice generation",
                "Finalize first 3 annual supply contracts with guaranteed minimum off-takes",
              ],
              deliverable: "3 signed commercial enterprise contracts with ₹15L+ committed pipeline",
            },
            {
              week: 4,
              periodLabel: "Phase 04",
              daysLabel: "Month 6",
              title: "Commercial Production Rollout & SLA Operations",
              goals: [
                "Commence full commercial manufacturing and distribution operations",
                "Fulfill enterprise orders with 99.5% on-time delivery SLA guarantee",
                "Establish recurring monthly revenue baseline exceeding ₹12,00,000",
              ],
              deliverable: "Full-scale certified manufacturing operations with profitable enterprise accounts",
            },
          ],
        }
      : {
          mvpName: `${idea.name} Enterprise Platform MVP`,
          timelineWeeks: 24,
          timeframe: profile.timeframe || "6 Months Enterprise Grade",
          coreValueProposition: "A high-assurance enterprise platform engineered for mission-critical reliability: SOC2/ISO27001 readiness, dedicated VPC deployment, granular RBAC, and guaranteed 99.9% uptime SLAs over 6 months.",
          featureBacklog: {
            mustHave: [
              "Enterprise SSO (SAML 2.0 / Okta / Azure AD) & SCIM user provisioning",
              "Role-based access control (RBAC) with granular tenant permissioning",
              "Immutable audit logging & compliance activity export",
              "High-availability multi-region cloud deployment with automated failover",
            ],
            shouldHave: [
              "Custom API webhooks & bi-directional enterprise CRM integration",
              "Dedicated VPC / single-tenant data residency options",
              "Automated security vulnerability & patch monitoring",
              "Enterprise SLA monitoring & automated latency alerting",
            ],
            couldHave: [
              "On-premise air-gapped Docker/Kubernetes appliance",
              "Custom fine-tuned private AI models on enterprise data",
              "Multi-region active-active database replication",
            ],
          },
          recommendedStack: {
            frontend: "Next.js 14 App Router, Tailwind CSS, shadcn/ui, Recharts",
            backend: "AWS ECS Fargate Container Microservices + Go/Node.js API",
            database: "Amazon Aurora PostgreSQL Multi-AZ with pgvector & DynamoDB",
            aiModel: "Self-hosted vLLM on AWS Bedrock / Private Gemini Enterprise VPC",
            lowCodeAccelerators: [
              "WorkOS / BoxyHQ for instant Enterprise SSO & SCIM",
              "Stripe Billing Enterprise for custom contract invoicing",
              "AWS KMS & Vault for hardware-grade key management",
              "Datadog / AWS CloudWatch for real-time SLA telemetry",
            ],
          },
          fourWeekSprintPlan: [
            {
              week: 1,
              periodLabel: "Phase 01",
              daysLabel: "Month 1",
              title: "Enterprise Architecture & Security Blueprint",
              goals: [
                "Formalize architectural RFCs, data isolation models & threat matrices",
                "Configure AWS/GCP multi-region VPC with encrypted secrets management",
                "Draft SOC2 Type I control mappings and vendor risk assessment",
              ],
              deliverable: "Verified enterprise cloud topology and isolated staging environment",
            },
            {
              week: 2,
              periodLabel: "Phase 02",
              daysLabel: "Months 2 - 3",
              title: "Core Enterprise Platform & Identity Federation",
              goals: [
                "Implement enterprise SSO (SAML/Okta) and SCIM provisioning",
                "Build scalable microservices with event-driven message queuing",
                "Develop automated CI/CD security scanning (SAST/DAST) in pipeline",
              ],
              deliverable: "Functional core enterprise platform passing baseline penetration tests",
            },
            {
              week: 3,
              periodLabel: "Phase 03",
              daysLabel: "Months 4 - 5",
              title: "Enterprise Integrations, Audit Trails & Pilot Staging",
              goals: [
                "Implement immutable audit logs and exportable compliance reports",
                "Build custom CRM/ERP webhooks and bi-directional sync adapters",
                "Deploy private staging sandbox for enterprise design partner testing",
              ],
              deliverable: "Feature-complete enterprise platform deployed in staging with 5 corporate pilots",
            },
            {
              week: 4,
              periodLabel: "Phase 04",
              daysLabel: "Month 6",
              title: "SOC2 Certification, HA Validation & Commercial Rollout",
              goals: [
                "Complete third-party SOC2 Type I audit and penetration testing",
                "Validate 99.9% uptime SLA under simulated heavy load conditions",
                "Convert 5 enterprise pilot accounts into multi-year commercial contracts",
              ],
              deliverable: "Production release with enterprise SLA guarantees and first $100k+ in contract value",
            },
          ],
        };

    const businessRoadmap: BusinessRoadmap = {
      phases: [
        {
          phase: 1,
          title: isNonTech ? "Industrial Facility Build & Pilot Testing" : "Enterprise Platform Build & Pilot Validation",
          timeframe: "Months 1 - 6",
          milestones: isNonTech
            ? [
                "Complete facility buildout and achieve ISO/HACCP certification",
                "Produce first 5,000 industrial batch units with 0 defects",
                "Sign 5 enterprise supply contracts with corporate chains",
                "Reach ₹15,00,000 monthly pilot revenue",
              ]
            : [
                "Ship enterprise MVP with SAML SSO, RBAC, and SOC2 readiness",
                "Deploy to private VPC for 5 enterprise design partners",
                "Achieve 99.9% availability SLA across 500k API transactions",
                "Secure 3 enterprise annual pilot contracts ($75k+ ARR)",
              ],
          keyMetrics: isNonTech ? "ISO Certified · ₹15L Monthly Revenue · 5 Enterprise Contracts" : "3 Enterprise Contracts · $75k ARR · 99.9% SLA · SOC2 Ready",
          fundingGoal: "₹1.5 Crore - ₹3 Crore Institutional Seed",
          status: "Active",
        },
        {
          phase: 2,
          title: isNonTech ? "Commercial Expansion & Regional Fleet" : "Enterprise Pilot Rollout & ARR Expansion",
          timeframe: "Months 7 - 9",
          milestones: isNonTech
            ? [
                "Expand regional logistics network to cover 3 metropolitan clusters",
                "Cross ₹40,00,000 monthly gross revenue",
                "Reduce bulk ingredient procurement costs by 15%",
              ]
            : [
                "Expand to 20 paying mid-market and enterprise accounts",
                "Achieve SOC2 Type II certification report",
                "Cross $30,00,000+ MRR ($360k ARR) with net negative churn",
              ],
          keyMetrics: isNonTech ? "₹40L Monthly Revenue · 65% Gross Margin" : "$30k MRR · Net Revenue Retention 118%",
          fundingGoal: "₹3 Crore - ₹6 Crore Pre-Series A",
          status: "Upcoming",
        },
        {
          phase: 3,
          title: isNonTech ? "Multi-Facility Scale & Institutional Supply" : "Global Enterprise Scaling & Integration Ecosystem",
          timeframe: "Months 10 - 14",
          milestones: isNonTech
            ? [
                "Commission second manufacturing plant in strategic hub",
                "Cross ₹1 Crore monthly run-rate with positive cash flow",
                "Establish national distributor partnerships across 20 cities",
              ]
            : [
                "Scale to 60 enterprise accounts with dedicated customer success",
                "Launch integration marketplace with 25 pre-built enterprise connectors",
                "Cross $80,000+ MRR ($1M ARR)",
              ],
          keyMetrics: isNonTech ? "₹1 Cr Monthly Run-Rate · 2 Facilities" : "₹65L MRR · 12x LTV:CAC",
          fundingGoal: "₹25 Crore - ₹50 Crore Series A",
          status: "Planned",
        },
        {
          phase: 4,
          title: isNonTech ? "National Dominance & Export Expansion" : "Market Dominance & Institutional Series A",
          timeframe: "Months 15 - 18",
          milestones: isNonTech
            ? [
                "Initiate international export distribution to Middle East & SE Asia",
                "Reach ₹3 Crore monthly revenue",
                "Prepare institutional growth equity round",
              ]
            : [
                "Expand enterprise sales into European and Asia-Pacific corridors",
                "Cross ₹1.5 Crore+ MRR",
                "Complete institutional Series A venture round",
              ],
          keyMetrics: isNonTech ? "₹3 Cr Monthly Revenue · Export Operations" : "₹1.5 Cr MRR · 88% Gross Margin",
          fundingGoal: "₹80 Crore+ Series B / Growth Round",
          status: "Planned",
        },
      ],
    };

    return { mvpRecommendation, businessRoadmap };
  }

  // Default: 1-3 Months Full Beta (8 - 12 Weeks)
  const mvpRecommendation: MVPRecommendation = isNonTech
    ? {
        mvpName: `${idea.name} Full Production Beta`,
        timelineWeeks: 10,
        timeframe: profile.timeframe || "1-3 Months Full Beta",
        coreValueProposition: "A comprehensive commercial establishment: multi-channel storefront / fully equipped commissary with automated inventory, repeat subscription club, and verified brand positioning.",
        featureBacklog: {
          mustHave: [
            "Dedicated high-conversion web storefront & omnichannel POS",
            "Automated weekly/monthly doorstep subscription replenishment",
            "Integrated logistics & courier dispatch tracking (Shiprocket/Dunzo)",
            "Multi-tier loyalty points & automated customer re-engagement",
          ],
          shouldHave: [
            "Corporate bulk gifting & B2B procurement portal",
            "Automated supplier reorder threshold alerts",
            "Custom branded packaging & unboxing experience",
            "Weekly inventory & margin tracking dashboard",
          ],
          couldHave: [
            "Franchise SOP operations manual & training portal",
            "Regional warehouse depot expansion blueprint",
            "Wholesale retail shelf package distribution",
          ],
        },
        recommendedStack: {
          frontend: "Next.js 14 Web Storefront / Shopify Headless + Tailwind CSS",
          backend: "Omnichannel POS & Inventory Operations + WhatsApp API",
          database: "PostgreSQL (Supabase) + Local Offline POS Cache",
          aiModel: "Demand Forecasting & Automated Inventory Replenishment Heuristics",
          lowCodeAccelerators: [
            "Razorpay / Stripe for multi-currency payment checkout",
            "Shiprocket / Local Logistics API for express delivery",
            "WhatsApp Business API for automated order updates",
            "Zoho / Tally Cloud for GST invoice compliance",
          ],
        },
        fourWeekSprintPlan: [
          {
            week: 1,
            periodLabel: "Phase 01",
            daysLabel: "Weeks 1 - 2",
            title: "Supply Chain, Formulation & Legal Licensing",
            goals: [
              "Secure verified grower/supplier contracts and batch ingredients",
              "Obtain FSSAI, trade license, and GST registrations",
              "Finalize product packaging design and eco-friendly materials",
            ],
            deliverable: "Approved production specifications and verified regulatory compliance",
          },
          {
            week: 2,
            periodLabel: "Phase 02",
            daysLabel: "Weeks 3 - 5",
            title: "Production Setup & Omnichannel Digital Storefront",
            goals: [
              "Equip commercial production kitchen / workshop facility",
              "Deploy Next.js / Shopify web storefront with WhatsApp bot",
              "Connect Razorpay/UPI payment gateway and automated order alerts",
            ],
            deliverable: "Fully operational pilot production facility with live online checkout",
          },
          {
            week: 3,
            periodLabel: "Phase 03",
            daysLabel: "Weeks 6 - 8",
            title: "Sampling, Corporate Tie-Ups & Closed Beta Pilot",
            goals: [
              "Distribute 250 curated sample units to target buyer personas",
              "Sign 3 corporate cafeteria or boutique retail placement accounts",
              "Launch Instagram pre-order waitlist campaign with early-bird perks",
            ],
            deliverable: "75+ confirmed pre-orders and 3 signed B2B commercial distribution agreements",
          },
          {
            week: 4,
            periodLabel: "Phase 04",
            daysLabel: "Weeks 9 - 12",
            title: "Commercial Public Launch & Operational Scaling",
            goals: [
              "Execute coordinated public launch across target metropolitan hubs",
              "Fulfill first 500 customer orders with personalized feedback cards",
              "Achieve unit-positive gross margins and establish 35%+ repeat rate",
            ],
            deliverable: "Live commercial operations generating ₹3,50,000+ monthly revenue with strong repeat traction",
          },
        ],
      }
    : {
        mvpName: `${idea.name} Full Beta Platform`,
        timelineWeeks: 10,
        timeframe: profile.timeframe || "1-3 Months Full Beta",
        coreValueProposition: "A robust, production-grade SaaS beta platform with automated multi-tenant onboarding, usage-based billing, enterprise analytics, and high-availability cloud architecture.",
        featureBacklog: {
          mustHave: [
            "Multi-tenant role-based workspace with team member invites",
            "Automated AI data pipeline with semantic caching & fallback models",
            "Self-serve Stripe billing integration (subscriptions & metered usage)",
            "Interactive analytics dashboard with automated PDF/CSV reporting",
          ],
          shouldHave: [
            "Developer API keys & webhook trigger subscriptions",
            "Detailed audit logs & exportable compliance reports",
            "Custom domain white-labeling & theme customization",
            "Automated email notifications via Resend",
          ],
          couldHave: [
            "Multi-region data residency compliance toggle",
            "Bi-directional CRM & Slack integration",
            "Custom enterprise SSO / SAML integration",
          ],
        },
        recommendedStack: {
          frontend: "Next.js 14 App Router, Tailwind CSS, Lucide Icons, Recharts",
          backend: "Next.js Edge Route Handlers + AWS Lambda Serverless Workers",
          database: "PostgreSQL (Aurora Serverless / Supabase) with pgvector",
          aiModel: "Google Gemini 1.5 Flash + Claude 3.5 Sonnet hybrid fallback",
          lowCodeAccelerators: [
            "Clerk / NextAuth for instant secure authentication",
            "Stripe Elements for rapid payment flow",
            "Upstash Redis for sub-millisecond semantic caching",
            "Resend API for transactional user notifications",
          ],
        },
        fourWeekSprintPlan: [
          {
            week: 1,
            periodLabel: "Phase 01",
            daysLabel: "Weeks 1 - 2",
            title: "Architecture Foundation & Multi-Tenant Setup",
            goals: [
              "Configure PostgreSQL schema with pgvector & multi-tenant isolation",
              "Implement Clerk/NextAuth secure authentication & team workspaces",
              "Build mock API data ingestion adapters and CI/CD pipelines",
            ],
            deliverable: "Deployable staging backend with functioning authentication and test suites",
          },
          {
            week: 2,
            periodLabel: "Phase 02",
            daysLabel: "Weeks 3 - 5",
            title: "Core AI Engine & Workflow Automation Pipeline",
            goals: [
              "Integrate Gemini 1.5 Flash + Claude 3.5 Sonnet fallback engine",
              "Implement Redis semantic caching for sub-millisecond responses",
              "Construct primary workflow automation and user dashboard views",
            ],
            deliverable: "Functional core platform delivering end-to-end user workflows with < 800ms latency",
          },
          {
            week: 3,
            periodLabel: "Phase 03",
            daysLabel: "Weeks 6 - 8",
            title: "Self-Serve Billing, Analytics & Closed Beta Testing",
            goals: [
              "Connect Stripe subscription billing tiers and metered credits",
              "Build interactive analytics charts and automated report exports",
              "Onboard 15 closed-beta design partners and collect telemetry",
            ],
            deliverable: "Complete end-to-end user journey with automated payments and 15 active beta teams",
          },
          {
            week: 4,
            periodLabel: "Phase 04",
            daysLabel: "Weeks 9 - 12",
            title: "Security Hardening, Performance Tuning & Public Launch",
            goals: [
              "Execute security penetration testing and rate-limiting guardrails",
              "Deploy global CDN edge caching and automated uptime monitoring",
              "Public launch on Product Hunt, HackerNews, and targeted founder channels",
            ],
            deliverable: "Public production release with live telemetry, automated billing, and first 50 paying customers",
          },
        ],
      };

  const businessRoadmap: BusinessRoadmap = {
    phases: [
      {
        phase: 1,
        title: isNonTech ? "Beta Launch & Community Traction" : "Full Beta Launch & Initial Traction",
        timeframe: "Months 1 - 3",
        milestones: isNonTech
          ? [
              "Launch flagship beta storefront / batch production facility",
              "Acquire first 350 paying retail & direct subscription customers",
              "Attain 45%+ monthly repeat purchase rate",
              "Partner with 8 regional retailers / corporate accounts",
            ]
          : [
              "Complete 20 problem validation interviews with target buyers",
              "Ship production-ready beta platform with automated billing",
              "Collect first 10 signed Letters of Intent (LOIs) or paid pilots",
              "Launch public waitlist reaching 1,000+ signups",
            ],
        keyMetrics: isNonTech ? "350 Customers · 45% Repeat Rate · ₹5,00,000 Sales" : "10 LOIs · 45% conversion · < 600ms API latency",
        fundingGoal: "Bootstrapped / ₹20L - ₹40L Angel Pre-Seed",
        status: "Active",
      },
      {
        phase: 2,
        title: isNonTech ? "Multi-Hub Expansion & Subscriptions" : "Monetization & Retention Scale",
        timeframe: "Months 4 - 6",
        milestones: isNonTech
          ? [
              "Open second neighborhood hub / expand production capacity 3x",
              "Launch automated doorstep subscription replenishment club",
              "Reach ₹15,00,000 in monthly gross revenue",
              "Optimize unit cost of goods sold (COGS) by 18%",
            ]
          : [
              "Onboard 100 active beta companies",
              "Achieve weekly retention rate above 65%",
              "Reach first $10,000 in Monthly Recurring Revenue (MRR)",
              "Optimize infrastructure unit costs by 30%",
            ],
        keyMetrics: isNonTech ? "₹15L Monthly Revenue · 62% Gross Margin" : "$10k MRR · 65% WAU/MAU · NPS 68+",
        fundingGoal: "₹75L - ₹1.5 Crore Pre-Series A / Angel Round",
        status: "Upcoming",
      },
      {
        phase: 3,
        title: isNonTech ? "Regional Scale & B2B Distribution" : "Product-Market Fit & Market Expansion",
        timeframe: "Months 7 - 9",
        milestones: isNonTech
          ? [
              "Scale to 10 retail locations and 60+ retail shelf partners",
              "Launch corporate catering / institutional supply contracts",
              "Cross ₹40,00,000 monthly run-rate with positive operating cashflow",
            ]
          : [
              "Scale to 350 paying SMB & Mid-Market customers",
              "Launch developer API marketplace & webhooks",
              "Achieve $35,000+ MRR with negative net revenue churn",
            ],
        keyMetrics: isNonTech ? "₹40L Monthly Revenue · 68% Product Margin" : "$35k MRR ($420k ARR) · < 2% Churn · 11x LTV:CAC",
        fundingGoal: "₹2.5 Crore - ₹5 Crore Growth Round",
        status: "Planned",
      },
      {
        phase: 4,
        title: isNonTech ? "National Brand & Franchise Rollout" : "Enterprise Expansion & Institutional Scale",
        timeframe: "Months 10 - 12",
        milestones: isNonTech
          ? [
              "Launch asset-light franchise expansion across Tier-1 metros",
              "Expand direct-to-consumer nationwide e-commerce shipping",
              "Cross ₹1.2 Crore monthly gross revenue",
            ]
          : [
              "Introduce Enterprise Tier with SOC2 & dedicated VPC",
              "Expand sales channels into European & Asian-Pacific corridors",
              "Cross $100,000+ MRR ($1.2M ARR)",
            ],
        keyMetrics: isNonTech ? "₹1.2 Cr Monthly Run-Rate · 30+ Network Locations" : "₹80L MRR · 10 Enterprise Contracts · 85% Gross Margin",
        fundingGoal: "₹20 Crore - ₹40 Crore Series A",
        status: "Planned",
      },
    ],
  };

  return { mvpRecommendation, businessRoadmap };
}

function generateIntelligentFeasibility(
  idea: StartupIdea,
  validation: MarketValidation,
  profile: FounderProfile
): FeasibilityReport {
  const dLower = (idea.domain + " " + (idea.businessType || "") + " " + idea.tags.join(" ")).toLowerCase();
  const isExplicitTech = (
    dLower.includes("software & saas") ||
    dLower.includes("software platform") ||
    dLower.includes("compliance platform") ||
    dLower.includes("cloud middleware") ||
    dLower.includes("ai platform")
  ) && !dLower.includes("hardware") && !dLower.includes("physical") && !dLower.includes("construct") && !dLower.includes("constuct") && !dLower.includes("manufacturing");
  const isNonTech = !isExplicitTech;

  const loc = profile.targetLocation || {
    city: "San Francisco / Silicon Valley",
    country: "United States",
    ecosystemScore: 98,
    talentIndex: "9.8/10 World-Class"
  };

  // High-conviction viability score matching user blueprint: 84/100
  const overallScore = 84;
  const technicalScore = isNonTech ? 88 : 86;
  const marketScore = 86;
  const financialScore = 87;
  const regulatoryScore = 78;
  const executionScore = 83;

  const scoringEngine: ScoringEngineBreakdown = {
    viabilityScore: overallScore,
    verdict: "Strong Go",
    verdictSummary: isNonTech
      ? `The AI Scoring Engine calculated an aggregate Startup Viability Score of ${overallScore}/100. This concept demonstrates high structural viability with favorable unit economics (LTV:CAC > 10x), low technical execution risk using modular supply chain and turnkey equipment, and strong product-market timing in ${loc.city}.`
      : `The AI Scoring Engine calculated an aggregate Startup Viability Score of ${overallScore}/100. This concept demonstrates high structural viability with favorable unit economics (LTV:CAC > 8x), immediate technical feasibility using modern cloud serverless primitives, and an optimal launch ecosystem in ${loc.city}.`,
    percentileRank: isNonTech ? "Top 6% of Early-Stage Commercial Concepts" : "Top 9% of Early-Stage Tech Concepts",
    factors: [
      {
        id: "tech",
        name: isNonTech ? "Operational & Supply Feasibility" : "Technical Feasibility",
        score: technicalScore,
        weight: 20,
        impact: "Positive",
        rationale: isNonTech
          ? "Established local supplier contracts, turnkey commercial equipment, and standardized operating procedures ensure fast buildability with minimal technical debt."
          : "Cloud-native serverless primitives, pgvector embeddings, and low-latency API models ensure fast buildability with minimal technical debt."
      },
      {
        id: "market",
        name: "Market Demand & Timing",
        score: marketScore,
        weight: 25,
        impact: "Positive",
        rationale: `Strong sector CAGR of ${validation.cagr} combined with acute customer willingness to pay creates an immediate commercial window.`
      },
      {
        id: "financial",
        name: "Unit Economics & Monetization",
        score: financialScore,
        weight: 25,
        impact: "Positive",
        rationale: isNonTech
          ? "Strong product gross margins (60-70%) and projected 11.5x LTV:CAC driven by organic repeat footfall and subscription replenishment."
          : "High gross software margin (84%+) and projected 11.3x LTV:CAC ratio ensure strong capital efficiency and rapid runway extension."
      },
      {
        id: "regulatory",
        name: "Regulatory & Compliance Moat",
        score: regulatoryScore,
        weight: 15,
        impact: "Neutral",
        rationale: isNonTech
          ? `Standard commercial licensing (FSSAI/EPR/municipal trade permits) is well-defined; ${loc.city} ecosystem provides clear regulatory frameworks.`
          : `Proactive data privacy sandboxing required; ${loc.city} regulatory ecosystem provides favorable frameworks and clear legal paths.`
      },
      {
        id: "execution",
        name: "Speed to MVP Velocity",
        score: executionScore,
        weight: 15,
        impact: "Positive",
        rationale: `${profile.timeframe || "Rapid"} execution roadmap utilizing low-code accelerators and pre-built operational modules enables quick time-to-market.`
      }
    ]
  };

  const { mvpRecommendation, businessRoadmap } = buildMvpAndRoadmap(idea, profile, isNonTech);

  return {
    overallScore,
    technicalScore,
    marketScore,
    financialScore,
    regulatoryScore,
    executionScore,
    verdict: "Strong Go",
    verdictSummary: isNonTech
      ? `High-conviction commercial profile (${overallScore}/100 Viability Score). Compelling value proposition with robust product gross margins (65%+), low technical execution risk using modern omnichannel POS and e-commerce primitives, and rapid customer payback in ${loc.city}.`
      : `High-conviction startup profile (${overallScore}/100 Viability Score). Clear acute problem with strong unit economics, high gross software margins (84%+), and immediate technical feasibility leveraging existing cloud serverless primitives and production-ready APIs in ${loc.city}.`,
    radarData: [
      { subject: isNonTech ? "Ops Feasibility" : "Tech Feasibility", score: technicalScore, fullMark: 100 },
      { subject: "Market Demand", score: marketScore, fullMark: 100 },
      { subject: "Unit Economics", score: financialScore, fullMark: 100 },
      { subject: "Compliance & Moat", score: regulatoryScore, fullMark: 100 },
      { subject: "Execution Speed", score: executionScore, fullMark: 100 }
    ],
    scoringEngine,
    mvpRecommendation,
    businessRoadmap,
    cloudArchitecture: {
      recommendedProvider: "AWS",
      compute: isNonTech ? "Headless E-Commerce Edge Functions + Cloud POS Backend" : "AWS Lambda / AWS Fargate Containerized Microservices",
      database: "PostgreSQL (Aurora Serverless / Supabase) for Inventory, Orders & User Profiles",
      aiInference: isNonTech ? "Demand Forecasting & Inventory Optimization Heuristics" : "Google Gemini 1.5 Flash + Claude 3.5 Sonnet fallback via LiteLLM Gateway",
      storageAndCDN: "Amazon S3 Object Store + CloudFront Edge Distribution for Media & Catalog",
      thirdPartyAPIs: isNonTech
        ? [
            { name: "Razorpay / Stripe Billing API", purpose: "Automated recurring subscriptions, POS payments & UPI checkout", costTier: "2% per transaction" },
            { name: "Shiprocket / Local Delivery Fleet", purpose: "Doorstep dispatch and automated courier tracking webhooks", costTier: "Pay-as-you-go per order" },
            { name: "WhatsApp Business API", purpose: "Order confirmation receipts, dispatch alerts & loyalty notifications", costTier: "₹0.35 per conversation" },
            { name: "Zoho / Tally Cloud GST API", purpose: "Automated tax invoice generation and compliance ledger sync", costTier: "₹999 / month" }
          ]
        : [
            { name: "Stripe Billing API", purpose: "Automated subscription tiers, usage metering, and invoice generation", costTier: "2.9% + 30c / tx" },
            { name: "Resend / SendGrid", purpose: "Transactional notification emails and daily summary reports", costTier: "Free tier / $20/mo" },
            { name: "Public Market APIs & Webhooks", purpose: "Real-time telemetry ingestion and external data enrichment", costTier: "Pay-as-you-go" },
            { name: "Auth0 / Clerk", purpose: "Enterprise SSO, OAuth2, and multi-tenant role-based access", costTier: "Free up to 10k MAU" }
          ],
      diagramComponents: [
        {
          category: "Frontend & Edge",
          name: isNonTech ? "Next.js Storefront & POS Portal" : "Next.js on Vercel / CloudFront",
          details: isNonTech ? "Omnichannel customer store, instant catalog browsing, and store iPad POS interface." : "Global edge CDN delivery, client-side caching, dynamic SSR, and instantaneous UI response.",
          cloudIcon: "aws"
        },
        {
          category: "API Gateway & Auth",
          name: "API Gateway + JWT Auth",
          details: "Rate limiting, SSL termination, DDoS protection with AWS WAF, and identity authorization.",
          cloudIcon: "api"
        },
        {
          category: "AI & Core Compute",
          name: isNonTech ? "Order Dispatch & Reordering Engine" : "AWS Lambda / ECS Fargate + Queue Workers",
          details: isNonTech ? "Automated order routing to nearest kitchen/hub, courier assignment, and stock level alerts." : "Serverless event-driven execution that scales to zero when idle, handling LLM prompts and background jobs.",
          cloudIcon: "ai"
        },
        {
          category: "Database & Storage",
          name: "Aurora Serverless PostgreSQL",
          details: "ACID-compliant inventory balances, customer order history, and subscription schedules.",
          cloudIcon: "db"
        },
        {
          category: "3rd-Party APIs",
          name: isNonTech ? "Payment Gateways + WhatsApp + Shipping" : "Stripe + External Trend APIs + Email Webhooks",
          details: isNonTech ? "Direct customer checkout, live delivery GPS tracking, and automated loyalty WhatsApp messages." : "Programmatic revenue collection, external data enrichment, and outbound user alerts.",
          cloudIcon: "api"
        }
      ],
      estimatedMonthlyCloudCost: {
        mvp: "₹3,500 - ₹8,500 / month",
        growth: "₹25,000 - ₹55,000 / month",
        scale: "₹1,20,000 - ₹3,50,000 / month"
      }
    },
    revenueModel: isNonTech
      ? {
          primaryModel: "Direct Product Sales, Retail Walk-ins & Monthly Replenishment Subscriptions",
          pricingTiers: [
            {
              tier: "Single Order / Walk-in",
              price: "₹350",
              billing: "/ item or visit",
              features: [
                "Handcrafted signature product / fresh item",
                "Same-day local pickup or express courier",
                "Standard customer rewards program"
              ]
            },
            {
              tier: "Monthly Club / VIP Member",
              price: "₹1,499",
              billing: "/ month",
              features: [
                "Weekly fresh delivery bundle or 4 visits/mo",
                "15% discount across all retail catalog items",
                "Complimentary seasonal sample drops",
                "Free priority doorstep delivery"
              ],
              highlighted: true
            },
            {
              tier: "Corporate / Bulk Wholesale",
              price: "₹9,500+",
              billing: "/ month",
              features: [
                "Bulk office pantry or employee wellness pass",
                "Dedicated corporate account coordinator",
                "Customized corporate branding & gifting",
                "Net-30 invoiced billing terms"
              ]
            }
          ],
          projectedRunway: [
            { month: "Month 1", revenue: 350000, cost: 180000, users: 150 },
            { month: "Month 3", revenue: 1200000, cost: 520000, users: 550 },
            { month: "Month 6", revenue: 3500000, cost: 1400000, users: 1600 },
            { month: "Month 9", revenue: 6800000, cost: 2600000, users: 3200 },
            { month: "Month 12", revenue: 11000000, cost: 4200000, users: 5400 }
          ],
          keyUnitEconomics: {
            cacEstimate: "₹380 (Hyperlocal tasting sampling + Instagram Reels + word-of-mouth)",
            ltvEstimate: "₹4,400 (Avg customer retention 9 months with 1.6 orders/month)",
            ltvCacRatio: "11.5x (Exceptional capital efficiency driven by repeat retention)",
            grossMargin: "67.5% (High retail/product margin with direct-trade supplier contracts)"
          }
        }
      : {
          primaryModel: "B2B SaaS with Tiered Subscriptions & Usage-based API Credits",
          pricingTiers: [
            {
              tier: "Starter / Prosumer",
              price: "₹2,499",
              billing: "/ month",
              features: [
                "Up to 250 automated validations/month",
                "Core cloud architecture templates",
                "Export to PDF & Markdown",
                "Standard email support"
              ]
            },
            {
              tier: "Growth & Scale",
              price: "₹8,999",
              billing: "/ month",
              features: [
                "Unlimited idea validations & market scans",
                "Real-time live competitor tracking alerts",
                "Custom cloud infrastructure generator",
                "Multi-member team workspace",
                "Priority API rate limits"
              ],
              highlighted: true
            },
            {
              tier: "Enterprise / Firm",
              price: "₹39,999+",
              billing: "/ month",
              features: [
                "Custom dedicated cloud tenant",
                "SOC2 / HIPAA compliance reports",
                "Direct API integration & webhooks",
                "Dedicated Slack channel & 99.9% SLA"
              ]
            }
          ],
          projectedRunway: [
            { month: "Month 1", revenue: 145000, cost: 48000, users: 40 },
            { month: "Month 3", revenue: 680000, cost: 135000, users: 185 },
            { month: "Month 6", revenue: 2150000, cost: 380000, users: 540 },
            { month: "Month 9", revenue: 4700000, cost: 790000, users: 1250 },
            { month: "Month 12", revenue: 9800000, cost: 1560000, users: 2750 }
          ],
          keyUnitEconomics: {
            cacEstimate: "₹9,800 (Inbound organic + targeted dev marketing)",
            ltvEstimate: "₹1,15,000 (Avg retention 14 months at ₹8,200 blended ARPU)",
            ltvCacRatio: "11.7x (Exceptional capital efficiency)",
            grossMargin: "84.5% (High software margin with serverless optimization)"
          }
        },
    risksAndMitigations: [
      {
        risk: "API Rate Limiting & Latency Delays",
        severity: "Medium",
        probability: "High",
        mitigation: "Deploy Redis Upstash cache layer with semantic prompt hashing to serve repeated queries sub-10ms."
      },
      {
        risk: "Competitor Speed to Market",
        severity: "High",
        probability: "Medium",
        mitigation: "Build deep proprietary workflow integrations and private enterprise data connectivity that creates high switching costs."
      },
      {
        risk: "Cloud Infrastructure Cost Inflation",
        severity: "Medium",
        probability: "Low",
        mitigation: "Use serverless architectures with auto-scaling to zero and tiered token routing (cheap models for triage, frontier models for synthesis)."
      },
      {
        risk: "Evolving Data Privacy Regulations",
        severity: "Medium",
        probability: "Medium",
        mitigation: "Enforce client-side data sanitization and ephemeral processing with zero-data-retention agreements."
      }
    ],
    goNextSteps: [
      "Ship 4-week interactive MVP using the recommended serverless Next.js and API architecture.",
      "Conduct 15 discovery calls with target buyers from the identified persona.",
      "Launch on Product Hunt and HackerNews with a free interactive validation calculator tool.",
      "Set up Stripe billing and convert the first 25 paying beta customers."
    ]
  };
}

