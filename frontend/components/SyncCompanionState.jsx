'use client';

import { useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import useAuthStore from "../store/authStore";
import useCompanionStore from "../store/companionStore";
import personalities from "../data/personalities"; // Adjust if needed
import { intimacyArchetypes } from "../data/intimacy"; // Adjust if needed

export default function SyncCompanionState() {
  const { user } = useAuthStore();
  const {
    setCurrentCompanion,
    setSelectedPersonality,
    setSelectedAvatar,
    setSelectedIntimacy,
    setSelectedIntimacyArchetype,
    setCustomName,
  } = useCompanionStore();

  useEffect(() => {
    async function fetchAndSetCompanion() {
      const companionId = user?.profile?.selected_companion_id;
      if (!companionId) return;

      const { data, error } = await supabase
        .from("companions")
        .select("*")
        .eq("id", companionId)
        .single();

      if (error || !data) {
        console.error("🛑 Error fetching companion:", error?.message);
        return;
      }

      console.log("✅ Companion loaded from Supabase:", data);
      setCurrentCompanion(data);

      // Also populate selected personality from static list
      const personality = personalities.find((p) => p.id === data.personality_id);
      const intimacyArchetype = intimacyArchetypes.find(
        (a) => a.name === data.intimacy_archetype
      );

      // These will be used by ChatBox
      if (personality) {
        setSelectedPersonality(personality);
      }

      if (data.model_id && data.avatar_image_url) {
        setSelectedAvatar({ id: data.model_id, image: data.avatar_image_url });
      }

      if (data.verbal_intimacy !== null && data.sexual_intimacy !== null) {
        setSelectedIntimacy({
          verbal: data.verbal_intimacy,
          sexual: data.sexual_intimacy,
        });
      }

      if (intimacyArchetype) {
        setSelectedIntimacyArchetype(intimacyArchetype);
      }

      if (data.name) {
        setCustomName(data.name);
      }

      console.log("🌟 Zustand store hydrated for ChatBox.");
    }

    fetchAndSetCompanion();
  }, [user]);

  return null;
}
