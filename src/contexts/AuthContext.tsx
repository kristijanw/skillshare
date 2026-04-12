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

  const fetchOnboarding = async (userId: string, emailConfirmed?: boolean) => {
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

    const completed = (data as any)?.onboarding_completed ?? false;

    // After email verification: complete pending onboarding automatically
    if (!completed && emailConfirmed) {
      const stored = localStorage.getItem("pending_onboarding");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.userId === userId) {
            localStorage.removeItem("pending_onboarding");

            // Save profile data
            await supabase.from("profiles").update({
              age: Number(parsed.age),
              city: parsed.city,
              bio: parsed.bio,
              onboarding_completed: true,
            }).eq("user_id", userId);

            // Save skills
            const { data: skillsData } = await supabase.from("skills").select("id, name");
            if (skillsData) {
              const skillMap = new Map(skillsData.map((s) => [s.name, s.id]));
              const inserts = [
                ...(parsed.teachSkills ?? []).filter((n: string) => skillMap.has(n)).map((n: string) => ({ user_id: userId, skill_id: skillMap.get(n)!, type: "teach" })),
                ...(parsed.learnSkills ?? []).filter((n: string) => skillMap.has(n)).map((n: string) => ({ user_id: userId, skill_id: skillMap.get(n)!, type: "learn" })),
              ];
              if (inserts.length > 0) await supabase.from("user_skills").insert(inserts);
            }

            setOnboardingCompleted(true);
            setIsAdmin((data as any)?.is_admin ?? false);
            setLoading(false);
            return;
          }
        } catch {}
      }
    }

    setOnboardingCompleted(completed);
    setIsAdmin((data as any)?.is_admin ?? false);
    setLoading(false);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchOnboarding(session.user.id, !!session.user.email_confirmed_at);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchOnboarding(session.user.id, !!session.user.email_confirmed_at);
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
