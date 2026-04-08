import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface MatchData {
  id: string;
  otherUser: {
    user_id: string;
    name: string;
    profile_image_url: string | null;
    skillsTeach: string[];
  };
  lastMessage: string | null;
  lastMessageTime: string | null;
  unread: number;
}

const Matches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, [user]);

  const fetchMatches = async () => {
    if (!user) return;

    const { data: matchRows } = await supabase
      .from("matches")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

    if (!matchRows || matchRows.length === 0) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const otherUserIds = matchRows.map((m) =>
      m.user1_id === user.id ? m.user2_id : m.user1_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, profile_image_url")
      .in("user_id", otherUserIds);

    const { data: skills } = await supabase
      .from("user_skills")
      .select("user_id, type, skills(name)")
      .in("user_id", otherUserIds)
      .eq("type", "teach");

    const result: MatchData[] = matchRows.map((m) => {
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
      const profile = (profiles ?? []).find((p) => p.user_id === otherId);
      const userSkills = (skills ?? [])
        .filter((s) => s.user_id === otherId)
        .map((s) => (s.skills as any)?.name ?? "");

      return {
        id: m.id,
        otherUser: {
          user_id: otherId,
          name: profile?.name ?? "Korisnik",
          profile_image_url: profile?.profile_image_url,
          skillsTeach: userSkills,
        },
        lastMessage: null,
        lastMessageTime: null,
        unread: 0,
      };
    });

    // Fetch last messages for each match
    for (const match of result) {
      const { data: msgs } = await supabase
        .from("messages")
        .select("content, created_at")
        .eq("match_id", match.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (msgs && msgs.length > 0) {
        match.lastMessage = msgs[0].content;
        match.lastMessageTime = new Date(msgs[0].created_at).toLocaleTimeString("hr-HR", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    }

    setMatches(result);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <header className="px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="text-2xl font-bold font-display text-foreground">Razgovori</h1>
        <p className="text-sm text-muted-foreground">Tvoji matchevi i poruke</p>
      </header>

      <div className="flex-1 px-4">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-semibold text-foreground">Još nema matcheva</p>
            <p className="mt-1 text-sm text-muted-foreground">Nastavi swipati da pronađeš ljude!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((match, i) => (
              <motion.button
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(`/chat/${match.id}`)}
                className="flex w-full items-center gap-3 rounded-xl bg-card p-3 shadow-card transition-colors hover:bg-secondary/50 text-left"
              >
                <div className="relative h-14 w-14 shrink-0">
                  <img
                    src={match.otherUser.profile_image_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.otherUser.user_id}`}
                    alt={match.otherUser.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{match.otherUser.name}</h3>
                    {match.lastMessageTime && (
                      <span className="text-xs text-muted-foreground">{match.lastMessageTime}</span>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {match.lastMessage ?? "Započni razgovor! 👋"}
                  </p>
                  <div className="mt-1 flex gap-1">
                    {match.otherUser.skillsTeach.slice(0, 2).map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Matches;
