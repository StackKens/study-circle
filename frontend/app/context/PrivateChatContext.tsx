import { createContext, useContext, useState, useCallback } from "react";
import type { ChatUser } from "../utils/chat";

interface PrivateChatTarget extends ChatUser {
  university?: string;
}

interface PrivateChatContextType {
  openChat: (user: PrivateChatTarget) => void;
  closeChat: () => void;
  target: PrivateChatTarget | null;
  isOpen: boolean;
}

const PrivateChatContext = createContext<PrivateChatContextType | undefined>(
  undefined,
);

export function PrivateChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [target, setTarget] = useState<PrivateChatTarget | null>(null);

  const openChat = useCallback((user: PrivateChatTarget) => {
    setTarget(user);
  }, []);

  const closeChat = useCallback(() => {
    setTarget(null);
  }, []);

  return (
    <PrivateChatContext.Provider
      value={{ openChat, closeChat, target, isOpen: !!target }}
    >
      {children}
    </PrivateChatContext.Provider>
  );
}

export function usePrivateChat() {
  const ctx = useContext(PrivateChatContext);
  if (!ctx)
    throw new Error("usePrivateChat must be used within PrivateChatProvider");
  return ctx;
}
