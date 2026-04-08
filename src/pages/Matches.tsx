import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { mockMatches } from "@/data/mockUsers";
import { Badge } from "@/components/ui/badge";

const Matches = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <header className="px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="text-2xl font-bold font-display text-foreground">Razgovori</h1>
        <p className="text-sm text-muted-foreground">Tvoji matchevi i poruke</p>
      </header>

      <div className="flex-1 px-4">
        {mockMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg font-semibold text-foreground">Još nema matcheva</p>
            <p className="mt-1 text-sm text-muted-foreground">Nastavi swipati da pronađeš ljude!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {mockMatches.map((match, i) => (
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
                    src={match.user.image}
                    alt={match.user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                  {match.unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {match.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{match.user.name}</h3>
                    <span className="text-xs text-muted-foreground">{match.timestamp}</span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{match.lastMessage}</p>
                  <div className="mt-1 flex gap-1">
                    {match.user.skillsTeach.slice(0, 2).map((s) => (
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
