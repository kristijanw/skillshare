import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  onboardingCompleted: boolean | null;
  isAdmin: boolean;
  setOnboardingCompleted: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  onboardingCompleted: null,
  isAdmin: false,
  setOnboardingCompleted: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchOnboarding = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed, is_admin, is_suspended")
      .eq("user_id", userId)
      .single();

    // Auto sign out suspended users
    if ((data as any)?.is_suspended) {
      await supabase.auth.signOut();
      return;
    }

    setOnboardingCompleted((data as any)?.onboarding_completed ?? false);
    setIsAdmin((data as any)?.is_admin ?? false);
    setLoading(false);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchOnboarding(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchOnboarding(session.user.id);
      } else {
        setOnboardingCompleted(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setOnboardingCompleted(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, onboardingCompleted, isAdmin, setOnboardingCompleted, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
