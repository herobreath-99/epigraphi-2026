import { motion } from "framer-motion";

const ScanningFrame = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 p-8">
      <div className="relative w-full max-w-sm aspect-[3/4]">
        {/* Corner brackets - cyan */}
        <div className="absolute -top-1 -left-1 w-12 h-12 border-t-2 border-l-2 border-primary rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-12 h-12 border-t-2 border-r-2 border-primary rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-2 border-l-2 border-primary rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-2 border-r-2 border-primary rounded-br-lg" />

        {/* Scanning line */}
        <motion.div
          className="absolute left-2 right-2 h-[2px] rounded-full"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(var(--tech-cyan)), hsl(180, 80%, 70%), hsl(var(--tech-cyan)), transparent)",
            boxShadow: "0 0 15px hsl(var(--tech-cyan) / 0.5), 0 0 40px hsl(var(--tech-cyan) / 0.2)",
          }}
          animate={{ top: ["12%", "85%", "12%"] }}
          transition={{ duration: 3.5, ease: "easeInOut", repeat: Infinity }}
        />

        {/* Center crosshair */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-8 h-8 relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/30" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/30" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-primary/50" />
          </div>
        </div>

        {/* Guidance text */}
        <motion.div
          className="absolute -bottom-10 left-0 right-0 text-center"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <p className="font-mono text-[10px] text-primary bg-background/50 backdrop-blur-sm inline-block px-3 py-1 rounded-full tracking-wider">
            ALIGN INSCRIPTION IN FRAME
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ScanningFrame;
