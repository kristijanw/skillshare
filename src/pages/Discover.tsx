import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, RotateCcw } from "lucide-react";
import SwipeCard from "@/components/SwipeCard";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { UserProfile } from "@/components/SwipeCard";

const Discover = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    if (!user) return;

    // Get blocked users
    const { data: blocks } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id);
    const blockedIds = (blocks ?? []).map((b) => b.blocked_id);

    // Get already swiped users
    const { data: likes } = await supabase
      .from("swipe_likes")
      .select("liked_id")
      .eq("liker_id", user.id);
    const likedIds = (likes ?? []).map((l) => l.liked_id);

    const excludeIds = [...blockedIds, ...likedIds, user.id];

    // Fetch profiles with skills
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .not("user_id", "in", `(${excludeIds.join(",")})`)
      .not("name", "eq", "");

    if (!profiles || profiles.length === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    // Fetch skills for these users
    const userIds = profiles.map((p) => p.user_id);
    const { data: skills } = await supabase
      .from("user_skills")
      .select("user_id, type, skills(name)")
      .in("user_id", userIds);

    const mappedUsers: UserProfile[] = profiles.map((p) => {
      const userSkills = (skills ?? []).filter((s) => s.user_id === p.user_id);
      return {
        id: p.user_id,
        name: p.name,
        age: p.age ?? 0,
        city: p.city ?? "",
        bio: p.bio ?? "",
        image: p.profile_image_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_id}`,
        trustLevel: p.trust_level,
        rating: 0,
        skillsTeach: userSkills
          .filter((s) => s.type === "teach")
          .map((s) => (s.skills as any)?.name ?? ""),
        skillsLearn: userSkills
          .filter((s) => s.type === "learn")
          .map((s) => (s.skills as any)?.name ?? ""),
      };
    });

    setUsers(mappedUsers);
    setLoading(false);
  };

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      const targetUser = users[currentIndex];
      if (!targetUser || !user) return;

      if (direction === "right") {
        const { error } = await supabase.from("swipe_likes").insert({
          liker_id: user.id,
          liked_id: targetUser.id,
        });

        if (!error) {
          // Check for mutual match
          const { data: match } = await supabase
            .from("matches")
            .select("id")
            .or(
              `and(user1_id.eq.${user.id},user2_id.eq.${targetUser.id}),and(user1_id.eq.${targetUser.id},user2_id.eq.${user.id})`
            )
            .maybeSingle();

          if (match) {
            toast({
              title: "🎉 Match!",
              description: `Ti i ${targetUser.name} ste matchali! Započni razgovor.`,
            });
          } else {
            toast({
              title: "💫 Zainteresiran/a!",
              description: `Ako se ${targetUser.name} složi, imat ćete match!`,
            });
          }
        }
      }
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, users, user, toast]
  );

  const remainingUsers = users.slice(currentIndex);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <header className="flex items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="text-2xl font-bold font-display text-foreground">
          Skill<span className="text-primary">Swap</span>
        </h1>
      </header>

      <div className="relative mx-auto flex flex-1 w-full max-w-md items-center justify-center px-4 pb-32">
        {remainingUsers.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <RotateCcw className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold font-display text-foreground">Nema više profila</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vrati se kasnije za nove ljude u tvojoj okolici!
            </p>
          </motion.div>
        ) : (
          <div className="relative h-[65vh] w-full max-w-sm">
            <AnimatePresence>
              {remainingUsers
                .slice(0, 2)
                .reverse()
                .map((u, i) => (
                  <SwipeCard
                    key={u.id}
                    user={u}
                    isTop={i === remainingUsers.slice(0, 2).reverse().length - 1}
                    onSwipeLeft={() => handleSwipe("left")}
                    onSwipeRight={() => handleSwipe("right")}
                  />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {remainingUsers.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-20 flex items-center justify-center gap-6 pb-4">
          <button
            onClick={() => handleSwipe("left")}
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-destructive/30 bg-card shadow-card transition-transform hover:scale-110 active:scale-95"
          >
            <X className="h-7 w-7 text-destructive" />
          </button>
          <button
            onClick={() => handleSwipe("right")}
            className="flex h-20 w-20 items-center justify-center rounded-full gradient-warm shadow-glow transition-transform hover:scale-110 active:scale-95"
          >
            <Heart className="h-9 w-9 text-primary-foreground" fill="currentColor" />
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Discover;
