import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const VerifyEmail = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);

  if (!user) return <Navigate to="/auth" replace />;
  if (user.email_confirmed_at) return <Navigate to="/discover" replace />;

  const handleResend = async () => {
    setResending(true);
    const { Capacitor } = await import("@capacitor/core");
    const emailRedirectTo = Capacitor.isNativePlatform()
      ? "hr.liait.skillshare://"
      : `${window.location.origin}/discover`;

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email!,
      options: { emailRedirectTo },
    });
    setResending(false);
    if (error) {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email poslan!", description: "Provjeri inbox (i spam)." });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-sm flex-col items-center text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl gradient-warm shadow-glow">
          <Mail className="h-9 w-9 text-primary-foreground" />
        </div>

        <h1 className="text-2xl font-bold font-display text-foreground">Provjeri email</h1>
        <p className="mt-3 text-muted-foreground">
          Poslali smo verifikacijski link na{" "}
          <span className="font-medium text-foreground">{user.email}</span>.
          Klikni link u emailu da aktiviraš račun.
        </p>

        <Button
          onClick={handleResend}
          disabled={resending}
          variant="outline"
          className="mt-8 h-12 w-full rounded-xl"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${resending ? "animate-spin" : ""}`} />
          {resending ? "Šalje se..." : "Pošalji ponovo"}
        </Button>

        <button
          onClick={signOut}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground"
        >
          Odjavi se
        </button>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
