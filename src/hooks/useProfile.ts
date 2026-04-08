import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  age: number | null;
  city: string | null;
  bio: string | null;
  profile_image_url: string | null;
  trust_level: number;
}

export interface UserSkillRow {
  id: string;
  skill_id: string;
  type: string;
  skills: { name: string } | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teachSkills, setTeachSkills] = useState<string[]>([]);
  const [learnSkills, setLearnSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) setProfile(data);

    const { data: skills } = await supabase
      .from("user_skills")
      .select("id, skill_id, type, skills(name)")
      .eq("user_id", user.id);

    if (skills) {
      setTeachSkills(
        (skills as unknown as UserSkillRow[])
          .filter((s) => s.type === "teach")
          .map((s) => s.skills?.name ?? "")
      );
      setLearnSkills(
        (skills as unknown as UserSkillRow[])
          .filter((s) => s.type === "learn")
          .map((s) => s.skills?.name ?? "")
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    await supabase.from("profiles").update(updates).eq("user_id", user.id);
    await fetchProfile();
  };

  return { profile, teachSkills, learnSkills, loading, updateProfile, refetch: fetchProfile };
};
