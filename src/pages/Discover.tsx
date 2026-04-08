import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, RotateCcw } from "lucide-react";
import SwipeCard from "@/components/SwipeCard";
import { mockUsers } from "@/data/mockUsers";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";

const Discover = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { toast } = useToast();

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        toast({
          title: "💫 Zainteresiran/a!",
          description: `Ako se ${mockUsers[currentIndex]?.name} složi, imat ćete match!`,
        });
      }
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, toast]
  );

  const remainingUsers = mockUsers.slice(currentIndex);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="text-2xl font-bold font-display text-foreground">
          Skill<span className="text-primary">Swap</span>
        </h1>
      </header>

      {/* Cards */}
      <div className="relative mx-auto flex flex-1 w-full max-w-md items-center justify-center px-4 pb-32">
        {remainingUsers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
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
                .map((user, i) => (
                  <SwipeCard
                    key={user.id}
                    user={user}
                    isTop={i === remainingUsers.slice(0, 2).reverse().length - 1}
                    onSwipeLeft={() => handleSwipe("left")}
                    onSwipeRight={() => handleSwipe("right")}
                  />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action buttons */}
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
