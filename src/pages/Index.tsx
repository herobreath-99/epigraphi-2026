import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import heroBackground from "@/assets/hero-background.png";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("ESTABLISHING SECURE CONNECTION...");

  useEffect(() => {
    // Always show splash on site open
    localStorage.removeItem("epigraphi-splash-seen");

    const steps = [
      { at: 20, text: "CONNECTING TO HERITAGE DATABASE..." },
      { at: 45, text: "LOADING ARCHAEOLOGICAL MAPS..." },
      { at: 65, text: "INITIALIZING LANGUAGE MODEL..." },
      { at: 85, text: "CALIBRATING AI ENGINE..." },
      { at: 100, text: "SYSTEM READY" },
    ];

    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 1, 100);
        const step = steps.find((s) => s.at === next);
        if (step) setStatusText(step.text);
        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleStart = () => {
    localStorage.setItem("epigraphi-splash-seen", "true");
    const onboarded = localStorage.getItem("epigraphi-onboarded");
    navigate(onboarded ? "/login" : "/onboarding", { replace: true });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-background">
      {/* Hero background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
        aria-hidden="true"
      />
      {/* Dark gradient overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background/90" aria-hidden="true" />

      {/* Warm ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.04] blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] rounded-full bg-primary/[0.03] blur-[100px]" />
      </div>

      {/* Corner brackets */}
      <div className="absolute inset-6 sci-fi-frame sci-fi-frame-bottom pointer-events-none z-10" />

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative z-20 flex items-center justify-between px-8 pt-10"
      >
        <div>
          <p className="font-mono text-[10px] font-bold text-primary tracking-widest">ARCHIVE ACCESS</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-[9px] text-muted-foreground tracking-wider">SECURE • 256-BIT</span>
          </div>
        </div>
        <LanguageSwitcher />
      </motion.div>

      {/* Central content */}
      <div className="relative z-20 flex flex-1 flex-col items-center justify-center px-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10"
        >
          <div
            className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden shadow-lg"
            style={{
              boxShadow: '0 8px 40px hsl(43 88% 63% / 0.18)',
              aspectRatio: '1 / 1',
            }}
          >
            <picture>
              <source
                type="image/webp"
                srcSet="/images/logo-256.webp 1x, /images/logo-384.webp 2x, /images/logo-512.webp 3x"
                sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
              />
              <img
                src="/images/logo-256.webp"
                alt="Epigraphi Dz"
                width={256}
                height={256}
                loading="eager"
                {...({ fetchpriority: "high" } as Record<string, string>)}
                decoding="async"
                className="w-full h-full object-contain"
                style={{ aspectRatio: '1 / 1' }}
              />
            </picture>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="font-display text-5xl md:text-6xl font-bold tracking-[0.12em] text-foreground mb-2"
        >
          EPIGRAPHI
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="font-display text-xl text-primary tracking-[0.3em] font-semibold mb-4"
        >
          DZ
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-muted-foreground text-sm tracking-wider font-arabic"
        >
          {t("landing", "heroAr")}
        </motion.p>
      </div>

      {/* Bottom section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="relative z-20 px-8 pb-10 space-y-5"
      >
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider">{statusText}</p>
            <p className="font-mono text-xs font-bold text-primary">{progress}%</p>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'hsl(40 8% 15%)' }}>
            <motion.div
              className="h-full rounded-full gold-gradient"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
        </div>

        {/* CTA Button */}
        <AnimatePresence>
          {progress >= 100 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={handleStart}
              className="btn-neon w-full h-14 flex items-center justify-center gap-3 text-base font-display"
            >
              {t("landing", "startExploring")}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="font-mono text-[9px] text-center text-muted-foreground/40 tracking-wider">
          ENTERPRISE AI CORE • SYSTEM V2.4.0 • HERITAGE GRADE
        </p>
      </motion.div>
    </div>
  );
};

export default Index;
