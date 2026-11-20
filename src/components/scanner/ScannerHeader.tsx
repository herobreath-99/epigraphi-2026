import { X, Camera, ImagePlus, Settings } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface ScannerHeaderProps {
  mode: "camera" | "upload";
  onToggleMode: () => void;
  onClose: () => void;
  status: "idle" | "enhancing" | "analyzing";
}

const ScannerHeader = ({ mode, onToggleMode, onClose, status }: ScannerHeaderProps) => {
  const { t } = useLanguage();

  const statusText = {
    idle: "AI RECOGNITION: ACTIVE",
    enhancing: "ENHANCING IMAGE...",
    analyzing: "NEURAL ANALYSIS...",
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-background/95 via-background/70 to-transparent pb-8 pt-12 px-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden animate-fade-in">
            <picture>
              <source
                type="image/webp"
                srcSet="/images/logo-128.webp 1x, /images/logo-256.webp 2x, /images/logo-384.webp 3x"
              />
              <img
                src="/images/logo-128.webp"
                alt="Epigraphi Dz logo"
                width={24}
                height={24}
                loading="eager"
                decoding="async"
                className="w-6 h-6 rounded-sm object-contain"
                style={{ aspectRatio: "1 / 1" }}
              />
            </picture>
          </div>
          <div>
            <h1 className="font-display text-sm font-bold tracking-wider text-primary">EPIGRAPHI Dz</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="font-mono text-[9px] text-muted-foreground tracking-wider">{statusText[status]}</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-card/60 backdrop-blur-md border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ScannerHeader;
