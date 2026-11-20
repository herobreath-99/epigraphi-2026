import { useLanguage } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Language } from "@/i18n/translations";

const langs: { code: Language; label: string }[] = [
  { code: "ar", label: "العربية" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
];

const LanguageSwitcher = () => {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-md border border-border/30 text-foreground hover:bg-card/80 transition-colors text-xs font-bold"
      >
        <Globe className="w-3.5 h-3.5" />
        {langs.find((l) => l.code === lang)?.label}
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl overflow-hidden shadow-lg z-50 min-w-[120px]">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full px-4 py-2.5 text-xs text-left hover:bg-secondary transition-colors ${
                lang === l.code ? "text-gold font-bold" : "text-foreground"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
