import { createContext, useContext, useState } from "react";

type AuthModalType = "login" | "register" | null;

interface AuthContextValue {
  openAuthModal: (type: "login" | "register") => void;
  closeAuthModal: () => void;
  authModalType: AuthModalType;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authModalType, setAuthModalType] = useState<AuthModalType>(null);

  const openAuthModal = (type: "login" | "register") => setAuthModalType(type);
  const closeAuthModal = () => setAuthModalType(null);

  return (
    <AuthContext.Provider
      value={{ openAuthModal, closeAuthModal, authModalType }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuthModal must be used within AuthProvider");
  return context;
}
