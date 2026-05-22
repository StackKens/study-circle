import { create } from "zustand";
import type { Group } from "../types/group";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface GroupStore {
  groups: Group[];
  isLoading: boolean;
  fetchGroups: (token: string) => Promise<void>;
  addGroup: (group: Group) => void;
}

export const useGroupStore = create<GroupStore>((set) => ({
  groups: [],
  isLoading: false,

  fetchGroups: async (token) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/groups`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) set({ groups: data });
    } catch (err) {
      console.error("fetchGroups error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addGroup: (group) =>
    set((state) => ({ groups: [group, ...state.groups] })),
}));
