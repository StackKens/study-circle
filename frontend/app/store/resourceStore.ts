import { create } from "zustand";
import type { Resource } from "../types/resource";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

let pendingFetch: Promise<void> | null = null;
let pendingFetchMore: Promise<void> | null = null;

interface ResourceStore {
  resources: Resource[];
  isLoading: boolean;
  page: number;
  hasMore: boolean;
  fetchResources: (token: string) => Promise<void>;
  fetchMoreResources: (token: string) => Promise<void>;
  addResource: (resource: Resource) => void;
  incrementDownload: (id: string) => void;
}

export const useResourceStore = create<ResourceStore>((set, get) => ({
  resources: [],
  isLoading: false,
  page: 1,
  hasMore: false,

  fetchResources: async (token) => {
    if (pendingFetch) return pendingFetch;
    set({ isLoading: true, page: 1 });
    pendingFetch = (async () => {
      try {
        const res = await fetch(`${API_URL}/resources/all?page=1&limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) set({ resources: json.data, hasMore: json.page * json.limit < json.total });
      } catch (err) {
        console.error("fetchResources error:", err);
      } finally {
        pendingFetch = null;
        set({ isLoading: false });
      }
    })();
    return pendingFetch;
  },

  fetchMoreResources: async (token) => {
    if (pendingFetchMore) return pendingFetchMore;
    const currentPage = get().page;
    const nextPage = currentPage + 1;
    set({ isLoading: true });
    pendingFetchMore = (async () => {
      try {
        const res = await fetch(`${API_URL}/resources/all?page=${nextPage}&limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) {
          set({
            resources: [...get().resources, ...json.data],
            page: nextPage,
            hasMore: json.page * json.limit < json.total,
          });
        }
      } catch (err) {
        console.error("fetchMoreResources error:", err);
      } finally {
        pendingFetchMore = null;
        set({ isLoading: false });
      }
    })();
    return pendingFetchMore;
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
