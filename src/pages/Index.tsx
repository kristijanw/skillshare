import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Users, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const slides = [
  {
    icon: <Sparkles className="h-10 w-10 text-primary-foreground" />,
    title: "Dobrodošao/la u SkillSwap",
    description: "Razmijeni vještine s ljudima u tvojoj okolici. Uči i podučavaj – besplatno.",
  },
  {
    icon: <Users className="h-10 w-10 text-primary-foreground" />,
    title: "Pronađi savršen match",
    description: "Spajamo te s ljudima koji žele naučiti ono što ti znaš, a znaju ono što ti želiš naučiti.",
  },
  {
    icon: <BookOpen className="h-10 w-10 text-primary-foreground" />,
    title: "Uči što te zanima",
    description: "Od kuhanja do programiranja – odaberi vještine koje te zanimaju i pronađi svog učitelja.",
  },
  {
    icon: <Star className="h-10 w-10 text-primary-foreground" />,
    title: "Bez troškova",
    description: "Nema plaćanja, nema pretplata. Samo razmjena znanja između pravih ljudi.",
  },
];

const SWIPE_THRESHOLD = 50;

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [swiped, setSwiped] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    if (!user.email_confirmed_at) return <Navigate to="/verify-email" replace />;
    return <Navigate to="/discover" replace />;
  }

  const isLast = step === slides.length - 1;

  const goTo = (next: number, dir: number) => {
    setSwiped(true);
    setDirection(dir);
    setStep(next);
  };

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x < -SWIPE_THRESHOLD && !isLast) goTo(step + 1, 1);
    else if (info.offset.x > SWIPE_THRESHOLD && step > 0) goTo(step - 1, -1);
  };

  const slide = slides[step];

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background px-6 py-12 select-none">
      {/* Top bar */}
      <div className="flex w-full max-w-xs justify-end">
        <button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Preskoči
        </button>
      </div>

      {/* Slide content */}
      <div className="flex flex-1 flex-col items-center justify-center w-full max-w-xs overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -80 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            className="flex flex-col items-center text-center cursor-grab active:cursor-grabbing"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl gradient-warm shadow-glow animate-pulse-glow pointer-events-none">
              {slide.icon}
            </div>
            <h1 className="text-3xl font-bold font-display text-foreground">{slide.title}</h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">{slide.description}</p>
          </motion.div>
        </AnimatePresence>

        {/* Swipe hint — shown only on first slide before first swipe */}
        <AnimatePresence>
          {step === 0 && !swiped && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-10 flex flex-col items-center gap-2"
            >
              <motion.div
                animate={{ x: [0, -18, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.6, ease: "easeInOut" }}
                className="flex items-center gap-1 text-muted-foreground/60"
              >
                {/* Finger emoji as swipe hint */}
                <span className="text-2xl">👆</span>
                <ArrowRight className="h-4 w-4" />
              </motion.div>
              <span className="text-xs text-muted-foreground/50">Povuci za nastavak</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom */}
      <div className="w-full max-w-xs space-y-4">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > step ? 1 : -1)}
              className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : "w-2 bg-muted"}`}
            />
          ))}
        </div>

        {isLast && (
          <Button
            onClick={() => navigate("/auth")}
            className="h-14 w-full rounded-2xl text-base font-semibold gradient-warm text-primary-foreground border-0 shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Započni <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={() => navigate("/auth?mode=login")}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          Već imam račun
        </Button>
      </div>
    </div>
  );
};

export default Index;
