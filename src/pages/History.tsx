import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, BookOpen, Trash2, Loader2, Search, Trash } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Scan {
  id: string;
  title: string | null;
  script_type: string | null;
  confidence: number | null;
  created_at: string;
  image_url: string | null;
  analysis: { fragmentId?: string; site?: string; region?: string; [key: string]: unknown } | null;
  region: string | null;
  site: string | null;
}

const History = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, dir, lang } = useLanguage();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchScans = async () => {
      const { data } = await supabase.from("scans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setScans((data as Scan[]) ?? []);
      setLoading(false);
    };
    fetchScans();
  }, [user]);

  const deleteScan = async (id: string) => {
    const { error } = await supabase.from("scans").delete().eq("id", id);
    if (error) toast.error(t("history", "deleteFailed"));
    else { setScans((prev) => prev.filter((s) => s.id !== id)); toast.success(t("history", "deleteSuccess")); }
  };

  const deleteAllScans = async () => {
    if (!user) return;
    const { error } = await supabase.from("scans").delete().eq("user_id", user.id);
    if (error) toast.error(t("history", "deleteAllFailed"));
    else { setScans([]); toast.success(t("history", "deleteAllSuccess")); }
  };

  const formatDate = (dateStr: string) => {
    const locale = lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-US";
    return new Date(dateStr).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const filtered = scans.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.title?.toLowerCase().includes(q) || s.script_type?.toLowerCase().includes(q) || s.region?.toLowerCase().includes(q) || s.site?.toLowerCase().includes(q);
  });

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24" dir={dir}>
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-start justify-between">
        <div>
          <p className="font-mono text-[10px] text-primary font-bold tracking-wider mb-1">ARCHIVE COMMAND</p>
          <h1 className="font-display text-2xl font-bold text-foreground tracking-wider">{t("history", "scanHistory")}</h1>
          <p className="text-muted-foreground text-xs mt-1">{t("history", "allScannedInscriptions")}</p>
        </div>
        {scans.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="mt-1 p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"><Trash className="w-5 h-5" /></button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={dir}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("history", "deleteAll")}</AlertDialogTitle>
                <AlertDialogDescription>{t("history", "deleteAllConfirm")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse gap-2">
                <AlertDialogAction onClick={deleteAllScans} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("history", "deleteAllBtn")}</AlertDialogAction>
                <AlertDialogCancel>{t("common", "cancel")}</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Search */}
      <div className="px-6 mb-4">
        <div className="glass-card-cyan flex items-center gap-3 px-4 py-3">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder={t("history", "searchHistory")} value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-foreground text-sm flex-1 outline-none placeholder:text-muted-foreground/50 font-mono" />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 flex-1">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 glass-card-cyan">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-bold mb-1">{search ? t("history", "noResults") : t("history", "noRecordsYet")}</p>
            <p className="text-muted-foreground text-sm">{search ? t("history", "tryDifferentSearch") : t("history", "startScanHint")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider">{t("history", "nInscriptions").replace("{n}", String(filtered.length))}</p>
            {filtered.map((scan) => (
              <div key={scan.id} className="glass-card-cyan p-3 flex items-center gap-4">
                <button onClick={() => navigate("/results", { state: { analysis: scan.analysis, imageUrl: scan.image_url } })} className="flex-1 flex items-center gap-4 text-right">
                  <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border/30">
                    {scan.image_url ? <img src={scan.image_url} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-primary font-bold uppercase tracking-wider truncate">{scan.analysis?.fragmentId ?? scan.title ?? "SCAN"}</p>
                    <p className="text-sm font-semibold text-foreground truncate">{scan.script_type ?? t("common", "inscription")} {scan.site && `• ${scan.site}`}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {scan.confidence != null && <span className="text-[10px] text-primary font-bold font-mono">{scan.confidence}%</span>}
                      <span className="text-[10px] text-muted-foreground">{formatDate(scan.created_at)}</span>
                    </div>
                  </div>
                </button>
                <button onClick={() => deleteScan(scan.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="history" />
    </div>
  );
};

export default History;
