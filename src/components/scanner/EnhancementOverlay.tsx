import { motion } from "framer-motion";
import { Sparkles, Check, Loader2, BrainCircuit } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { enhancementSteps } from "@/lib/imageEnhancer";
import { useLanguage } from "@/i18n/LanguageContext";

interface EnhancementOverlayProps {
  enhanceStep: number;
  enhanceLabel: string;
  enhanceProgress: number;
  aiEnhancing: boolean;
}

const EnhancementOverlay = ({ enhanceStep, enhanceLabel, enhanceProgress, aiEnhancing }: EnhancementOverlayProps) => {
  const { t } = useLanguage();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/85 backdrop-blur-lg flex flex-col items-center justify-center gap-6 z-30 px-8">
      <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center shadow-lg" style={{ boxShadow: "0 0 40px hsl(var(--gold) / 0.3)" }}>
        <Sparkles className="w-10 h-10 text-primary-foreground" />
      </motion.div>

      <div className="text-center space-y-1">
        <h3 className="font-display text-lg font-bold text-foreground">{t("scanner", "imageEnhancement")}</h3>
        <p className="text-xs text-muted-foreground font-arabic">{t("scanner", "enhancingForBetter")}</p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <Progress value={enhanceProgress} className="h-2 bg-muted" />
        <div className="flex justify-between text-xs text-muted-foreground font-arabic">
          <span>{enhanceLabel}</span>
          <span className="text-primary font-bold">{enhanceProgress}%</span>
        </div>
      </div>

      <div className="w-full max-w-xs glass-card-gold p-4 space-y-2">
        {enhancementSteps.map((s, i) => (
          <div key={s.name} className={`flex items-center gap-3 text-xs font-arabic transition-colors ${i < enhanceStep ? "text-primary" : i === enhanceStep ? "text-foreground" : "text-muted-foreground/40"}`}>
            {i < enhanceStep ? <Check className="w-3.5 h-3.5 shrink-0" /> : i === enhanceStep ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/20 shrink-0" />}
            <span>{s.label}</span>
          </div>
        ))}
        <div className={`flex items-center gap-3 text-xs font-arabic transition-colors ${aiEnhancing ? "text-foreground" : enhanceStep >= enhancementSteps.length && !aiEnhancing ? "text-primary" : "text-muted-foreground/40"}`}>
          {aiEnhancing ? <BrainCircuit className="w-3.5 h-3.5 animate-pulse shrink-0 text-primary" /> : enhanceStep >= enhancementSteps.length ? <Check className="w-3.5 h-3.5 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/20 shrink-0" />}
          <span>{t("scanner", "aiEnhancement")}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancementOverlay;
