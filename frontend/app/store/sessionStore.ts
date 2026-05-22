import { create } from "zustand";
import type { Session } from "../types/session";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

interface SessionStore {
  sessions: Session[];
  isLoading: boolean;
  fetchSessions: (token: string) => Promise<void>;
  addSession: (session: Session) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  isLoading: false,

  fetchSessions: async (token) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) set({ sessions: data });
    } catch (err) {
      console.error("fetchSessions error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),
}));
