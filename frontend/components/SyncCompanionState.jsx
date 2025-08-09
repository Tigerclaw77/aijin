"use client";

import { useEffect } from "react";
import { supabase } from "../utils/Supabase/supabaseClient";
import useAuthStore from "../store/authStore";
import useCompanionStore from "../store/companionStore";
import personalities from "../data/personalities";
import { intimacyArchetypes } from "../data/intimacy";

export default function SyncCompanionState() {
  const { user } = useAuthStore();

  const {
    currentCompanion,
    setCurrentCompanion,
    setSelectedPersonality,
    setSelectedAvatar,
    setSelectedIntimacy,
    setSelectedIntimacyArchetype,
    setCustomName,
  } = useCompanionStore();

  useEffect(() => {
    const fetchAndSetCompanion = async () => {
      const user_id = user?.id;
      if (!user_id) {
        console.warn("⛔ No user_id found in auth store");
        return;
      }

      // 🛑 Skip if companion is set
      if (currentCompanion?.companion_id) {
        console.log("⏭️ Skipping sync (companion exists)");
        return;
      }

      // ✅ Step 1: Fetch selected_companion_id from profiles table
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("selected_companion_id")
        .eq("user_id", user_id)
        .single();

      if (profileError || !profile?.selected_companion_id) {
        console.warn(
          "⛔ Missing selected_companion_id in profile:",
          profileError,
        );
        return;
      }

      const companion_id = profile.selected_companion_id;

      // ✅ Step 2: Fetch companion data
      const { data: companion, error: companionError } = await supabase
        .from("companions")
        .select("*")
        .eq("companion_id", companion_id)
        .single();

      if (companionError || !companion) {
        console.error("🛑 Failed to fetch companion:", companionError?.message);
        return;
      }

      console.log("✅ Companion loaded:", companion);
      setCurrentCompanion(companion);

      // ✅ Step 3: Set related state (personality, avatar, intimacy, archetype, name)
      const personality = personalities.find(
        (p) => p.id === companion.personality_id,
      );
      if (personality) {
        setSelectedPersonality(personality);
      }

      if (companion.model_id && companion.avatar_image_url) {
        setSelectedAvatar({
          id: companion.model_id,
          image: companion.avatar_image_url,
        });
      } else {
        console.warn("⚠️ Missing model_id or avatar_image_url", {
          model_id: companion.model_id,
          avatar_image_url: companion.avatar_image_url,
        });
      }

      if (
        companion.verbal_intimacy !== null &&
        companion.physical_intimacy !== null
      ) {
        setSelectedIntimacy({
          verbal: companion.verbal_intimacy,
          physical: companion.physical_intimacy,
        });
      }

      const intimacyArchetype = intimacyArchetypes.find(
        (a) => a.name === companion.intimacy_archetype,
      );
      if (intimacyArchetype) {
        setSelectedIntimacyArchetype(intimacyArchetype);
      }

      if (companion.custom_name) {
        setCustomName(companion.custom_name);
      }
    };

    fetchAndSetCompanion();
  }, [user, currentCompanion]);

  return null;
}
