import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Upload, Clock, MapPin, TrendingUp, BookOpen, Loader2, Sparkles, Search, Bell, Image, Library } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { sites } from "@/data/sites";

interface Scan {
  id: string;
  title: string | null;
  script_type: string | null;
  confidence: number | null;
  created_at: string;
  image_url: string | null;
  analysis: { fragmentId?: string; site?: string; region?: string; [key: string]: unknown } | null;
  site: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, dir, lang } = useLanguage();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchScans = async () => {
      const { data } = await supabase.from("scans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10);
      setScans((data as Scan[]) ?? []);
      setLoading(false);
    };
    fetchScans();
  }, [user]);

  const formatDate = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return t("dashboard", "minutesAgo").replace("{n}", String(mins));
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t("dashboard", "hoursAgo").replace("{n}", String(hours));
    const days = Math.floor(hours / 24);
    return t("dashboard", "daysAgo").replace("{n}", String(days));
  };

  const stats = [
    { label: t("dashboard", "scannedInscriptions"), value: scans.length, color: "text-primary" },
    { label: t("dashboard", "sites"), value: new Set(scans.map(s => s.analysis?.region).filter(Boolean)).size, color: "text-accent" },
    {
      label: t("dashboard", "avgAccuracy"),
      value: scans.length > 0 ? `${Math.round(scans.reduce((a, s) => a + (s.confidence ?? 0), 0) / scans.length)}%` : "0%",
      color: "text-primary",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-primary/20">
            <img src="/images/logo.png" alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-wider text-foreground">EPIGRAPHI Dz</h1>
          </div>
        </div>
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-6 mb-5">
        <div className="glass-card-cyan flex items-center gap-3 px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder={t("common", "search") + "..."} className="bg-transparent text-foreground text-sm flex-1 outline-none placeholder:text-muted-foreground/50 font-mono" readOnly />
          <Camera className="w-4 h-4 text-primary" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mb-6">
        <p className="font-mono text-[10px] font-bold text-primary tracking-wider uppercase mb-3">QUICK ACTIONS</p>

        {/* Main scan card */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/scanner")}
          className="w-full relative rounded-2xl overflow-hidden mb-3 h-40"
        >
          <img src="/images/inscription.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-4 left-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="text-left">
              <p className="text-foreground font-bold text-sm">{t("dashboard", "scanInscription")}</p>
              <p className="text-primary text-xs font-mono">Real-time AI translation</p>
            </div>
          </div>
        </motion.button>

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            onClick={() => navigate("/scanner", { state: { mode: "upload" } })}
            className="glass-card-cyan p-4 flex flex-col items-center gap-2 transition-all active:scale-95"
          >
            <Image className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">{t("dashboard", "uploadImage")}</span>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate("/research")}
            className="glass-card-cyan p-4 flex flex-col items-center gap-2 transition-all active:scale-95"
          >
            <Library className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">{t("dashboard", "advancedResearch")}</span>
          </motion.button>
        </div>
      </div>

      {/* Latest Discoveries */}
      <div className="px-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-bold text-foreground tracking-wider">{t("dashboard", "recentDiscoveries")}</h2>
          {scans.length > 0 && (
            <button onClick={() => navigate("/history")} className="text-primary text-xs font-bold font-mono">{t("common", "viewAll")}</button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : scans.length === 0 ? (
          <div className="glass-card-cyan text-center py-10">
            <Sparkles className="w-10 h-10 text-primary/30 mx-auto mb-3" />
            <p className="text-foreground font-bold mb-1 font-arabic text-sm">{t("dashboard", "noInscriptionsYet")}</p>
            <p className="text-muted-foreground text-xs font-arabic">{t("dashboard", "startScanOrUpload")}</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6">
            {scans.slice(0, 5).map((scan, i) => (
              <motion.button
                key={scan.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => navigate("/results", { state: { analysis: scan.analysis, imageUrl: scan.image_url } })}
                className="flex-shrink-0 w-56 rounded-2xl overflow-hidden glass-card-cyan"
              >
                <div className="relative h-28">
                  {scan.image_url ? (
                    <img src={scan.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                  {scan.confidence != null && (
                    <span className="absolute top-2 left-2 text-[9px] font-mono font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {scan.confidence}%
                    </span>
                  )}
                </div>
                <div className="p-3 text-left">
                  <p className="text-xs font-bold text-foreground truncate">{scan.analysis?.fragmentId ?? scan.title ?? "Inscription"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{scan.site ?? scan.analysis?.site ?? "—"}</p>
                  <p className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(scan.created_at)}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-6 grid grid-cols-3 gap-3 mb-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="stat-card text-center"
          >
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <BottomNav active="home" />
    </div>
  );
};

export default Dashboard;
