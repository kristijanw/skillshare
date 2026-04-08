import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { MapPin, Shield, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  image: string;
  trustLevel: number;
  rating: number;
  skillsTeach: string[];
  skillsLearn: string[];
}

interface SwipeCardProps {
  user: UserProfile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
}

const SwipeCard = ({ user, onSwipeLeft, onSwipeRight, isTop }: SwipeCardProps) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipeRight();
    } else if (info.offset.x < -100) {
      onSwipeLeft();
    }
  };

  const trustColors = ["", "text-trust-1", "text-trust-2", "text-trust-3"];

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      style={{ x, rotate, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: 1.02 }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-elevated">
        {/* Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${user.image})` }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/20 to-transparent" />

        {/* Like / Nope indicators */}
        <motion.div
          className="absolute left-6 top-8 z-20 rotate-[-20deg] rounded-lg border-4 border-success px-4 py-2"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-2xl font-bold text-success font-display">MATCH!</span>
        </motion.div>
        <motion.div
          className="absolute right-6 top-8 z-20 rotate-[20deg] rounded-lg border-4 border-destructive px-4 py-2"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-2xl font-bold text-destructive font-display">SKIP</span>
        </motion.div>

        {/* Trust badge */}
        {user.trustLevel >= 2 && (
          <div className="absolute right-4 top-4 z-10">
            <div className={`flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-sm px-3 py-1.5 ${trustColors[user.trustLevel]}`}>
              <Shield className="h-4 w-4" />
              <span className="text-xs font-semibold">Lvl {user.trustLevel}</span>
            </div>
          </div>
        )}

        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
          <div className="mb-3 flex items-end gap-2">
            <h2 className="text-3xl font-bold text-primary-foreground font-display">
              {user.name}, {user.age}
            </h2>
            {user.rating > 0 && (
              <span className="mb-1 flex items-center gap-1 text-accent">
                <Star className="h-4 w-4 fill-accent" />
                <span className="text-sm font-semibold">{user.rating.toFixed(1)}</span>
              </span>
            )}
          </div>

          <div className="mb-3 flex items-center gap-1 text-primary-foreground/70">
            <MapPin className="h-3.5 w-3.5" />
            <span className="text-sm">{user.city}</span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-medium text-primary-foreground/60">Teaches:</span>
              {user.skillsTeach.map((s) => (
                <Badge key={s} className="bg-primary/90 text-primary-foreground border-0 text-xs">
                  {s}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs font-medium text-primary-foreground/60">Wants:</span>
              {user.skillsLearn.map((s) => (
                <Badge key={s} variant="outline" className="border-primary-foreground/30 text-primary-foreground/80 text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SwipeCard;
