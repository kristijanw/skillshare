import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") === "login");
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "" });

  useEffect(() => {
    if (searchParams.get("error") === "not_registered") {
      toast({ title: "Nisi registriran", description: "Prvo se registriraj pa se možeš prijaviti.", variant: "destructive" });
    }
  }, []);

  // Redirect already-logged-in users
  if (!loading && user) {
    if (!user.email_confirmed_at) return <Navigate to="/verify-email" replace />;
    return <Navigate to="/discover" replace />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        // redirect handled above via user state
      } else {
        // Store credentials temporarily — signUp happens at end of onboarding
        sessionStorage.setItem("pending_signup", JSON.stringify({ email: form.email, password: form.password, name: form.name }));
        navigate("/onboarding");
      }
    } catch (error: any) {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormLoading(true);
    try {
      const { Capacitor } = await import("@capacitor/core");

      if (Capacitor.isNativePlatform()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: "hr.liait.skillshare://",
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        if (data?.url) {
          const { Browser } = await import("@capacitor/browser");
          await Browser.open({ url: data.url, windowName: "_self" });
        }
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/discover` },
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
      setFormLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6">
      <div className="pt-[max(1rem,env(safe-area-inset-top))]">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-8 flex w-full max-w-sm flex-col items-center"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-warm shadow-glow">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>

        <h1 className="text-2xl font-bold font-display text-foreground">
          {isLogin ? "Prijavi se" : "Registriraj se"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLogin ? "Dobrodošao/la natrag!" : "Kreiraj svoj SkillSwap račun"}
        </p>

        <Button
          onClick={handleGoogleSignIn}
          disabled={formLoading}
          variant="outline"
          className="mt-6 h-12 w-full rounded-xl text-sm font-medium"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isLogin ? "Prijavi se s Googleom" : "Registriraj se s Googleom"}
        </Button>

        <div className="my-4 flex w-full items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">ili</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmailAuth} className="w-full space-y-3">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ime"
                className="rounded-xl pl-10"
                required
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="rounded-xl pl-10"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Lozinka"
              className="rounded-xl pl-10"
              minLength={6}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={formLoading}
            className="h-12 w-full rounded-xl text-sm font-semibold gradient-warm text-primary-foreground border-0 shadow-glow"
          >
            {formLoading ? "Učitavanje..." : isLogin ? "Prijavi se" : "Registriraj se"}
          </Button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-5 text-sm text-muted-foreground hover:text-foreground"
        >
          {isLogin ? "Nemaš račun? Registriraj se" : "Već imaš račun? Prijavi se"}
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;
