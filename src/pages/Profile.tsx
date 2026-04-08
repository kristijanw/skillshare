import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Star, MapPin, Edit, LogOut, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

const trustLabels = ["", "Email verificiran", "Telefon verificiran", "Potpuno verificiran"];
const trustColors = ["", "bg-trust-1", "bg-trust-2", "bg-trust-3"];

const Profile = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, teachSkills, learnSkills, loading } = useProfile();

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

  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      <div className="relative h-48 gradient-warm">
        <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex gap-2">
          <button className="rounded-full bg-card/20 backdrop-blur-sm p-2 text-primary-foreground">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative mx-auto -mt-16 w-full max-w-md px-5">
        <div className="relative inline-block">
          <img
            src={profile?.profile_image_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.user_id}`}
            alt={profile?.name ?? ""}
            className="h-28 w-28 rounded-full border-4 border-background object-cover shadow-elevated"
          />
          <button className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
            <Edit className="h-4 w-4" />
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <h1 className="text-2xl font-bold font-display text-foreground">
            {profile?.name || "Korisnik"}{profile?.age ? `, ${profile.age}` : ""}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            {profile?.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {profile.city}
              </span>
            )}
          </div>

          {profile && profile.trust_level > 0 && (
            <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full ${trustColors[profile.trust_level]} px-3 py-1.5`}>
              <Shield className="h-4 w-4 text-primary-foreground" />
              <span className="text-xs font-semibold text-primary-foreground">
                {trustLabels[profile.trust_level]}
              </span>
            </div>
          )}

          {profile?.bio && <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 space-y-4"
        >
          {teachSkills.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground font-display">Mogu naučiti</h3>
              <div className="flex flex-wrap gap-2">
                {teachSkills.map((s) => (
                  <Badge key={s} className="bg-primary text-primary-foreground border-0">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {learnSkills.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground font-display">Želim naučiti</h3>
              <div className="flex flex-wrap gap-2">
                {learnSkills.map((s) => (
                  <Badge key={s} variant="outline" className="border-primary/30 text-foreground">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 space-y-3"
        >
          <button
            onClick={() => navigate("/onboarding")}
            className="flex w-full items-center gap-3 rounded-xl bg-card p-4 shadow-card text-foreground transition-colors hover:bg-secondary/50"
          >
            <Edit className="h-5 w-5 text-primary" />
            <span className="font-medium">Uredi profil</span>
          </button>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl bg-card p-4 shadow-card text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Odjava</span>
          </button>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
