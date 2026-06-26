import { create } from "zustand";
import type { Resource } from "../types/resource";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

interface ResourceStore {
  resources: Resource[];
  isLoading: boolean;
  fetchResources: (token: string) => Promise<void>;
  addResource: (resource: Resource) => void;
  incrementDownload: (id: string) => void;
}

export const useResourceStore = create<ResourceStore>((set) => ({
  resources: [],
  isLoading: false,

  fetchResources: async (token) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/resources/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) set({ resources: data });
    } catch (err) {
      console.error("fetchResources error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addResource: (resource) =>
    set((state) => ({ resources: [resource, ...state.resources] })),

  incrementDownload: (id) =>
    set((state) => ({
      resources: state.resources.map((r) =>
        r.id === id ? { ...r, downloads: r.downloads + 1 } : r
      ),
    })),
}));
