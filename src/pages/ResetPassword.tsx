import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success(t("login", "passwordUpdated")); navigate("/dashboard"); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6" dir={dir}>
      <form onSubmit={submit} className="w-full max-w-sm glass-card-cyan p-6 space-y-4">
        <label className="font-mono text-[10px] font-bold text-muted-foreground tracking-wider block uppercase">{t("login", "newPassword")}</label>
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-12 rounded-lg border border-border/50 bg-secondary/50 px-4 text-foreground focus:outline-none focus:border-primary/50" />
        <button type="submit" disabled={loading} className="btn-neon w-full h-12 text-sm font-display disabled:opacity-50">{t("login", "savePassword")}</button>
      </form>
    </div>
  );
};

export default ResetPassword;
