import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Share2, Download, MessageSquarePlus, Sparkles, BookOpen, Copy, Check, Save, Loader2, ShieldCheck, Database, Bot, MapPin, Clock, Link2, ExternalLink } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { exportAnalysisPdf } from "@/lib/exportPdf";

interface AnalysisData {
  fragmentId?: string;
  region?: string;
  site?: string;
  scriptType?: string;
  diplomatic?: { content: string; confidence: number; note?: string };
  normalized?: { content: string; confidence: number };
  expanded?: { content: string; confidence: number; highlight?: string };
  translation?: { ar?: string; fr?: string; en?: string };
  translationSources?: string[];
  aiCommentary?: string;
  references?: string[];
  confidenceHeatmap?: {
    highConfidence?: string;
    mediumConfidence?: string;
    lowConfidence?: string;
  };
  resolvedSource?: "EDCS" | "AI" | "AI+EDCS" | string;
  matchConfidence?: number | null;
  verifiedMatch?: boolean;
  matchedSources?: Array<{
    latin: string;
    location?: string;
    region?: string;
    period?: string;
    source: string;
    sourceRef?: string;
    sourceUrl?: string;
    similarity: number;
  }>;
}

const Results = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useLanguage();
  const [activeLang, setActiveLang] = useState("AR");
  const [copiedLayer, setCopiedLayer] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const analysis: AnalysisData | null = location.state?.analysis ?? null;
  const imageUrl: string | null = location.state?.imageUrl ?? null;
  const isDemo = !analysis;

  const demoLayers = [
    { num: 1, title: "Diplomatic", titleAr: t("results", "diplomatic"), match: 98, content: "[---] L(ucius) SERGIVS [---]", note: t("results", "leidenNote") },
    { num: 2, title: "Normalized", titleAr: t("results", "normalized"), match: 96, content: "Lucius Sergius" },
    { num: 3, title: "Expanded", titleAr: t("results", "expanded"), match: 92, content: "Lucius Sergius, filius Marci, decurio coloniae Thamugadiensis.", highlight: "filius Marci" },
    { num: 4, title: "Translation", titleAr: t("results", "translation"), match: null, content: "لوسيوس سيرجيوس، ابن ماركوس، عضو مجلس مستعمرة تيمقاد.", langOptions: ["AR", "FR", "EN"] },
  ];

  const layers = isDemo ? demoLayers : [
    { num: 1, title: "Diplomatic", titleAr: t("results", "diplomatic"), match: analysis.diplomatic?.confidence ?? null, content: analysis.diplomatic?.content ?? "", note: analysis.diplomatic?.note },
    { num: 2, title: "Normalized", titleAr: t("results", "normalized"), match: analysis.normalized?.confidence ?? null, content: analysis.normalized?.content ?? "" },
    { num: 3, title: "Expanded", titleAr: t("results", "expanded"), match: analysis.expanded?.confidence ?? null, content: analysis.expanded?.content ?? "", highlight: analysis.expanded?.highlight },
    { num: 4, title: "Translation", titleAr: t("results", "translation"), match: null, content: activeLang === "AR" ? (analysis.translation?.ar ?? "") : activeLang === "FR" ? (analysis.translation?.fr ?? "") : (analysis.translation?.en ?? ""), langOptions: ["AR", "FR", "EN"] },
  ];

  const commentary = isDemo ? "يتبع هذا النقش البروتوكول الإمبراطوري المعياري لفترة حكم كركلا." : analysis.aiCommentary;
  const references = isDemo ? ["CIL VIII 2394", "ILAlg II/3 7683", "EDH HD031234"] : (analysis.references ?? []);

  const copyText = (text: string, layerNum: number) => {
    navigator.clipboard.writeText(text);
    setCopiedLayer(layerNum);
    toast.success(t("common", "copied"));
    setTimeout(() => setCopiedLayer(null), 2000);
  };

  const confidenceColor = (val: number) => {
    if (val >= 90) return "text-success";
    if (val >= 70) return "text-primary";
    return "text-destructive";
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-border/30">
        <button onClick={() => navigate(-1)} className="text-foreground p-2 rounded-lg hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-sm font-bold tracking-wider text-primary uppercase">EPIGRAPHI Dz</h1>
          <span className="font-mono text-[9px] text-muted-foreground">ANALYSIS PROTOCOL 8.4</span>
        </div>
        <div className="flex gap-1">
          <button className="text-foreground p-2 rounded-lg hover:bg-secondary transition-colors"><Share2 className="w-4 h-4" /></button>
          <button className="p-2 rounded-lg bg-primary/10 text-primary"><Save className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* Image with tags */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative rounded-xl overflow-hidden sci-fi-frame sci-fi-frame-bottom">
          <img src={imageUrl ?? "/images/inscription.jpg"} alt="Inscription" className="w-full h-52 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="text-[9px] font-mono font-bold bg-primary/20 text-primary px-2 py-1 rounded-full backdrop-blur-sm">ACTIVE SCANNING</span>
          </div>
          <div className="absolute bottom-3 left-3">
            <h2 className="font-display text-xl font-bold text-foreground">{analysis?.scriptType ?? "Ancient Script"}</h2>
          </div>
          <div className="absolute bottom-3 right-3 text-right">
            <p className="font-mono text-[9px] text-muted-foreground">Coordinate</p>
            <p className="font-mono text-xs text-foreground">34.88°N</p>
            <p className="font-mono text-xs text-foreground">35.90°E</p>
          </div>
        </motion.div>

        {/* Fragment info cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card-cyan p-4">
            <p className="font-mono text-[9px] text-primary font-bold uppercase tracking-wider mb-1">SYMBOL MEANING</p>
            <p className="text-foreground font-bold text-lg">{analysis?.fragmentId ?? "TIMGAD-042"}</p>
            <div className="h-1 bg-primary/30 rounded-full mt-2"><div className="h-full bg-primary rounded-full w-3/4" /></div>
          </div>
          <div className="glass-card-cyan p-4">
            <p className="font-mono text-[9px] text-primary font-bold uppercase tracking-wider mb-1">ORIGIN SITE</p>
            <p className="text-foreground font-bold text-lg">{analysis?.site ?? "Timgad"}</p>
            <p className="text-[10px] text-success flex items-center gap-1 mt-1">
              <Check className="w-3 h-3" /> Confidence: {analysis?.diplomatic?.confidence ?? 98}%
            </p>
          </div>
        </div>

        {/* Source / Trust badge */}
        {analysis?.resolvedSource && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card-cyan p-4 border ${
              analysis.resolvedSource === "EDCS"
                ? "border-success/40"
                : analysis.resolvedSource === "AI+EDCS"
                ? "border-primary/40"
                : "border-warning/30"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    analysis.resolvedSource === "EDCS"
                      ? "bg-success/15 text-success"
                      : analysis.resolvedSource === "AI+EDCS"
                      ? "bg-primary/15 text-primary"
                      : "bg-warning/15 text-warning"
                  }`}
                >
                  {analysis.resolvedSource === "EDCS" ? (
                    <ShieldCheck className="w-5 h-5" />
                  ) : analysis.resolvedSource === "AI+EDCS" ? (
                    <Database className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                    Translation Source
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {analysis.resolvedSource === "EDCS"
                      ? "ترجمة موثّقة (EDCS / CIL)"
                      : analysis.resolvedSource === "AI+EDCS"
                      ? "تطابق مقترح + ذكاء اصطناعي"
                      : "ذكاء اصطناعي فقط"}
                  </p>
                </div>
              </div>
              {analysis.matchConfidence != null && (
                <div className="text-right">
                  <p className="font-mono text-[9px] text-muted-foreground">Match</p>
                  <p
                    className={`font-mono text-lg font-bold ${
                      analysis.matchConfidence >= 0.6
                        ? "text-success"
                        : analysis.matchConfidence >= 0.35
                        ? "text-primary"
                        : "text-warning"
                    }`}
                  >
                    {Math.round(analysis.matchConfidence * 100)}%
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Layers */}
        {layers.map((layer, idx) => (
          <motion.div key={layer.num} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className="glass-card-cyan p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{String(layer.num).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{layer.title}</h3>
                  <p className="text-[10px] text-muted-foreground font-arabic">{layer.titleAr}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {layer.match != null && <span className={`text-xs font-bold font-mono ${confidenceColor(layer.match)}`}>{layer.match}%</span>}
                {layer.langOptions && (
                  <div className="flex gap-1">
                    {layer.langOptions.map((lang: string) => (
                      <button key={lang} onClick={() => setActiveLang(lang)} className={`text-[10px] font-bold font-mono px-2 py-1 rounded transition-colors ${activeLang === lang ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>{lang}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="relative bg-secondary/40 rounded-lg p-4 group border border-border/30" dir={layer.num === 4 ? "rtl" : "ltr"}>
              <p className={`text-foreground text-sm leading-relaxed ${layer.num === 1 ? "font-mono" : ""}`}>
                {layer.highlight ? (<>{layer.content.split(layer.highlight)[0]}<span className="text-primary font-semibold">{layer.highlight}</span>{layer.content.split(layer.highlight)[1]}</>) : layer.content}
              </p>
              <button onClick={() => copyText(layer.content, layer.num)} className="absolute top-2 right-2 p-1.5 rounded-md bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity">
                {copiedLayer === layer.num ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
              </button>
            </div>
            {layer.note && <p className="mt-2 text-[10px] text-muted-foreground italic">{layer.note}</p>}
          </motion.div>
        ))}

        {/* AI Commentary */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card-cyan p-4 border-primary/15">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Sparkles className="w-4 h-4 text-primary" /></div>
            <div>
              <h3 className="text-sm font-bold text-foreground">{t("results", "aiCommentary")}</h3>
              <p className="font-mono text-[9px] text-muted-foreground">HISTORICAL CONTEXT</p>
            </div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-4 border border-border/30" dir="rtl">
            <p className="text-foreground text-sm leading-relaxed font-arabic">{commentary}</p>
          </div>
          {references.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 mb-3"><BookOpen className="w-4 h-4 text-primary" /><h4 className="font-mono text-[10px] font-bold text-foreground tracking-wider uppercase">{t("results", "academicReferences")}</h4></div>
              <div className="space-y-2">
                {references.map((ref, i) => {
                  const isVerified = !ref.includes("يحتاج تحقق");
                  return (
                    <div key={i} className="flex items-start gap-2 bg-secondary/30 rounded-lg p-2.5 border border-border/20">
                      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full mt-0.5 shrink-0 ${isVerified ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{isVerified ? t("results", "verified") : t("results", "suggested")}</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-mono">{ref}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Confidence Heatmap */}
          {analysis?.confidenceHeatmap && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <h4 className="font-mono text-[10px] font-bold text-foreground tracking-wider uppercase mb-3">خريطة الثقة في القراءة</h4>
              <div className="space-y-2">
                {analysis.confidenceHeatmap.highConfidence && (
                  <div className="flex items-start gap-2 bg-success/5 rounded-lg p-2.5 border border-success/20">
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-success/15 text-success shrink-0">مؤكد</span>
                    <p className="text-[11px] text-foreground font-mono leading-relaxed">{analysis.confidenceHeatmap.highConfidence}</p>
                  </div>
                )}
                {analysis.confidenceHeatmap.mediumConfidence && (
                  <div className="flex items-start gap-2 bg-warning/5 rounded-lg p-2.5 border border-warning/20">
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-warning/15 text-warning shrink-0">محتمل</span>
                    <p className="text-[11px] text-foreground font-mono leading-relaxed">{analysis.confidenceHeatmap.mediumConfidence}</p>
                  </div>
                )}
                {analysis.confidenceHeatmap.lowConfidence && (
                  <div className="flex items-start gap-2 bg-destructive/5 rounded-lg p-2.5 border border-destructive/20">
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-destructive/15 text-destructive shrink-0">ضعيف</span>
                    <p className="text-[11px] text-foreground font-mono leading-relaxed">{analysis.confidenceHeatmap.lowConfidence}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Translation Sources */}
          {analysis?.translationSources && analysis.translationSources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <h4 className="font-mono text-[10px] font-bold text-primary tracking-wider uppercase mb-2">مصادر الترجمة</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.translationSources.map((src, i) => (
                  <span key={i} className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-1 rounded-full">{src}</span>
                ))}
              </div>
            </div>
          )}

          {/* Matched corpus inscriptions */}
          {analysis?.matchedSources && analysis.matchedSources.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-primary" />
                <h4 className="font-mono text-[10px] font-bold text-foreground tracking-wider uppercase">
                  Matched Inscriptions (EDCS Corpus)
                </h4>
                <span className="ml-auto text-[9px] font-mono text-muted-foreground">
                  {analysis.matchedSources.length} {analysis.matchedSources.length === 1 ? "match" : "matches"}
                </span>
              </div>
              <div className="divide-y divide-border/30 rounded-lg overflow-hidden border border-border/30 bg-secondary/20">
                {[...analysis.matchedSources]
                  .sort((a, b) => b.similarity - a.similarity)
                  .map((m, i) => {
                    const pct = Math.round(m.similarity * 100);
                    const toneClass =
                      pct >= 60
                        ? "bg-success/15 text-success"
                        : pct >= 35
                        ? "bg-primary/15 text-primary"
                        : "bg-warning/15 text-warning";
                    return (
                      <div key={i} className="p-3 hover:bg-secondary/40 transition-colors">
                        {/* Header row: rank + similarity */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded shrink-0">
                            #{String(i + 1).padStart(2, "0")}
                          </span>
                          {m.sourceRef && (
                            <span className="font-mono text-[10px] text-foreground/80 truncate">
                              {m.source} · {m.sourceRef}
                            </span>
                          )}
                          <span
                            className={`ml-auto text-[9px] font-bold font-mono px-2 py-0.5 rounded-full shrink-0 ${toneClass}`}
                          >
                            {pct}%
                          </span>
                        </div>

                        {/* Latin text */}
                        <p className="font-mono text-[11px] text-foreground leading-relaxed mb-2 break-words">
                          {m.latin}
                        </p>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground font-mono">
                          {m.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {m.location}
                            </span>
                          )}
                          {m.period && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {m.period}
                            </span>
                          )}
                        </div>

                        {/* Source link with copy */}
                        {m.sourceUrl && (
                          <div className="mt-2 flex items-center gap-2 bg-background/50 border border-border/30 rounded-md px-2 py-1.5">
                            <Link2 className="w-3 h-3 text-primary shrink-0" />
                            <a
                              href={m.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-primary truncate flex-1 hover:underline"
                              dir="ltr"
                            >
                              {m.sourceUrl}
                            </a>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                navigator.clipboard.writeText(m.sourceUrl!);
                                toast.success(t("common", "copied"));
                              }}
                              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-primary transition-colors shrink-0"
                              aria-label="Copy link"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={m.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-primary transition-colors shrink-0"
                              aria-label="Open link"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            disabled={exporting}
            onClick={async () => {
              if (!analysis && !isDemo) return;
              setExporting(true);
              try {
                const data = analysis ?? {
                  fragmentId: "TIMGAD-042", site: "Timgad", scriptType: "Latin",
                  diplomatic: { content: "[---] L(ucius) SERGIVS [---]", confidence: 98 },
                  normalized: { content: "Lucius Sergius", confidence: 96 },
                  expanded: { content: "Lucius Sergius, filius Marci, decurio coloniae Thamugadiensis.", confidence: 92 },
                  translation: { ar: "لوسيوس سيرجيوس، ابن ماركوس، عضو مجلس مستعمرة تيمقاد." },
                  references: ["CIL VIII 2394", "ILAlg II/3 7683"],
                };
                await exportAnalysisPdf(data, imageUrl);
                toast.success(t("results", "exportReport"));
              } catch { toast.error("Export failed"); }
              finally { setExporting(false); }
            }}
            className="btn-neon w-full h-14 flex items-center justify-center gap-3 font-display tracking-wider"
          >
            {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}{t("results", "exportReport")}
          </button>
          <button onClick={() => navigate("/research", { state: { analysis, imageUrl } })} className="flex items-center justify-center h-14 w-full glass-card-cyan text-foreground font-bold transition-all hover:border-primary/30">
            <MessageSquarePlus className="w-5 h-5 mr-3 text-primary" /><span>{t("results", "openInResearch")}</span>
          </button>
        </div>
      </div>

      <BottomNav active="analyze" />
    </div>
  );
};

export default Results;
