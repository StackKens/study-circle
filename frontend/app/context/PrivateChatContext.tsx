import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useNotificationStore } from "../store/notificationStore";
import type { ChatUser } from "../utils/chat";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8080";

export interface PrivateMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  mentions?: string[];
  created_at: string;
  sender_name: string;
  sender_university?: string;
  sender_avatar_url?: string | null;
}

interface PrivateChatTarget extends ChatUser {
  university?: string;
}

interface PrivateChatContextType {
  openChat: (user: PrivateChatTarget) => void;
  closeChat: () => void;
  target: PrivateChatTarget | null;
  isOpen: boolean;
  messages: PrivateMessage[];
  status: "connecting" | "connected" | "error";
  sendMessage: (content: string, mentions: string[]) => void;
}

const PrivateChatContext = createContext<PrivateChatContextType | undefined>(
  undefined,
);

export function PrivateChatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuth();
  const [target, setTarget] = useState<PrivateChatTarget | null>(null);
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const socketRef = useRef<Socket | null>(null);
  const targetRef = useRef<PrivateChatTarget | null>(null);

  targetRef.current = target;

  useEffect(() => {
    if (!token || !user) return;

    setStatus("connecting");

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
      if (targetRef.current) {
        socket.emit("join_dm", { recipient_id: targetRef.current.id });
      }
    });

    socket.on("connect_error", () => setStatus("error"));
    socket.on("disconnect", () => setStatus("connecting"));

    socket.on("private_message_history", (history: PrivateMessage[]) => {
      setMessages(history);
    });

    socket.on("receive_private_message", (msg: PrivateMessage) => {
      const isForActiveChat =
        targetRef.current &&
        (msg.sender_id === targetRef.current.id ||
          msg.recipient_id === targetRef.current.id ||
          msg.sender_id === user.id);

      if (isForActiveChat) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      } else if (msg.sender_id !== user.id) {
        useNotificationStore.getState().incrementDmUnread();
      }
    });

    socket.on("notification", () => {
      useNotificationStore.getState().incrementUnread();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id]);

  const openChat = useCallback((chatUser: PrivateChatTarget) => {
    setTarget(chatUser);
    setMessages([]);
    useNotificationStore.getState().resetDmUnread();
    if (socketRef.current?.connected) {
      socketRef.current.emit("join_dm", { recipient_id: chatUser.id });
    }
  }, []);

  const closeChat = useCallback(() => {
    setTarget(null);
  }, []);

  const sendMessage = useCallback((content: string, mentions: string[]) => {
    if (!socketRef.current?.connected || !targetRef.current) return;
    socketRef.current.emit("send_private_message", {
      recipient_id: targetRef.current.id,
      content,
      mentions,
    });
  }, []);

  return (
    <PrivateChatContext.Provider
      value={{
        openChat,
        closeChat,
        target,
        isOpen: !!target,
        messages,
        status,
        sendMessage,
      }}
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
