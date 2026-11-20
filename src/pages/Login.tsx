import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff, AtSign, Lock, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import heroBackground from "@/assets/hero-background.png";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { t, dir } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const handleForgot = async () => {
    if (!email) { toast.error(t("login", "enterEmailFirst")); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success(t("login", "resetSent"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
    if (isSignUp) {
      const { error } = await signUp(email, password, fullName);
      if (error) { toast.error(error.message); }
      else {
        const { data } = await supabase.auth.getSession();
        if (data.session) { toast.success(t("login", "signUpSuccess")); navigate("/dashboard"); }
        else { toast.success(t("login", "checkEmail"), { duration: 8000 }); setIsSignUp(false); }
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) { toast.error(t("login", "invalidCredentials")); }
      else { toast.success(t("login", "signInSuccess")); navigate("/dashboard"); }
    }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Hero background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
        aria-hidden="true"
      />
      {/* Dark gradient overlay for form legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/80 to-background/95" aria-hidden="true" />

      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pt-16">
        {/* Language */}
        <div className="absolute top-4 right-4"><LanguageSwitcher /></div>

        {/* Logo */}
        <div className="w-16 h-16 rounded-xl overflow-hidden border border-primary/20 shadow-lg shadow-primary/10 mb-6">
          <img src="/images/logo.png" alt="Epigraphi Dz" className="w-full h-full object-cover" />
        </div>

        <h1 className="font-display text-4xl font-bold text-foreground tracking-wider mb-2">EPIGRAPHI Dz</h1>
        <p className="text-muted-foreground text-sm mb-8 tracking-wide">{t("landing", "heroAr")}</p>

        {/* Form card */}
        <div className="w-full max-w-sm glass-card-cyan p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4" dir={dir}>
            {isSignUp && (
              <div>
                <label className="font-mono text-[10px] font-bold text-muted-foreground tracking-wider mb-2 block uppercase">{t("login", "fullName")}</label>
                <input type="text" placeholder={t("login", "fullNamePlaceholder")} value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-12 rounded-lg border border-border/50 bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
            )}

            <div>
              <label className="font-mono text-[10px] font-bold text-muted-foreground tracking-wider mb-2 block uppercase">
                {t("login", "email")}
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" placeholder={t("login", "emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-12 rounded-lg border border-border/50 bg-secondary/50 pl-10 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors" />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] font-bold text-muted-foreground tracking-wider mb-2 block uppercase">
                {t("login", "password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full h-12 rounded-lg border border-border/50 bg-secondary/50 pl-10 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!isSignUp && (
                <div className="flex justify-end mt-2">
                  <button type="button" onClick={handleForgot} className="text-xs text-primary hover:underline">{t("login", "forgotPassword")}</button>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-neon w-full h-14 flex items-center justify-center gap-2 text-sm font-display disabled:opacity-50">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-background border-t-transparent" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {isSignUp ? t("login", "createAccount") : t("login", "signIn")}
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">{t("login", "or")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google */}
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/login" });
                if (result?.error) toast.error(result.error.message || t("login", "invalidCredentials"));
              } catch (err: unknown) { toast.error(err instanceof Error ? err.message : t("login", "invalidCredentials")); }
              finally { setLoading(false); }
            }}
            className="flex items-center justify-center h-12 w-full bg-secondary/50 hover:bg-secondary/80 text-foreground font-semibold rounded-xl border border-border/50 transition-all gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {t("login", "google")}
          </button>
        </div>

        {/* Toggle sign up/in */}
        <button onClick={() => setIsSignUp(!isSignUp)} className="mt-6 text-sm text-muted-foreground">
          {isSignUp ? t("login", "switchToSignIn") : (
            <>{t("login", "switchToSignUp").split(t("login", "createAccount"))[0]} <span className="text-primary font-bold">{t("login", "createAccount")}</span></>
          )}
        </button>

        {/* Footer */}
        <div className="mt-auto pb-8 pt-6 flex items-center gap-6">
          <span className="font-mono text-[9px] text-muted-foreground/40 tracking-wider">SECURE LINK: ESTABLISHED</span>
          <span className="font-mono text-[9px] text-muted-foreground/40 tracking-wider">VER: 4.0.2α</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
