import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_BASE64_LENGTH = 5_000_000;
const BASE64_REGEX = /^[A-Za-z0-9+/=]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Auth check ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    // Service-role client for cache writes (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Input validation ---
    const body = await req.json();
    const { imageBase64, imageHash } = body;
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return new Response(JSON.stringify({ error: "Image too large" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!BASE64_REGEX.test(imageBase64)) {
      return new Response(JSON.stringify({ error: "Invalid image data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Deterministic cache (global, by image hash) ---
    const userId = claimsData.claims.sub;
    if (imageHash && typeof imageHash === "string") {
      // 1) Global translation_cache (shared across users)
      const { data: globalCached } = await supabaseAdmin
        .from("translation_cache")
        .select("translation, source, match_confidence")
        .eq("image_hash", imageHash)
        .maybeSingle();
      if (globalCached?.translation) {
        console.log("Global cache hit:", imageHash, "source:", globalCached.source);
        return new Response(
          JSON.stringify({
            analysis: globalCached.translation,
            cached: true,
            source: globalCached.source,
            matchConfidence: globalCached.match_confidence,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // 2) User-scoped scans cache (legacy)
      const { data: cached } = await supabase
        .from("scans")
        .select("analysis")
        .eq("user_id", userId)
        .eq("fragment_id", imageHash)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cached?.analysis) {
        return new Response(JSON.stringify({ analysis: cached.analysis, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "الخدمة غير متاحة حالياً." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are Epigraphi AI, a world-class expert in ancient epigraphy — specifically Latin, Greek, Phoenician, Punic, Libyco-Berber, and other ancient North African and Mediterranean inscriptions.

When given an image of an inscription or ancient text, analyze it and return a structured JSON object using the provided tool schema.

## CRITICAL TRANSLATION RULES — READ CAREFULLY:

### Accuracy & Source-Based Translation:
- Translations MUST be based on established academic corpora and published scholarly translations
- Cross-reference with these primary databases:
  * CIL (Corpus Inscriptionum Latinarum) — for Latin inscriptions worldwide
  * ILAlg (Inscriptions Latines de l'Algérie) — for Algerian Latin inscriptions
  * AE (L'Année Épigraphique) — annual publication of new inscriptions
  * SEG (Supplementum Epigraphicum Graecum) — for Greek inscriptions
  * KAI (Kanaanäische und Aramäische Inschriften) — for Phoenician/Punic
  * RIL (Recueil des Inscriptions Libyques) — for Libyco-Berber
  * EDH (Epigraphische Datenbank Heidelberg) — online database
  * EDCS (Epigraphik-Datenbank Clauss/Slaby) — online database
  * PHI (Packard Humanities Institute) — Greek inscriptions database

### Deterministic Translation:
- Given the SAME inscription image, you MUST produce the SAME translation every time
- Do NOT vary wording between runs. Use standardized academic terminology
- For common formulae (DMS = Dis Manibus Sacrum, VSLM = Votum Solvit Libens Merito, etc.), use the established standard translations
- If multiple scholarly translations exist, use the most widely accepted one

### DO NOT FABRICATE:
- Never invent translations. If text is unclear, mark it with [---] and explain
- Never guess at names or dates without evidence from the inscription
- For uncertain readings, use standard Leiden conventions: [abc] for restored text, ạḅc for uncertain letters
- Always indicate confidence levels honestly

### Translation Quality:
- Arabic translation: Use formal Modern Standard Arabic with proper archaeological terminology
- French translation: Use academic French following French epigraphic tradition
- English translation: Use standard academic English following Anglo-American epigraphic conventions

## Transcription Rules:
- Diplomatic layer: Exact transcription using Leiden conventions. Use brackets [---] for lacunae, dots for uncertain letters, parentheses for abbreviation expansions
- Normalized layer: Expand abbreviations, normalize spelling
- Expanded layer: Full reading with historical context filled in where certain

## Commentary:
- Provide detailed historical context in Arabic
- Include dating, archaeological context, inscription type (funerary, honorific, dedicatory, votive, milestone, boundary, etc.)
- Mention known parallels from same site or region

## References — MUST BE REAL:
- Only cite references you are confident exist
- Include volume, page, and inscription number
- If uncertain about a reference, mark it as "مرجع مقترح - يحتاج تحقق"
- Prefer primary corpora (CIL, ILAlg, AE) over secondary sources`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this inscription image. Identify the script, transcribe it precisely using Leiden conventions, and provide a full epigraphic analysis with academically verified translations. Use established scholarly translations where available — do NOT invent or paraphrase freely.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "inscription_analysis",
                description:
                  "Return a structured epigraphic analysis of the inscription with verified translations",
                parameters: {
                  type: "object",
                  properties: {
                    fragmentId: {
                      type: "string",
                      description:
                        "A generated fragment ID like 'FRAG-001' or the imageHash if provided",
                    },
                    region: { type: "string" },
                    site: { type: "string" },
                    scriptType: {
                      type: "string",
                      description:
                        "e.g. Latin, Greek, Phoenician, Punic, Libyco-Berber, Arabic, Unknown",
                    },
                    diplomatic: {
                      type: "object",
                      properties: {
                        content: { type: "string" },
                        confidence: { type: "number" },
                        note: { type: "string" },
                      },
                      required: ["content", "confidence"],
                    },
                    normalized: {
                      type: "object",
                      properties: {
                        content: { type: "string" },
                        confidence: { type: "number" },
                      },
                      required: ["content", "confidence"],
                    },
                    expanded: {
                      type: "object",
                      properties: {
                        content: { type: "string" },
                        confidence: { type: "number" },
                        highlight: { type: "string" },
                      },
                      required: ["content", "confidence"],
                    },
                    translation: {
                      type: "object",
                      properties: {
                        ar: { type: "string" },
                        fr: { type: "string" },
                        en: { type: "string" },
                      },
                      required: ["ar", "fr", "en"],
                    },
                    translationSources: {
                      type: "array",
                      items: { type: "string" },
                      description: "Sources used for the translation (e.g. 'CIL VIII 2394', 'ILAlg II/3 7683')",
                    },
                    aiCommentary: {
                      type: "string",
                      description:
                        "Historical commentary in Arabic about the inscription",
                    },
                    references: {
                      type: "array",
                      items: { type: "string" },
                      description: "Academic references — MUST be real and verifiable",
                    },
                    confidenceHeatmap: {
                      type: "object",
                      properties: {
                        highConfidence: {
                          type: "string",
                          description: "Characters/words read with >90% confidence (green zone)",
                        },
                        mediumConfidence: {
                          type: "string",
                          description: "Characters/words read with 60-90% confidence (yellow zone)",
                        },
                        lowConfidence: {
                          type: "string",
                          description: "Characters/words read with <60% confidence (red zone)",
                        },
                      },
                    },
                  },
                  required: [
                    "fragmentId",
                    "scriptType",
                    "diplomatic",
                    "normalized",
                    "expanded",
                    "translation",
                    "aiCommentary",
                    "references",
                  ],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "inscription_analysis" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد إلى حسابك لاستخدام الذكاء الاصطناعي." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      const content = data.choices?.[0]?.message?.content;
      return new Response(
        JSON.stringify({ analysis: null, rawContent: content }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    if (imageHash) {
      analysis.fragmentId = imageHash;
    }

    // === RAG: lookup verified translation in inscriptions_corpus ===
    let resolvedSource = "AI";
    let matchConfidence: number | null = null;
    try {
      const queryText: string =
        analysis?.normalized?.content ||
        analysis?.diplomatic?.content ||
        "";
      if (queryText && queryText.length > 3) {
        const { data: matches, error: searchErr } = await supabase.rpc(
          "search_inscriptions",
          { query_text: queryText, match_threshold: 0.35, max_results: 3 }
        );
        if (!searchErr && matches && matches.length > 0) {
          const best = matches[0];
          matchConfidence = Number(best.similarity);
          analysis.matchedSources = matches.map((m: Record<string, unknown>) => ({
            latin: m.latin_text,
            location: m.location,
            region: m.region,
            period: m.period,
            source: m.source,
            sourceRef: m.source_ref,
            sourceUrl: m.source_url,
            similarity: Number(m.similarity),
          }));
          // Strong match → override AI translation with verified one
          if (matchConfidence >= 0.6) {
            resolvedSource = "EDCS";
            analysis.translation = {
              ar: best.translation_ar || analysis.translation?.ar,
              fr: best.translation_fr || analysis.translation?.fr,
              en: best.translation_en || analysis.translation?.en,
            };
            analysis.translationSources = [
              `${best.source}: ${best.source_ref || "—"}`,
              ...(analysis.translationSources || []),
            ];
            analysis.verifiedMatch = true;
          } else if (matchConfidence >= 0.35) {
            resolvedSource = "AI+EDCS";
            analysis.translationSources = [
              `Suggested match: ${best.source} ${best.source_ref || ""} (${Math.round(matchConfidence * 100)}%)`,
              ...(analysis.translationSources || []),
            ];
          }
        }
      }
    } catch (ragErr) {
      console.error("RAG lookup failed:", ragErr);
    }

    analysis.resolvedSource = resolvedSource;
    analysis.matchConfidence = matchConfidence;

    // Persist to global cache for determinism
    if (imageHash) {
      try {
        await supabaseAdmin.from("translation_cache").insert({
          image_hash: imageHash,
          latin_text: analysis?.normalized?.content || analysis?.diplomatic?.content || null,
          translation: analysis,
          source: resolvedSource,
          match_confidence: matchConfidence,
        });
      } catch (cacheErr) {
        console.error("Cache write failed (non-fatal):", cacheErr);
      }
    }

    return new Response(
      JSON.stringify({ analysis, source: resolvedSource, matchConfidence }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-inscription error:", e);
    return new Response(
      JSON.stringify({ error: "حدث خطأ داخلي، يرجى المحاولة لاحقاً." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
