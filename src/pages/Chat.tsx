import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Flag, Ban, Send } from "lucide-react";
import { mockMatches, mockMessages } from "@/data/mockUsers";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const Chat = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const match = mockMatches.find((m) => m.id === matchId);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      { id: String(prev.length + 1), senderId: "me", content: newMessage, time: "sada" },
    ]);
    setNewMessage("");
  };

  if (!match) {
    navigate("/matches");
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button onClick={() => navigate("/matches")} className="text-foreground">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <img
          src={match.user.image}
          alt={match.user.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{match.user.name}</h2>
          <p className="text-xs text-muted-foreground">
            {match.user.skillsTeach[0]} ↔ {match.user.skillsLearn[0]}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-lg p-2 hover:bg-secondary">
            <span className="text-lg">⋮</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => toast({ title: "Prijava poslana", description: "Pregledamo korisnika." })}
              className="text-destructive"
            >
              <Flag className="mr-2 h-4 w-4" /> Prijavi korisnika
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                toast({ title: "Korisnik blokiran", description: "Više nećeš vidjeti ovog korisnika." });
                navigate("/matches");
              }}
              className="text-destructive"
            >
              <Ban className="mr-2 h-4 w-4" /> Blokiraj
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === "me";
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`mt-1 text-[10px] ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {msg.time}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
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
