import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import WorksSection from "@/components/WorksSection";

const trustLabels = ["", "Email verificiran", "Telefon verificiran", "Potpuno verificiran"];
const trustColors = ["", "bg-trust-1", "bg-trust-2", "bg-trust-3"];

interface Profile {
  user_id: string;
  name: string;
  age: number | null;
  city: string | null;
  bio: string | null;
  profile_image_url: string | null;
  trust_level: number;
}

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teachSkills, setTeachSkills] = useState<string[]>([]);
  const [learnSkills, setLearnSkills] = useState<string[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("user_id, name, age, city, bio, profile_image_url, trust_level")
        .eq("user_id", userId)
        .single();

      if (!p) { navigate(-1); return; }
      setProfile(p as Profile);

      const { data: skills } = await supabase
        .from("user_skills")
        .select("type, skills(name)")
        .eq("user_id", userId);

      setTeachSkills((skills ?? []).filter((s) => s.type === "teach").map((s) => (s.skills as any)?.name ?? ""));
      setLearnSkills((skills ?? []).filter((s) => s.type === "learn").map((s) => (s.skills as any)?.name ?? ""));

      const { data: worksData } = await supabase.from("works").select("*").eq("user_id", userId).order("created_at");
      setWorks(worksData ?? []);
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  const avatarSrc = profile.profile_image_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.user_id}`;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header gradient with avatar */}
      <div className="relative h-24 gradient-warm shrink-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-0 left-5 translate-y-1/2">
          <img
            src={avatarSrc}
            alt={profile.name ?? ""}
            className="h-28 w-28 rounded-full border-4 border-background object-cover shadow-elevated"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-md px-5 pt-16 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
            <h1 className="text-2xl font-bold font-display text-foreground">
              {profile.name}{profile.age ? `, ${profile.age}` : ""}
            </h1>

            {profile.city && (
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span>{profile.city}</span>
              </div>
            )}

            {profile.trust_level > 0 && (
              <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full ${trustColors[profile.trust_level]} px-3 py-1.5`}>
                <Shield className="h-4 w-4 text-primary-foreground" />
                <span className="text-xs font-semibold text-primary-foreground">{trustLabels[profile.trust_level]}</span>
              </div>
            )}

            {profile.bio && (
              <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
            )}

            <div className="mt-6 space-y-4">
              {teachSkills.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground font-display">Može naučiti</h3>
                  <div className="flex flex-wrap gap-2">
                    {teachSkills.map((s) => (
                      <Badge key={s} className="bg-primary text-primary-foreground border-0">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {learnSkills.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-foreground font-display">Želi naučiti</h3>
                  <div className="flex flex-wrap gap-2">
                    {learnSkills.map((s) => (
                      <Badge key={s} variant="outline" className="border-primary/30 text-foreground">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <WorksSection
              userId={profile.user_id}
              works={works}
              editable={false}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
