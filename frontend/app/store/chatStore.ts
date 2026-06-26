import { create } from "zustand";

interface ChatStore {
  generalMessageCount: number;
  setGeneralMessageCount: (count: number) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  generalMessageCount: 0,
  setGeneralMessageCount: (count) => set({ generalMessageCount: count }),
}));
