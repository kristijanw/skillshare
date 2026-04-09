import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Shield, Sparkles, Users, CheckCircle2, Camera, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { title: "O tebi", subtitle: "Ime, dob i grad" },
  { title: "Mogu naučiti", subtitle: "Koje vještine možeš podijeliti?" },
  { title: "Želim naučiti", subtitle: "Što želiš naučiti?" },
  { title: "Profilna slika", subtitle: "Dodaj svoju fotografiju" },
  { title: "Zadnji korak", subtitle: "Bio i sigurnosni savjeti" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [allSkills, setAllSkills] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    city: "Zagreb",
    bio: "",
    teachSkills: [] as string[],
    learnSkills: [] as string[],
  });

  useEffect(() => {
    supabase.from("skills").select("id, name").then(({ data }) => {
      if (data) setAllSkills(data);
    });
    if (user?.user_metadata?.full_name) {
      setFormData((prev) => ({ ...prev, name: user.user_metadata.full_name }));
    }
  }, [user]);

  const toggleSkill = (skill: string, type: "teachSkills" | "learnSkills") => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].includes(skill)
        ? prev[type].filter((s) => s !== skill)
        : [...prev[type], skill],
    }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Slika prevelika", description: "Maksimalno 5MB", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const canProceed = () => {
    switch (step) {
      case 0: return formData.name.trim().length >= 2 && formData.age && Number(formData.age) >= 18;
      case 1: return formData.teachSkills.length > 0;
      case 2: return formData.learnSkills.length > 0;
      case 3: return true; // image is optional
      case 4: return true;
      default: return true;
    }
  };

  const saveOnboarding = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let profileImageUrl: string | null = null;

      // Upload image if selected
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, imageFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          profileImageUrl = urlData.publicUrl;
        }
      }

      // Update profile
      await supabase.from("profiles").update({
        name: formData.name.trim(),
        age: Number(formData.age),
        city: formData.city.trim(),
        bio: formData.bio.trim(),
        onboarding_completed: true,
        ...(profileImageUrl ? { profile_image_url: profileImageUrl } : {}),
      }).eq("user_id", user.id);

      // Delete existing skills and re-insert
      await supabase.from("user_skills").delete().eq("user_id", user.id);

      const skillMap = new Map(allSkills.map((s) => [s.name, s.id]));
      const inserts = [
        ...formData.teachSkills.filter((n) => skillMap.has(n)).map((n) => ({ user_id: user.id, skill_id: skillMap.get(n)!, type: "teach" as const })),
        ...formData.learnSkills.filter((n) => skillMap.has(n)).map((n) => ({ user_id: user.id, skill_id: skillMap.get(n)!, type: "learn" as const })),
      ];
      if (inserts.length > 0) await supabase.from("user_skills").insert(inserts);

      toast({ title: "Profil spremljen! 🎉" });
      navigate("/discover");
    } catch (err: any) {
      toast({ title: "Greška", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else saveOnboarding();
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="px-6 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3 mb-4">
          {step > 0 && (
            <button onClick={prevStep} className="text-muted-foreground">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex flex-1 gap-1.5">
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
      </div>

      <div className="flex flex-1 flex-col px-6 py-4">
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

            <div className="mt-6 flex-1">
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Ime</label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Tvoje ime" className="rounded-xl" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Dob</label>
                    <Input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} placeholder="18+" min={18} className="rounded-xl" />
                    {formData.age && Number(formData.age) < 18 && <p className="mt-1 text-xs text-destructive">Moraš imati 18+ godina</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Grad</label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Zagreb" className="rounded-xl" />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="flex flex-wrap gap-2">
                  {allSkills.map((skill) => {
                    const selected = formData.teachSkills.includes(skill.name);
                    return (
                      <button key={skill.id} onClick={() => toggleSkill(skill.name, "teachSkills")} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${selected ? "bg-primary text-primary-foreground shadow-card" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                        {selected && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-wrap gap-2">
                  {allSkills.map((skill) => {
                    const selected = formData.learnSkills.includes(skill.name);
                    return (
                      <button key={skill.id} onClick={() => toggleSkill(skill.name, "learnSkills")} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${selected ? "bg-accent text-accent-foreground shadow-card" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                        {selected && <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />}
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col items-center gap-6">
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex h-40 w-40 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-secondary/50 overflow-hidden transition-colors hover:border-primary"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Camera className="h-10 w-10" />
                        <span className="text-xs font-medium">Dodaj sliku</span>
                      </div>
                    )}
                  </button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl">
                    <Upload className="mr-2 h-4 w-4" />
                    {imagePreview ? "Promijeni sliku" : "Odaberi sliku"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">Opcionalno · Maksimalno 5MB</p>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Bio (opcionalno)</label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Reci nešto o sebi..."
                      className="rounded-xl min-h-[100px]"
                      maxLength={300}
                    />
                    <p className="mt-1 text-xs text-muted-foreground text-right">{formData.bio.length}/300</p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Sigurnosni savjeti</h3>
                    {[
                      { emoji: "📹", text: "Koristi videopoziv za prvu lekciju ako ti je ugodnije" },
                      { emoji: "🔒", text: "Ne dijeli osobne podatke odmah" },
                      { emoji: "🚨", text: "Prijavi sumnjive korisnike" },
                    ].map(({ emoji, text }) => (
                      <div key={text} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card">
                        <span className="text-xl">{emoji}</span>
                        <span className="text-sm text-foreground">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <Button
          onClick={nextStep}
          disabled={!canProceed() || saving}
          className="mt-6 h-14 w-full rounded-2xl text-base font-semibold gradient-warm text-primary-foreground border-0 shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
        >
          {saving ? "Spremam..." : step === steps.length - 1 ? "Počni koristiti SkillSwap" : "Nastavi"}
          {!saving && <ArrowRight className="ml-2 h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
