import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Flag, Ban, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<{ name: string; image: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!matchId || !user) return;

    const fetchMatch = async () => {
      const { data: match } = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

      if (!match) {
        navigate("/matches");
        return;
      }

      const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, profile_image_url")
        .eq("user_id", otherId)
        .single();

      setOtherUser({
        name: profile?.name ?? "Korisnik",
        image: profile?.profile_image_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherId}`,
      });

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      setMessages(msgs ?? []);
      setLoading(false);
    };

    fetchMatch();

    // Realtime subscription for instant messages
    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !matchId) return;
    const content = newMessage.trim();
    setNewMessage("");

    await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: user.id,
      content,
    });
  };

  const handleReport = async () => {
    if (!matchId || !user) return;
    const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
    if (!match) return;
    const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id;
    await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: otherId,
      reason: "Prijavljeno iz chata",
    });
    toast({ title: "Prijava poslana", description: "Pregledamo korisnika." });
  };

  const handleBlock = async () => {
    if (!matchId || !user) return;
    const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
    if (!match) return;
    const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id;
    await supabase.from("blocks").insert({
      blocker_id: user.id,
      blocked_id: otherId,
    });
    toast({ title: "Korisnik blokiran", description: "Više nećeš vidjeti ovog korisnika." });
    navigate("/matches");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={() => navigate("/matches")} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <img src={otherUser?.image ?? ""} alt={otherUser?.name ?? ""} className="h-10 w-10 rounded-full object-cover" />
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{otherUser?.name}</h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-lg p-2 hover:bg-secondary">
            <span className="text-lg">⋮</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleReport} className="text-destructive">
              <Flag className="mr-2 h-4 w-4" /> Prijavi korisnika
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleBlock} className="text-destructive">
              <Ban className="mr-2 h-4 w-4" /> Blokiraj
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-secondary text-secondary-foreground"}`}>
                <p className="text-sm">{msg.content}</p>
                <p className={`mt-1 text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Napiši poruku..."
            className="flex-1 rounded-full border-border bg-secondary"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 transition-transform active:scale-90"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
