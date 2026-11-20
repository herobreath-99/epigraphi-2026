import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, BrainCircuit, Search, BookOpen, StopCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const AnalyzingOverlay = () => {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 1, 95));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { label: "Scanning stone surface...", done: progress > 30 },
    { label: "Analyzing symbols & patterns...", done: progress > 60 },
    { label: "Decoding semantic language...", done: progress > 90 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/90 backdrop-blur-lg flex flex-col items-center justify-center z-30">
      {/* Corner brackets */}
      <div className="absolute inset-8 sci-fi-frame sci-fi-frame-bottom pointer-events-none" />

      {/* Binary data effect */}
      <div className="absolute top-20 left-4 right-4 flex gap-4 overflow-hidden opacity-20">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="font-mono text-[8px] text-primary/60 leading-tight">
            {Array(6).fill(0).map((_, j) => (
              <div key={j}>{Math.random().toString(16).slice(2, 10).toUpperCase()}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Circular progress */}
      <div className="relative w-40 h-40 mb-8">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--border))" strokeWidth="3" strokeDasharray="4 4" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--tech-cyan))" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${progress * 3.27} ${327 - progress * 3.27}`}
            style={{ filter: "drop-shadow(0 0 6px hsl(var(--tech-cyan) / 0.5))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold text-foreground">{progress}%</span>
          <span className="font-mono text-[10px] text-primary tracking-wider">PROCESSING</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display text-lg font-bold text-primary tracking-wider mb-2">AI NEURAL ANALYSIS</h3>
      <p className="text-sm text-muted-foreground mb-8">{t("scanner", "aiReading")}</p>

      {/* Steps */}
      <div className="glass-card-cyan p-4 mx-8 space-y-3 w-full max-w-sm">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            {s.done ? (
              <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-success" />
              </div>
            ) : progress > i * 30 ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <div className="w-5 h-5 rounded-full border border-border" />
            )}
            <span className={`font-mono text-xs ${s.done ? "text-success" : progress > i * 30 ? "text-primary" : "text-muted-foreground/50"}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Bottom status */}
      <div className="absolute bottom-20 left-6 right-6 flex items-center justify-between">
        <span className="font-mono text-[9px] text-primary tracking-wider">SENSORS: ACTIVE</span>
        <span className="font-mono text-[9px] text-primary tracking-wider">ENCRYPTION: AES-256</span>
      </div>
    </motion.div>
  );
};

export default AnalyzingOverlay;
