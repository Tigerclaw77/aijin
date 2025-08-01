import { create } from "zustand";

const useCompanionStore = create((set) => ({
  currentCompanion: null,

  selectedPersonality: null,
  selectedAvatar: null,
  selectedIntimacy: null,
  selectedIntimacyArchetype: null,

  // Maps to `custom_name` in Supabase
  displayName: "",

  // setCurrentCompanion: (companion) => set({ currentCompanion: companion }),
  setCurrentCompanion: (companion) => {
    console.log(
      "🔥 setCurrentCompanion called:",
      companion?.custom_name,
      companion?.model_id
    );
    set({ currentCompanion: companion });
  },
  setSelectedPersonality: (personality) =>
    set({ selectedPersonality: personality }),
  setSelectedAvatar: (avatar) => set({ selectedAvatar: avatar }),
  setSelectedIntimacy: (intimacy) => set({ selectedIntimacy: intimacy }),
  setSelectedIntimacyArchetype: (archetype) =>
    set({ selectedIntimacyArchetype: archetype }),
  setDisplayName: (value) => set({ displayName: value }),
}));

export default useCompanionStore;
