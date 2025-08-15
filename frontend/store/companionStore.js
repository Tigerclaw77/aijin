import { create } from "zustand";

const useCompanionStore = create((set, get) => ({
  // ===== State =====
  currentCompanion: null,                 // full companion row/object

  // Creation/UI selections
  selectedAvatar: null,                   // { id, image, name }
  selectedPersonality: null,              // personality object
  selectedIntimacy: { verbal: 1, physical: 1 },
  selectedIntimacyArchetype: null,        // archetype object
  customName: "",
  displayName: "",

  // ===== Actions =====

  /**
   * Strict setter for currentCompanion.
   * Only accepts payloads that include a real companion_id.
   * Prevents late partial updates (e.g., { model_id: "rika_hostess" }) from
   * overwriting a good companion (like preview/loaded one).
   */
  setCurrentCompanion: (payload) =>
    set((state) => {
      const next = payload || null;

      // Initial set: require companion_id
      if (!state.currentCompanion) {
        if (next?.companion_id) return { currentCompanion: next };
        console.warn(
          "🛡️ Ignored setCurrentCompanion without companion_id (initial):",
          next
        );
        return {};
      }

      // Update: also require companion_id
      if (!next?.companion_id) {
        console.warn(
          "🛡️ Ignored setCurrentCompanion without companion_id (update):",
          next
        );
        return {};
      }

      return { currentCompanion: next };
    }),

  /**
   * Explicitly clear the current companion (bypasses the guard).
   * Use sparingly (e.g., on logout).
   */
  resetCurrentCompanion: () => set({ currentCompanion: null }),

  /**
   * Safe merge into the existing currentCompanion.
   * Requires an existing companion with a companion_id.
   * If patch includes a different companion_id, it’s ignored.
   */
  mergeCurrentCompanion: (patch) =>
    set((state) => {
      const cur = state.currentCompanion;
      if (!cur?.companion_id) {
        console.warn(
          "🛡️ mergeCurrentCompanion ignored (no current companion to merge into).",
          patch
        );
        return {};
      }
      if (patch?.companion_id && patch.companion_id !== cur.companion_id) {
        console.warn(
          "🛡️ mergeCurrentCompanion ignored (companion_id mismatch).",
          { current: cur.companion_id, patch: patch.companion_id }
        );
        return {};
      }
      return { currentCompanion: { ...cur, ...(patch || {}) } };
    }),

  // ---- Creation / selection setters ----
  setSelectedAvatar: (avatar) => set({ selectedAvatar: avatar ?? null }),
  setSelectedPersonality: (p) => set({ selectedPersonality: p ?? null }),
  setSelectedIntimacy: (v) =>
    set({ selectedIntimacy: v ?? { verbal: 1, physical: 1 } }),
  setSelectedIntimacyArchetype: (a) =>
    set({ selectedIntimacyArchetype: a ?? null }),
  setCustomName: (name) => set({ customName: name ?? "" }),
  setDisplayName: (name) => set({ displayName: name ?? "" }),

  /**
   * Reset all creation selections (does not touch currentCompanion).
   */
  resetCreation: () =>
    set({
      selectedAvatar: null,
      selectedPersonality: null,
      selectedIntimacy: { verbal: 1, physical: 1 },
      selectedIntimacyArchetype: null,
      customName: "",
      displayName: "",
    }),
}));

export default useCompanionStore;
