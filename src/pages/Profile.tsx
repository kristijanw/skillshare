import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Star, MapPin, LogOut, Camera, Save, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const trustLabels = ["", "Email verificiran", "Telefon verificiran", "Potpuno verificiran"];
const trustColors = ["", "bg-trust-1", "bg-trust-2", "bg-trust-3"];

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, teachSkills, learnSkills, loading, refetch } = useProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allSkills, setAllSkills] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ name: "", age: "", city: "", bio: "" });
  const [selectedTeach, setSelectedTeach] = useState<string[]>([]);
  const [selectedLearn, setSelectedLearn] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        age: profile.age?.toString() || "",
        city: profile.city || "",
        bio: profile.bio || "",
      });
      setSelectedTeach(teachSkills);
      setSelectedLearn(learnSkills);
    }
  }, [profile, teachSkills, learnSkills]);

  useEffect(() => {
    supabase.from("skills").select("id, name").then(({ data }) => {
      if (data) setAllSkills(data);
    });
  }, []);

  const toggleSkill = (skill: string, type: "teach" | "learn") => {
    if (type === "teach") {
      setSelectedTeach((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
    } else {
      setSelectedLearn((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
    }
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

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let profileImageUrl: string | undefined;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/avatar.${ext}`;
        await supabase.storage.from("avatars").upload(path, imageFile, { upsert: true });
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        profileImageUrl = urlData.publicUrl;
      }

      await supabase.from("profiles").update({
        name: form.name.trim(),
        age: form.age ? Number(form.age) : null,
        city: form.city.trim(),
        bio: form.bio.trim(),
        ...(profileImageUrl ? { profile_image_url: profileImageUrl } : {}),
      }).eq("user_id", user.id);

      // Update skills
      await supabase.from("user_skills").delete().eq("user_id", user.id);
      const skillMap = new Map(allSkills.map((s) => [s.name, s.id]));
      const inserts = [
        ...selectedTeach.filter((n) => skillMap.has(n)).map((n) => ({ user_id: user.id, skill_id: skillMap.get(n)!, type: "teach" as const })),
        ...selectedLearn.filter((n) => skillMap.has(n)).map((n) => ({ user_id: user.id, skill_id: skillMap.get(n)!, type: "learn" as const })),
      ];
      if (inserts.length > 0) await supabase.from("user_skills").insert(inserts);

      await refetch();
      setEditing(false);
      setImageFile(null);
      setImagePreview(null);
      toast({ title: "Profil ažuriran! ✅" });
    } catch (err: any) {
      toast({ title: "Greška", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const avatarSrc = imagePreview ?? profile?.profile_image_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.user_id}`;

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="relative h-36 gradient-warm" />

      <div className="relative mx-auto -mt-16 w-full max-w-md px-5">
        {/* Avatar */}
        <div className="relative inline-block">
          <img src={avatarSrc} alt={profile?.name ?? ""} className="h-28 w-28 rounded-full border-4 border-background object-cover shadow-elevated" />
          {editing && (
            <>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
                <Camera className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {!editing ? (
          /* View mode */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
            <h1 className="text-2xl font-bold font-display text-foreground">
              {profile?.name || "Korisnik"}{profile?.age ? `, ${profile.age}` : ""}
            </h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              {profile?.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {profile.city}</span>}
            </div>
            {profile && profile.trust_level > 0 && (
              <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full ${trustColors[profile.trust_level]} px-3 py-1.5`}>
                <Shield className="h-4 w-4 text-primary-foreground" />
                <span className="text-xs font-semibold text-primary-foreground">{trustLabels[profile.trust_level]}</span>
              </div>
            )}
            {profile?.bio && <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>}

            <div className="mt-6 space-y-4">
              {teachSkills.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground font-display">Mogu naučiti</h3>
                  <div className="flex flex-wrap gap-2">{teachSkills.map((s) => <Badge key={s} className="bg-primary text-primary-foreground border-0">{s}</Badge>)}</div>
                </div>
              )}
              {learnSkills.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground font-display">Želim naučiti</h3>
                  <div className="flex flex-wrap gap-2">{learnSkills.map((s) => <Badge key={s} variant="outline" className="border-primary/30 text-foreground">{s}</Badge>)}</div>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3">
              <Button onClick={() => setEditing(true)} variant="outline" className="w-full rounded-xl h-12">
                Uredi profil
              </Button>
              <button onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-xl bg-card p-4 shadow-card text-destructive transition-colors hover:bg-destructive/10">
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Odjava</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* Edit mode - classic form */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Ime</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Dob</label>
              <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} min={18} className="rounded-xl" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Grad</label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Bio</label>
              <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="rounded-xl min-h-[80px]" maxLength={300} />
              <p className="mt-1 text-xs text-muted-foreground text-right">{form.bio.length}/300</p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Mogu naučiti</h3>
              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill) => {
                  const selected = selectedTeach.includes(skill.name);
                  return (
                    <button key={skill.id} onClick={() => toggleSkill(skill.name, "teach")} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${selected ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                      {selected && <CheckCircle2 className="mr-1 inline h-3 w-3" />}{skill.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">Želim naučiti</h3>
              <div className="flex flex-wrap gap-2">
                {allSkills.map((skill) => {
                  const selected = selectedLearn.includes(skill.name);
                  return (
                    <button key={skill.id} onClick={() => toggleSkill(skill.name, "learn")} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${selected ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>
                      {selected && <CheckCircle2 className="mr-1 inline h-3 w-3" />}{skill.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => { setEditing(false); setImageFile(null); setImagePreview(null); }} className="flex-1 rounded-xl h-12">
                Odustani
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 rounded-xl h-12 gradient-warm text-primary-foreground border-0">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Spremam..." : "Spremi"}
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
