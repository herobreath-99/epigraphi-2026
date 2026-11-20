import { useNavigate } from "react-router-dom";
import { Home, Map, Camera, BookOpen, User } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface BottomNavProps {
  active: "home" | "analyze" | "scan" | "map" | "history" | "settings";
}

const navItems = [
  { id: "home" as const, icon: Home, labelKey: "home", path: "/dashboard" },
  { id: "scan" as const, icon: Camera, labelKey: "scan", path: "/scanner" },
  { id: "map" as const, icon: Map, labelKey: "map", path: "/map" },
  { id: "history" as const, icon: BookOpen, labelKey: "history", path: "/history" },
  { id: "settings" as const, icon: User, labelKey: "settings", path: "/settings" },
];

const BottomNav = ({ active }: BottomNavProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-0 left-0 right-0 flex border-t border-border/30 bg-background/95 backdrop-blur-xl px-2 pb-6 pt-2 z-50">
      {navItems.map((item) => {
        const isActive = active === item.id || (active === "analyze" && item.id === "history");
        const isScan = item.id === "scan";

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-all ${
              isScan ? "" : isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isScan ? (
              <div className="flex items-center justify-center -mt-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <Camera className="w-6 h-6" />
              </div>
            ) : (
              <div className="flex h-8 items-center justify-center">
                <item.icon className="w-5 h-5" />
              </div>
            )}
            <span className={`text-[10px] font-bold uppercase tracking-tighter font-mono ${isActive ? "text-primary" : ""}`}>
              {t("nav", item.labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
