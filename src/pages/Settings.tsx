import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, LogOut, Globe, Shield, Info, Loader2, Save, Settings2, BookOpen, ChevronRight } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import type { Language } from "@/i18n/translations";

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { t, lang, setLang, dir } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [institution, setInstitution] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoEnhance, setAutoEnhance] = useState(true);
  const [scanCount, setScanCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (data) { setFullName(data.full_name ?? ""); setInstitution(data.institution ?? ""); }
      const { count } = await supabase.from("scans").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      setScanCount(count ?? 0);
      setLoading(false);
    };
    fetchProfile();
    setAutoEnhance(localStorage.getItem("autoEnhance") !== "false");
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, full_name: fullName || null, institution: institution || null, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) toast.error(t("settings", "profileSaveFailed"));
    else toast.success(t("settings", "profileSaved"));
    setSaving(false);
  };

  const handleSignOut = async () => { await signOut(); navigate("/login", { replace: true }); };
  const toggleAutoEnhance = (checked: boolean) => { setAutoEnhance(checked); localStorage.setItem("autoEnhance", String(checked)); };

  const langOptions: { code: Language; label: string }[] = [
    { code: "ar", label: t("settings", "arabic") },
    { code: "en", label: t("settings", "english") },
    { code: "fr", label: t("settings", "french") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24" dir={dir}>
      {/* Header */}
      <div className="px-6 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-secondary"><ArrowLeft className="w-5 h-5 text-foreground" /></button>
        <h1 className="font-display text-sm font-bold tracking-wider text-foreground flex-1 text-center uppercase">PROTOCOL: PROFILE</h1>
        <div className="w-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      ) : (
        <div className="px-6 space-y-6">
          {/* Avatar & stats */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full border-2 border-primary/40 p-1">
                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  <User className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-[10px] font-bold font-mono px-3 py-0.5 rounded-full">
                LEVEL {Math.min(99, Math.floor(scanCount / 2) + 1)}
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground tracking-wider">{fullName || "EPIGRAPHI Dz"}</h2>
            <p className="text-primary font-mono text-xs font-bold tracking-wider mt-1">◆ {institution || "EXPLORER"}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-6 w-full">
              <div className="stat-card text-center">
                <p className="text-xl font-bold text-primary">{scanCount}</p>
                <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-wider">DISCOVERIES</p>
              </div>
              <div className="stat-card text-center">
                <p className="text-xl font-bold text-accent">{Math.floor(scanCount * 0.3)}</p>
                <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-wider">ACHIEVEMENTS</p>
              </div>
              <div className="stat-card text-center">
                <p className="text-xl font-bold text-primary">{Math.floor(scanCount * 0.1)}</p>
                <p className="font-mono text-[8px] text-muted-foreground uppercase tracking-wider">CONTRIBUTIONS</p>
              </div>
            </div>
          </div>

          {/* Profile edit */}
          <div className="glass-card-cyan p-5 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="font-mono text-[10px] text-muted-foreground font-bold mb-1 block uppercase tracking-wider">{t("settings", "fullName")}</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors" placeholder={t("settings", "enterName")} />
              </div>
              <div>
                <label className="font-mono text-[10px] text-muted-foreground font-bold mb-1 block uppercase tracking-wider">{t("settings", "institution")}</label>
                <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)} className="w-full bg-secondary/50 border border-border/50 rounded-lg px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 transition-colors" placeholder={t("settings", "institutionPlaceholder")} />
              </div>
              <button onClick={saveProfile} disabled={saving} className="btn-neon w-full py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {t("settings", "saveChanges")}
              </button>
            </div>
          </div>

          {/* Menu items */}
          <div className="space-y-2">
            <button onClick={() => navigate("/history")} className="w-full glass-card-cyan p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary" /></div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-foreground">{t("history", "scanHistory")}</p>
                <p className="text-[10px] text-muted-foreground">{scanCount} items synced</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="glass-card-cyan p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center"><Settings2 className="w-5 h-5 text-accent" /></div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{t("settings", "autoEnhance")}</p>
              </div>
              <Switch checked={autoEnhance} onCheckedChange={toggleAutoEnhance} />
            </div>

            <div className="glass-card-cyan p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Globe className="w-5 h-5 text-primary" /></div>
                <p className="text-sm font-bold text-foreground">{t("settings", "language")}</p>
              </div>
              <div className="flex gap-2">
                {langOptions.map((l) => (
                  <button key={l.code} onClick={() => setLang(l.code)} className={`flex-1 py-2 rounded-lg text-xs font-bold font-mono transition-all ${lang === l.code ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"}`}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* About & sign out */}
          <div className="glass-card-cyan p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Info className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">{t("settings", "version")}</span></div>
              <span className="font-mono text-xs text-muted-foreground">1.0.0-mvp</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">{t("settings", "privacy")}</span></div>
              <span className="text-xs text-primary font-mono">{t("settings", "dataProtected")}</span>
            </div>
          </div>

          <button onClick={handleSignOut} className="w-full glass-card-cyan p-4 flex items-center justify-center gap-2 text-destructive font-bold text-sm border-destructive/20">
            <LogOut className="w-5 h-5" />
            {t("settings", "signOut")}
          </button>
        </div>
      )}

      <BottomNav active="settings" />
    </div>
  );
};

export default Settings;
