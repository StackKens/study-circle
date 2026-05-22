import { createContext, useContext, useState } from "react";

type AuthModalType = "login" | "register" | null;

interface AuthModalContextValue {
  openAuthModal: (type: "login" | "register") => void;
  closeAuthModal: () => void;
  authModalType: AuthModalType;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(
  undefined,
);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [authModalType, setAuthModalType] = useState<AuthModalType>(null);
  const openAuthModal = (type: "login" | "register") => setAuthModalType(type);
  const closeAuthModal = () => setAuthModalType(null);
  return (
    <AuthModalContext.Provider
      value={{ openAuthModal, closeAuthModal, authModalType }}
    >
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx)
    throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
