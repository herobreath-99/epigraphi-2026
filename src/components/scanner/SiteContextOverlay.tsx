import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronUp, ChevronDown, Navigation, Compass, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Site, Landmark } from "@/data/sites";

interface SiteContextOverlayProps {
  site: Site;
  distance: number;
  nearestLandmark: Landmark | null;
  landmarkDistance: number | null;
  onDismiss: () => void;
}

const SiteContextOverlay = ({ site, distance, nearestLandmark, landmarkDistance, onDismiss }: SiteContextOverlayProps) => {
  const { lang, t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const siteName = lang === "ar" ? site.name : site.nameEn;
  const siteDesc = lang === "fr" ? site.descFr : lang === "en" ? site.descEn : site.desc;

  const getLmName = (lm: Landmark) => lang === "fr" ? lm.nameFr : lang === "en" ? lm.nameEn : lm.nameAr;
  const getLmDesc = (lm: Landmark) => lang === "fr" ? lm.descFr : lang === "en" ? lm.descEn : lm.descAr;

  return (
    <div className="absolute top-16 left-3 right-3 z-30" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Site banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-cyan rounded-xl overflow-hidden shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {t("scanner", "fieldGuide")}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground truncate font-display">{siteName}</h3>
            <p className="text-[10px] text-muted-foreground truncate">{siteDesc}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button onClick={onDismiss} className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Type badge */}
        <div className="px-3 pb-2 flex gap-2">
          <span className="text-[9px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-bold">{site.type}</span>
          <span className="text-[9px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full font-bold">{site.count}+ {t("common", "inscription")}</span>
        </div>

        {/* Expanded: Landmarks list */}
        <AnimatePresence>
          {expanded && site.landmarks.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border/30 overflow-hidden"
            >
              <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  {t("scanner", "landmarks")} ({site.landmarks.length})
                </p>
                {site.landmarks.map((lm) => (
                  <div key={lm.id} className="bg-secondary/40 rounded-lg p-2.5 flex gap-2.5">
                    <span className="text-lg shrink-0">{lm.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{getLmName(lm)}</p>
                      {lm.era && <p className="text-[9px] text-primary font-bold">{lm.era}</p>}
                      <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{getLmDesc(lm)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Nearest landmark indicator */}
      <AnimatePresence>
        {nearestLandmark && !expanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-2 glass-card-cyan rounded-xl p-3 flex items-center gap-3 shadow-md"
          >
            <span className="text-xl">{nearestLandmark.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-primary" />
                <span className="text-[10px] text-primary font-bold uppercase">
                  {t("scanner", "nearestLandmark")}
                </span>
              </div>
              <p className="text-xs font-bold text-foreground truncate">{getLmName(nearestLandmark)}</p>
              {nearestLandmark.era && <p className="text-[9px] text-muted-foreground">{nearestLandmark.era}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-primary">
                {landmarkDistance != null && landmarkDistance < 1000 ? `${landmarkDistance}m` : landmarkDistance != null ? `${(landmarkDistance / 1000).toFixed(1)}km` : "—"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SiteContextOverlay;
