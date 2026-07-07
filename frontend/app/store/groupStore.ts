import { create } from "zustand";
import type { Group } from "../types/group";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

let pendingFetch: Promise<void> | null = null;
let pendingFetchMore: Promise<void> | null = null;

interface GroupStore {
  groups: Group[];
  isLoading: boolean;
  page: number;
  hasMore: boolean;
  fetchGroups: (token: string) => Promise<void>;
  fetchMoreGroups: (token: string) => Promise<void>;
  addGroup: (group: Group) => void;
}

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  isLoading: false,
  page: 1,
  hasMore: false,

  fetchGroups: async (token) => {
    if (pendingFetch) return pendingFetch;
    set({ isLoading: true, page: 1 });
    pendingFetch = (async () => {
      try {
        const res = await fetch(`${API_URL}/groups?page=1&limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) set({ groups: json.data, hasMore: json.page * json.limit < json.total });
      } catch (err) {
        console.error("fetchGroups error:", err);
      } finally {
        pendingFetch = null;
        set({ isLoading: false });
      }
    })();
    return pendingFetch;
  },

  fetchMoreGroups: async (token) => {
    if (pendingFetchMore) return pendingFetchMore;
    const currentPage = get().page;
    const nextPage = currentPage + 1;
    set({ isLoading: true });
    pendingFetchMore = (async () => {
      try {
        const res = await fetch(`${API_URL}/groups?page=${nextPage}&limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) {
          set({
            groups: [...get().groups, ...json.data],
            page: nextPage,
            hasMore: json.page * json.limit < json.total,
          });
        }
      } catch (err) {
        console.error("fetchMoreGroups error:", err);
      } finally {
        pendingFetchMore = null;
        set({ isLoading: false });
      }
    })();
    return pendingFetchMore;
  },

  addGroup: (group) =>
    set((state) => ({ groups: [group, ...state.groups] })),
}));
