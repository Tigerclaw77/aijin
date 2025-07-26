import { create } from "zustand";

const useCompanionStore = create((set) => ({
  companionId: null,
  setCompanionId: (id) => set({ companionId: id }),

  currentCompanion: null,
  setCurrentCompanion: (companion) => set({ currentCompanion: companion }),

  selectedAvatar: null,
  setSelectedAvatar: (avatar) => set({ selectedAvatar: avatar }),

  selectedPersonality: null,
  setSelectedPersonality: (personality) => set({ selectedPersonality: personality }),

  selectedIntimacy: { verbal: null, sexual: null },
  setSelectedIntimacy: (intimacy) =>
    set((state) => ({
      selectedIntimacy: { ...state.selectedIntimacy, ...intimacy },
    })),

  selectedIntimacyArchetype: null,
  setSelectedIntimacyArchetype: (archetype) => set({ selectedIntimacyArchetype: archetype }),

  customName: "",
  setCustomName: (name) => set({ customName: name }),

  resetCompanion: () =>
    set({
      companionId: null,
      currentCompanion: null,
      selectedAvatar: null,
      selectedPersonality: null,
      selectedIntimacy: { verbal: null, sexual: null },
      selectedIntimacyArchetype: null,
      customName: "",
    }),
}));

export default useCompanionStore;
