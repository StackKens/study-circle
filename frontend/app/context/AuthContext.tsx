import { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  course: string;
  year_of_study: number;
  created_at: string;
  avatar_url?: string;
  is_email_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
  verifyEmail: (token: string) => Promise<void>;
  resendVerification: (email: string) => Promise<any>;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  university: string;
  course: string;
  year_of_study: number;
  role?: "student" | "instructor";
  bio?: string;
  department?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      fetchMe(storedToken)
        .then((userData) => {
          if (userData) setUser(userData);
          setIsLoading(false);
        })
        .catch(() => {
          localStorage.removeItem("auth_token");
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchMe(token: string): Promise<User | null> {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return null;
    }
  }

  async function login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function register(registerData: RegisterData) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registerData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    localStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function verifyEmail(emailToken: string) {
    const res = await fetch(`${API_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: emailToken }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Verification failed");
    }
    // Refresh user data to get updated is_email_verified
    const currentToken = token || localStorage.getItem("auth_token");
    if (currentToken) {
      const userData = await fetchMe(currentToken);
      if (userData) {
        setUser(userData);
        setToken(currentToken);
      }
    }
  }

  async function resendVerification(email: string) {
    const res = await fetch(`${API_URL}/auth/verify/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to resend verification");
    }
    return data;
  }

  function updateUser(updated: Partial<User>) {
    setUser((prev) => (prev ? { ...prev, ...updated } : prev));
  }

  function logout() {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        verifyEmail,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
