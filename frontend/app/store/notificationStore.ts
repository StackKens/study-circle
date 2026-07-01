import { create } from "zustand";

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  dmUnreadCount: number;
  setDmUnreadCount: (count: number) => void;
  incrementDmUnread: () => void;
  resetDmUnread: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnread: () => set((s) => ({ unreadCount: s.unreadCount + 1 })),
  dmUnreadCount: 0,
  setDmUnreadCount: (count) => set({ dmUnreadCount: count }),
  incrementDmUnread: () => set((s) => ({ dmUnreadCount: s.dmUnreadCount + 1 })),
  resetDmUnread: () => set({ dmUnreadCount: 0 }),
}));
