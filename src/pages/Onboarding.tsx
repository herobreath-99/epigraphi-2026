import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const slides = [
  {
    image: "/images/onboarding-1.png",
    titleKey: "onboardingScan",
    titleAccentKey: "onboardingScanAccent",
    subtitleKey: "onboardingScanSub",
    descKey: "onboardingScanDesc",
    ctaKey: "beginExtraction",
  },
  {
    image: "/images/onboarding-2.png",
    titleKey: "onboardingMap",
    titleAccentKey: "onboardingMapAccent",
    subtitleKey: "onboardingMapSub",
    descKey: "onboardingMapDesc",
    ctaKey: "next",
  },
  {
    image: "/images/onboarding-3.png",
    titleKey: "onboardingResearch",
    titleAccentKey: "onboardingResearchAccent",
    subtitleKey: "onboardingResearchSub",
    descKey: "onboardingResearchDesc",
    ctaKey: "enterVault",
  },
];

const imageVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 300 : -300,
    scale: 0.85,
    opacity: 0,
  }),
  center: {
    x: 0,
    scale: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -200 : 200,
    scale: 0.9,
    opacity: 0,
    transition: { duration: 0.4, ease: "easeIn" as const },
  }),
};

const textVariants = {
  enter: (dir: number) => ({
    y: 40,
    opacity: 0,
    x: dir > 0 ? 60 : -60,
  }),
  center: {
    y: 0,
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: (dir: number) => ({
    y: -20,
    opacity: 0,
    x: dir > 0 ? -40 : 40,
    transition: { duration: 0.3 },
  }),
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [[page, direction], setPage] = useState([0, 0]);

  const paginate = useCallback(
    (newDir: number) => {
      const next = current + newDir;
      if (next < 0 || next >= slides.length) return;
      setPage([page + newDir, newDir]);
      setCurrent(next);
    },
    [current, page]
  );

  const finish = () => {
    localStorage.setItem("epigraphi-onboarded", "true");
    navigate("/login", { replace: true });
  };

  const next = () => {
    if (current < slides.length - 1) {
      paginate(1);
    } else {
      finish();
    }
  };

  const prev = () => paginate(-1);

  const slide = slides[current];

  return (
    <div className="relative flex min-h-screen flex-col bg-background overflow-hidden">
      {/* Parallax ambient glow that shifts with slides */}
      <motion.div
        animate={{ x: current * -80, scale: 1 + current * 0.1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-primary/[0.06] blur-[100px] pointer-events-none"
      />

      {/* Skip */}
      <div className="relative z-20 flex items-center justify-end px-6 pt-10">
        <button
          onClick={finish}
          className="font-mono text-xs font-bold text-muted-foreground tracking-[0.2em] hover:text-primary transition-colors"
        >
          SKIP
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col px-6 pt-4">
        {/* Image card with parallax */}
        <div className="relative rounded-2xl overflow-hidden mb-8" style={{ boxShadow: "0 8px 50px hsl(43 88% 63% / 0.08)" }}>
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={`img-${current}`}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative"
            >
              <motion.img
                src={slide.image}
                alt=""
                className="w-full aspect-[3/4] object-cover object-top"
                // Parallax: image moves slower than container
                animate={{ scale: 1.08 }}
                transition={{ duration: 8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              />
            </motion.div>
          </AnimatePresence>
          {/* Gold border glow */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px hsl(43 88% 63% / 0.15)" }} />
          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </div>

        {/* Dots */}
        <div className="flex items-center gap-2 mb-6">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === current ? 32 : 8,
                backgroundColor: i === current ? "hsl(43 88% 63%)" : "hsl(43 88% 63% / 0.2)",
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-1 rounded-full"
            />
          ))}
        </div>

        {/* Text with parallax offset */}
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={`text-${current}`}
            custom={direction}
            variants={textVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight mb-2">
              {t("onboarding", slide.titleKey)}{" "}
              <span className="text-primary italic">{t("onboarding", slide.titleAccentKey)}</span>
            </h2>
            <p className="font-mono text-xs text-muted-foreground tracking-[0.15em] uppercase mb-4">
              {t("onboarding", slide.subtitleKey)}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("onboarding", slide.descKey)}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="relative z-20 px-6 pb-10 pt-4 space-y-4">
        <div className="flex items-center gap-4">
          <motion.button
            onClick={next}
            whileTap={{ scale: 0.97 }}
            className="btn-neon flex-1 h-14 flex items-center justify-center gap-3 text-sm font-display"
          >
            {t("onboarding", slide.ctaKey)}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="flex items-center justify-between">
          {current > 0 ? (
            <button onClick={prev} className="font-mono text-xs text-muted-foreground tracking-[0.15em] hover:text-foreground transition-colors">
              BACK
            </button>
          ) : (
            <button onClick={finish} className="font-mono text-xs text-muted-foreground tracking-[0.15em] hover:text-foreground transition-colors">
              SKIP TO ARCHIVE
            </button>
          )}
          <span className="font-mono text-[10px] text-muted-foreground/40 tracking-wider">
            PHASE {String(current + 1).padStart(2, "0")}/{String(slides.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
