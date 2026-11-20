import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, BrainCircuit } from "lucide-react";

interface ComparisonSliderProps {
  originalUrl: string;
  enhancedUrl: string;
}

const ComparisonSlider = ({ originalUrl, enhancedUrl }: ComparisonSliderProps) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current || !isDragging.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handlePointerDown = () => { isDragging.current = true; };
  const handlePointerUp = () => { isDragging.current = false; };
  const handlePointerMove = (e: React.PointerEvent) => handleMove(e.clientX);

  return (
    <div className="absolute inset-0 z-10">
      <div
        ref={containerRef}
        className="relative w-full h-full select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerMove={handlePointerMove}
      >
        {/* Enhanced (full) */}
        <img src={enhancedUrl} alt="Enhanced" className="absolute inset-0 w-full h-full object-contain bg-background" />

        {/* Original (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
        >
          <img src={originalUrl} alt="Original" className="absolute inset-0 w-full h-full object-contain bg-background" />
        </div>

        {/* Slider line */}
        <div
          className="absolute top-0 bottom-0 w-[2px] z-20"
          style={{ left: `${sliderPos}%`, transform: "translateX(-50%)" }}
        >
          <div className="w-full h-full bg-primary shadow-lg" style={{ boxShadow: "0 0 10px hsl(var(--gold) / 0.5)" }} />
          {/* Handle */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 backdrop-blur-md border-2 border-primary flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg"
            style={{ boxShadow: "0 0 20px hsl(var(--gold) / 0.3)" }}
          >
            <div className="flex items-center gap-0.5">
              <div className="w-[2px] h-4 bg-primary/60 rounded-full" />
              <div className="w-[2px] h-4 bg-primary/60 rounded-full" />
            </div>
          </div>
        </div>

        {/* Labels */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 z-20"
        >
          <div className="glass-card px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <EyeOff className="w-3 h-3" />
            الأصلية
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="absolute top-4 right-4 z-20"
        >
          <div className="glass-card-gold px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
            <BrainCircuit className="w-3 h-3" />
            محسّنة AI
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ComparisonSlider;
