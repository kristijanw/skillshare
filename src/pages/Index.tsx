import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center text-center"
      >
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl gradient-warm shadow-glow animate-pulse-glow">
          <Sparkles className="h-10 w-10 text-primary-foreground" />
        </div>

        <h1 className="text-4xl font-bold font-display text-foreground">
          Skill<span className="text-primary">Swap</span>
        </h1>
        <p className="mt-3 max-w-xs text-muted-foreground">
          Razmijeni vještine s ljudima u tvojoj okolici. Uči i podučavaj – besplatno.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-10 w-full max-w-xs space-y-3"
        >
          <Button
            onClick={() => navigate("/onboarding")}
            className="h-14 w-full rounded-2xl text-base font-semibold gradient-warm text-primary-foreground border-0 shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Započni <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/discover")}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Već imam račun
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
