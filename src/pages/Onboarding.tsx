import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, Sparkles, Users, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const allSkills = [
  "Engleski", "Njemački", "Španjolski", "Francuski", "Talijanski",
  "JavaScript", "Python", "React", "Web dizajn",
  "Gitara", "Piano", "Pjevanje",
  "Fotografija", "Crtanje", "Kuhanje",
  "Yoga", "Fitness", "Marketing",
];

const steps = [
  { title: "Dobrodošli", subtitle: "Razmijenite vještine s ljudima oko vas" },
  { title: "O tebi", subtitle: "Reci nam nešto o sebi" },
  { title: "Mogu naučiti", subtitle: "Koje vještine možeš podijeliti?" },
  { title: "Želim naučiti", subtitle: "Što želiš naučiti?" },
  { title: "Sigurnost", subtitle: "Tvoja sigurnost je prioritet" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    city: "Zagreb",
    teachSkills: [] as string[],
    learnSkills: [] as string[],
  });

  const toggleSkill = (skill: string, type: "teachSkills" | "learnSkills") => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].includes(skill)
        ? prev[type].filter((s) => s !== skill)
        : [...prev[type], skill],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return formData.name.trim() && formData.age && Number(formData.age) >= 18;
      case 2: return formData.teachSkills.length > 0;
      case 3: return formData.learnSkills.length > 0;
      case 4: return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else navigate("/discover");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="px-6 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? "gradient-warm" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="flex flex-1 flex-col"
          >
            <h1 className="text-3xl font-bold font-display text-foreground">{steps[step].title}</h1>
            <p className="mt-1 text-muted-foreground">{steps[step].subtitle}</p>

            <div className="mt-8 flex-1">
              {/* Step 0: Welcome */}
              {step === 0 && (
                <div className="space-y-6">
                  <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full gradient-warm shadow-glow animate-pulse-glow">
                    <Sparkles className="h-12 w-12 text-primary-foreground" />
                  </div>
                  <div className="space-y-4 pt-4">
                    {[
                      { icon: Users, text: "Pronađi ljude koji uče ono što ti znaš" },
                      { icon: Sparkles, text: "Razmijeni vještine 1-na-1" },
                      { icon: Shield, text: "Siguran i verificiran sustav" },
                    ].map(({ icon: Icon, text }, i) => (
                      <motion.div
                        key={text}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.15 }}
                        className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1: About you */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Ime</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tvoje ime"
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Dob</label>
                    <Input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="18+"
                      min={18}
                      className="rounded-xl"
                    />
                    {formData.age && Number(formData.age) < 18 && (
                      <p className="mt-1 text-xs text-destructive">Moraš imati 18+ godina</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Grad</label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Zagreb"
                      className="rounded-xl"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Teach skills */}
              {step === 2 && (
                <div className="flex flex-wrap gap-2">
                  {allSkills.map((skill) => {
                    const selected = formData.teachSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill, "teachSkills")}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          selected
                            ? "bg-primary text-primary-foreground shadow-card"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {selected && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 3: Learn skills */}
              {step === 3 && (
                <div className="flex flex-wrap gap-2">
                  {allSkills.map((skill) => {
                    const selected = formData.learnSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill, "learnSkills")}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          selected
                            ? "bg-accent text-accent-foreground shadow-card"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {selected && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step 4: Safety */}
              {step === 4 && (
                <div className="space-y-4">
                  {[
                    { emoji: "📍", text: "Uvijek se nalazite na javnom mjestu" },
                    { emoji: "🔒", text: "Ne dijelite osobne podatke odmah" },
                    { emoji: "🚨", text: "Prijavite sumnjive korisnike" },
                    { emoji: "✅", text: "Verificirajte profil za veće povjerenje" },
                  ].map(({ emoji, text }, i) => (
                    <motion.div
                      key={text}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-card"
                    >
                      <span className="text-2xl">{emoji}</span>
                      <span className="text-sm font-medium text-foreground">{text}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Next button */}
        <Button
          onClick={nextStep}
          disabled={!canProceed()}
          className="mt-6 h-14 w-full rounded-2xl text-base font-semibold gradient-warm text-primary-foreground border-0 shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
        >
          {step === steps.length - 1 ? "Počni" : "Nastavi"}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
