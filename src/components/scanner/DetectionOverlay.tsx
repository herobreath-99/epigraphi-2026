import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";

const DetectionOverlay = () => {
  const { t } = useLanguage();

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Primary detection box */}
      <motion.div
        className="absolute border-2 border-primary/70 rounded-lg"
        style={{
          top: "25%",
          left: "15%",
          width: "45%",
          height: "35%",
          boxShadow: "0 0 20px hsl(var(--tech-cyan) / 0.3), inset 0 0 20px hsl(var(--tech-cyan) / 0.05)",
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: [0, 0.8, 1, 0.8], scale: [0.95, 1, 1, 0.98] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      >
        <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-md" />
        <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-md" />
        <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-md" />
        <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-md" />

        <motion.div className="absolute -top-7 left-0" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 2 }}>
          <div className="bg-primary/90 text-primary-foreground px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded">
            GLYPH_081
          </div>
        </motion.div>
      </motion.div>

      {/* Secondary detection (pending) */}
      <motion.div
        className="absolute border-2 border-dashed border-primary/30 rounded-lg"
        style={{ top: "40%", left: "50%", width: "35%", height: "25%" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.5, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 3 }}
      >
        <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <span className="font-mono text-[9px] text-primary/50 tracking-wider">PENDING...</span>
        </motion.div>
      </motion.div>

      {/* Bottom deciphering card */}
      <motion.div
        className="absolute bottom-32 left-4 right-4 glass-card-cyan p-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, 20] }}
        transition={{ duration: 5, repeat: Infinity, delay: 2.5 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] font-bold text-primary tracking-wider">DECIPHERING SEQUENCE</span>
          <span className="font-mono text-xs text-foreground font-bold">84% Match</span>
        </div>
        <div className="h-1 bg-secondary rounded-full mb-2">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: ["0%", "84%"] }} transition={{ duration: 2, delay: 3 }} />
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">"Possible match: Early Dynastic Inscription 4..."</p>
      </motion.div>
    </div>
  );
};

export default DetectionOverlay;
