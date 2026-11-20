import { motion } from "framer-motion";
import { Camera, ImagePlus, RotateCcw, RotateCw, Zap, Loader2, Flashlight, Archive } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";

interface BottomControlsProps {
  mode: "camera" | "upload";
  capturedImage: string | null;
  enhancing: boolean;
  analyzing: boolean;
  cameraActive: boolean;
  flashOn: boolean;
  onCapture: () => void;
  onRetake: () => void;
  onAnalyze: () => void;
  onUpload: () => void;
  onRotate: () => void;
  onToggleMode: (mode: "camera" | "upload") => void;
  onToggleFlash: () => void;
}

const BottomControls = ({ mode, capturedImage, enhancing, analyzing, cameraActive, flashOn, onCapture, onRetake, onAnalyze, onUpload, onRotate, onToggleMode, onToggleFlash }: BottomControlsProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (enhancing) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      <div className="bg-gradient-to-t from-background via-background/95 to-transparent pt-16 pb-8 px-6">
        <div className="flex items-center justify-center gap-8">
          {capturedImage ? (
            <>
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={onRetake} className="w-14 h-14 rounded-xl bg-card/80 backdrop-blur-md border border-border/40 flex items-center justify-center text-foreground hover:bg-card transition-colors">
                <RotateCcw className="w-5 h-5" />
              </motion.button>
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.05 }} onClick={onAnalyze} disabled={analyzing} className="btn-neon h-16 px-10 rounded-full flex items-center gap-2 text-sm font-display disabled:opacity-50">
                {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                {t("scanner", "analyzeInscription")}
              </motion.button>
              <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }} onClick={onRotate} className="w-14 h-14 rounded-xl bg-card/80 backdrop-blur-md border border-border/40 flex items-center justify-center text-foreground hover:bg-card transition-colors">
                <RotateCw className="w-5 h-5" />
              </motion.button>
            </>
          ) : (
            <>
              <button
                onClick={onToggleFlash}
                className={`w-14 h-14 rounded-xl backdrop-blur-md border flex flex-col items-center justify-center transition-colors gap-0.5 ${
                  flashOn
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-card/60 border-border/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Flashlight className="w-5 h-5" />
                <span className="font-mono text-[7px] tracking-wider">{flashOn ? "ON" : "FLASH"}</span>
              </button>
              {mode === "camera" ? (
                <button onClick={onCapture} disabled={!cameraActive} className="w-[76px] h-[76px] rounded-full border-[3px] border-primary/60 flex items-center justify-center p-1 disabled:opacity-30 group" style={{ boxShadow: "0 0 25px hsl(var(--tech-cyan) / 0.2)" }}>
                  <div className="w-full h-full rounded-full bg-primary/90 group-active:scale-90 transition-transform flex items-center justify-center">
                    <Camera className="w-7 h-7 text-primary-foreground" />
                  </div>
                </button>
              ) : (
                <button onClick={onUpload} className="w-[76px] h-[76px] rounded-full border-[3px] border-primary/60 flex items-center justify-center" style={{ boxShadow: "0 0 25px hsl(var(--tech-cyan) / 0.2)" }}>
                  <ImagePlus className="w-8 h-8 text-primary" />
                </button>
              )}
              <button
                onClick={() => navigate("/history")}
                className="w-14 h-14 rounded-xl bg-card/60 backdrop-blur-md border border-border/30 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors gap-0.5"
              >
                <Archive className="w-5 h-5" />
                <span className="font-mono text-[7px] tracking-wider">VAULT</span>
              </button>
            </>
          )}
        </div>

        {/* Bottom nav tabs */}
        {!capturedImage && (
          <div className="flex items-center justify-center gap-10 mt-6">
            <button onClick={() => onToggleMode("camera")} className={`font-mono text-[10px] font-bold tracking-wider transition-all ${mode === "camera" ? "text-primary" : "text-muted-foreground"}`}>
              SCANNER
            </button>
            <button onClick={() => onToggleMode("upload")} className={`font-mono text-[10px] font-bold tracking-wider transition-all ${mode === "upload" ? "text-primary" : "text-muted-foreground"}`}>
              UPLOAD
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomControls;
