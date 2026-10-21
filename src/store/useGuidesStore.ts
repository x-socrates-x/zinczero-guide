import { create } from "zustand";
import { Guide } from "../types/guide";
import { loadGuides, saveGuides } from "../utils/storage";

type GuidesState = {
  guides: Guide[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addGuide: (guide: Guide) => Promise<void>;
  updateGuide: (guide: Guide) => Promise<void>;
  deleteGuide: (id: string) => Promise<void>;
};

export const useGuidesStore = create<GuidesState>((set, get) => ({
  guides: [],
  hydrated: false,

  hydrate: async () => {
    const guides = await loadGuides();
    set({ guides, hydrated: true });
  },

  addGuide: async (guide) => {
    const guides = [guide, ...get().guides];
    set({ guides });
    await saveGuides(guides);
  },

  updateGuide: async (guide) => {
    const guides = get().guides.map((g) => (g.id === guide.id ? guide : g));
    set({ guides });
    await saveGuides(guides);
  },

  deleteGuide: async (id) => {
    const guides = get().guides.filter((g) => g.id !== id);
    set({ guides });
    await saveGuides(guides);
  },
}));