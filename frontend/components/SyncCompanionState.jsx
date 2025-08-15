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
    setSelectedIntimacy,
    setSelectedIntimacyArchetype,
    setCustomName,
  } = useCompanionStore();

  useEffect(() => {
    // Only run after we have a user id, and only once (don’t re-run if already set)
    if (!user?.id) return;
    if (currentCompanion?.companion_id) return;

    (async () => {
      // Pull selected_companion_id from profiles (key is `id`)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("selected_companion_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.warn("Profile fetch error:", profileError.message);
      }

      // No selection → seed preview Rika and stop (no DB writes, no avatar/model to avoid syncers)
      if (!profile?.selected_companion_id) {
  console.info("Seeding Rika preview...");

  const p =
    (Array.isArray(personalities) &&
      (personalities.find((x) => x.id === "rika_hostess_personality") ||
        personalities.find((x) =>
          /rika/i.test((x?.name || x?.nickname || ""))
        ) ||
        personalities[0])) ||
    null;

  const arch =
    (Array.isArray(intimacyArchetypes) && intimacyArchetypes[0]) || null;

  // Seed ONLY the companion object (no avatar/model fields to avoid syncers)
  setCurrentCompanion({
    companion_id: "HOSTESS_RIKA_ID",
    name: "Rika",
    avatar_image_url: null,            // avoid 404
    personality_id: p?.id ?? null,
    verbal_intimacy: 1,
    physical_intimacy: 1,
    intimacy_archetype: arch?.name ?? null,
    custom_name: null,
  });

  // Call optional UI setters ONLY if they exist in this build
  if (p && typeof setSelectedPersonality === "function") {
    setSelectedPersonality(p);
  }
  if (typeof setSelectedIntimacy === "function") {
    setSelectedIntimacy({ verbal: 1, physical: 1 });
  }
  if (arch && typeof setSelectedIntimacyArchetype === "function") {
    setSelectedIntimacyArchetype(arch);
  }
  if (typeof setCustomName === "function") {
    setCustomName(null);
  }

  return;
}


      // Otherwise load the actual companion
      const { data: companion, error: companionError } = await supabase
        .from("companions")
        .select("*")
        .eq("companion_id", profile.selected_companion_id)
        .single();

      if (companionError || !companion) {
        console.error("Failed to fetch companion:", companionError?.message);
        return;
      }

      setCurrentCompanion(companion);

      // Optionally wire personality/intimacy UI here (unchanged from your working path)
      const pReal =
        Array.isArray(personalities) &&
        personalities.find((x) => x.id === companion.personality_id);
      if (pReal) setSelectedPersonality(pReal);

      if (
        companion.verbal_intimacy !== null &&
        companion.physical_intimacy !== null
      ) {
        setSelectedIntimacy({
          verbal: companion.verbal_intimacy,
          physical: companion.physical_intimacy,
        });
      }

      const archReal =
        Array.isArray(intimacyArchetypes) &&
        intimacyArchetypes.find((a) => a.name === companion.intimacy_archetype);
      if (archReal) setSelectedIntimacyArchetype(archReal);

      if (companion.custom_name) setCustomName(companion.custom_name);
    })();
  }, [user?.id, currentCompanion?.companion_id, setCurrentCompanion, setSelectedPersonality, setSelectedIntimacy, setSelectedIntimacyArchetype, setCustomName]);

  return null;
}
