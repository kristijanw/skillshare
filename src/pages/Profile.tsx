import { motion } from "framer-motion";
import { Shield, Star, MapPin, Edit, LogOut, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";

const myProfile = {
  name: "Tvoje Ime",
  age: 25,
  city: "Zagreb",
  bio: "Volim učiti nove stvari i dijeliti znanje! 🚀",
  image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
  trustLevel: 2,
  rating: 4.6,
  reviewCount: 12,
  skillsTeach: ["JavaScript", "React", "Engleski"],
  skillsLearn: ["Gitara", "Fotografija", "Kuhanje"],
};

const trustLabels = ["", "Email verificiran", "Telefon verificiran", "Potpuno verificiran"];
const trustColors = ["", "bg-trust-1", "bg-trust-2", "bg-trust-3"];

const Profile = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background pb-24">
      {/* Header cover */}
      <div className="relative h-48 gradient-warm">
        <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex gap-2">
          <button className="rounded-full bg-card/20 backdrop-blur-sm p-2 text-primary-foreground">
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Avatar */}
      <div className="relative mx-auto -mt-16 w-full max-w-md px-5">
        <div className="relative inline-block">
          <img
            src={myProfile.image}
            alt={myProfile.name}
            className="h-28 w-28 rounded-full border-4 border-background object-cover shadow-elevated"
          />
          <button className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card">
            <Edit className="h-4 w-4" />
          </button>
        </div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
          <h1 className="text-2xl font-bold font-display text-foreground">
            {myProfile.name}, {myProfile.age}
          </h1>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {myProfile.city}
            </span>
            <span className="flex items-center gap-1 text-accent">
              <Star className="h-3.5 w-3.5 fill-accent" /> {myProfile.rating} ({myProfile.reviewCount})
            </span>
          </div>

          {/* Trust badge */}
          <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full ${trustColors[myProfile.trustLevel]} px-3 py-1.5`}>
            <Shield className="h-4 w-4 text-primary-foreground" />
            <span className="text-xs font-semibold text-primary-foreground">
              {trustLabels[myProfile.trustLevel]}
            </span>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">{myProfile.bio}</p>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 space-y-4"
        >
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground font-display">Mogu naučiti</h3>
            <div className="flex flex-wrap gap-2">
              {myProfile.skillsTeach.map((s) => (
                <Badge key={s} className="bg-primary text-primary-foreground border-0">{s}</Badge>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground font-display">Želim naučiti</h3>
            <div className="flex flex-wrap gap-2">
              {myProfile.skillsLearn.map((s) => (
                <Badge key={s} variant="outline" className="border-primary/30 text-foreground">{s}</Badge>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 space-y-3"
        >
          <button className="flex w-full items-center gap-3 rounded-xl bg-card p-4 shadow-card text-foreground transition-colors hover:bg-secondary/50">
            <Edit className="h-5 w-5 text-primary" />
            <span className="font-medium">Uredi profil</span>
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl bg-card p-4 shadow-card text-destructive transition-colors hover:bg-destructive/10">
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
