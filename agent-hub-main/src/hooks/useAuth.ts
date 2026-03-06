import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "editor" | "spectate" | "ajouter" | "modifier" | "suppression";

export interface LocalUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  nickname: string;
  /** JWT renvoyé au login, utilisé pour Authorization: Bearer (optionnel) */
  token?: string;
  /** Only for admin/editor; admin = all true, editor = from backend */
  canCreatePartenariat?: boolean;
  canEditPartenariat?: boolean;
  canDeletePartenariat?: boolean;
}

const STORAGE_KEY = "local_auth_user";
export const AUTH_STORAGE_KEY = STORAGE_KEY;
const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : "http://localhost:4000");

/** These emails are always treated as admin (fallback if role not synced). */
export const ADMIN_EMAILS = ["admin@local", "ilyas@local"];

export function isAdminUser(session: LocalUser | null): boolean {
  if (!session) return false;
  if (session.role === "admin") return true;
  return Boolean(session.email && ADMIN_EMAILS.includes(session.email));
}

/** True if user has at least one permission on partenariats (create, edit or delete). */
export function canEditPartenariats(session: LocalUser | null): boolean {
  if (!session) return false;
  return Boolean(session.canCreatePartenariat || session.canEditPartenariat || session.canDeletePartenariat);
}

interface AuthContextValue {
  session: LocalUser | null;
  loading: boolean;
  signOut: () => void;
  setSession: (user: LocalUser | null) => void;
  isAdmin: boolean;
  canEditPartenariats: boolean;
  canCreatePartenariat: boolean;
  canEditPartenariat: boolean;
  canDeletePartenariat: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function persistSession(user: LocalUser | null) {
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed: LocalUser | null = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw) as LocalUser;
        if (parsed && !parsed.role) (parsed as LocalUser).role = "spectate";
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    if (parsed?.id) {
      // If we already have a role from storage, show it immediately (admin UI works)
      if (parsed.role) {
        setSession(parsed);
        setLoading(false);
      }
      const meHeaders: HeadersInit = { "X-User-Id": parsed.id };
      if (parsed.token) meHeaders["Authorization"] = `Bearer ${parsed.token}`;
      // Refresh session from server (fixes stale or missing role)
      fetch(`${API_BASE}/api/me`, { headers: meHeaders })
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((user) => {
          const role = user.role as LocalUser["role"];
          const full: LocalUser = {
            id: String(user.id),
            email: user.email,
            fullName: user.fullName ?? user.full_name ?? "",
            role,
            nickname: user.nickname ?? user.fullName ?? user.email ?? "",
            token: parsed.token,
            canCreatePartenariat: user.canCreatePartenariat ?? (role === "admin" || role === "editor" || role === "ajouter"),
            canEditPartenariat: user.canEditPartenariat ?? (role === "admin" || role === "editor" || role === "modifier"),
            canDeletePartenariat: user.canDeletePartenariat ?? (role === "admin" || role === "editor" || role === "suppression"),
          };
          setSession(full);
          persistSession(full);
        })
        .catch(() => {
          if (!parsed?.role) {
            setSession(parsed);
            persistSession(parsed);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setSession(parsed);
      setLoading(false);
    }
  }, []);

  const signOut = () => {
    persistSession(null);
    setSession(null);
  };

  const setSessionAndPersist = (user: LocalUser | null) => {
    setSession(user);
    persistSession(user);
  };

  const isAdmin = isAdminUser(session);
  const canEditPartenariatsFlag = canEditPartenariats(session);
  const canCreatePartenariat = Boolean(session?.canCreatePartenariat);
  const canEditPartenariat = Boolean(session?.canEditPartenariat);
  const canDeletePartenariat = Boolean(session?.canDeletePartenariat);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        session,
        loading,
        signOut,
        setSession: setSessionAndPersist,
        isAdmin,
        canEditPartenariats: canEditPartenariatsFlag,
        canCreatePartenariat,
        canEditPartenariat,
        canDeletePartenariat,
      },
    },
    children
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};