import { create } from "zustand";
import type { Session } from "../types/session";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

let pendingFetch: Promise<void> | null = null;
let pendingFetchMore: Promise<void> | null = null;

interface SessionStore {
  sessions: Session[];
  isLoading: boolean;
  page: number;
  hasMore: boolean;
  fetchSessions: (token: string) => Promise<void>;
  fetchMoreSessions: (token: string) => Promise<void>;
  addSession: (session: Session) => void;
  updateParticipantCount: (sessionId: string, count: number) => void;
  markSessionJoined: (sessionId: string, count: number) => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  isLoading: false,
  page: 1,
  hasMore: false,

  fetchSessions: async (token) => {
    if (pendingFetch) return pendingFetch;
    set({ isLoading: true, page: 1 });
    pendingFetch = (async () => {
      try {
        const res = await fetch(`${API_URL}/sessions?page=1&limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) set({ sessions: json.data, hasMore: json.page * json.limit < json.total });
      } catch (err) {
        console.error("fetchSessions error:", err);
      } finally {
        pendingFetch = null;
        set({ isLoading: false });
      }
    })();
    return pendingFetch;
  },

  fetchMoreSessions: async (token) => {
    if (pendingFetchMore) return pendingFetchMore;
    const currentPage = get().page;
    const nextPage = currentPage + 1;
    set({ isLoading: true });
    pendingFetchMore = (async () => {
      try {
        const res = await fetch(`${API_URL}/sessions?page=${nextPage}&limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) {
          set({
            sessions: [...get().sessions, ...json.data],
            page: nextPage,
            hasMore: json.page * json.limit < json.total,
          });
        }
      } catch (err) {
        console.error("fetchMoreSessions error:", err);
      } finally {
        pendingFetchMore = null;
        set({ isLoading: false });
      }
    })();
    return pendingFetchMore;
  },

  addSession: (session) =>
    set((state) => ({ sessions: [session, ...state.sessions] })),

  updateParticipantCount: (sessionId, count) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? { ...s, participant_count: count } : s
      ),
    })),

  markSessionJoined: (sessionId, count) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, participant_count: count, has_joined: true }
          : s,
      ),
    })),
}));
