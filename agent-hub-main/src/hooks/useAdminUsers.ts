import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AUTH_STORAGE_KEY } from "@/hooks/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : "http://localhost:4000");

function getStoredToken(): string | undefined {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return undefined;
    const p = JSON.parse(raw) as { token?: string };
    return p?.token;
  } catch {
    return undefined;
  }
}

export type UserRole = "admin" | "editor" | "spectate" | "ajouter" | "modifier" | "suppression";
export type UserStatus = "pending" | "approved" | "rejected";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  nickname: string;
  companyName?: string | null;
  status?: UserStatus;
  /** Last login timestamp (from user_logs), null if never logged in */
  lastLogin?: string | null;
  /** Account creation timestamp */
  createdAt?: string | null;
}

function getHeaders(userId: string | undefined, userEmail?: string): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  const token = getStoredToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  if (userId) h["X-User-Id"] = String(userId);
  if (userEmail) h["X-User-Email"] = userEmail;
  return h;
}

export function useUsersList(userId: string | undefined, userEmail?: string) {
  return useQuery({
    queryKey: ["admin", "users", userId, userEmail],
    queryFn: async () => {
      if (!userId && !userEmail) throw new Error("Non connecté");
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: getHeaders(userId, userEmail),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { message?: string }).message ?? "Erreur chargement utilisateurs");
      }
      return res.json() as Promise<AdminUser[]>;
    },
    enabled: !!(userId || userEmail),
  });
}

/** Liste des noms d'entreprises (pour affecter un partenariat à une entreprise). Réservé admin. */
export function useCompanies(userId: string | undefined, userEmail?: string, enabled = true) {
  return useQuery({
    queryKey: ["admin", "companies", userId, userEmail],
    queryFn: async () => {
      if (!userId && !userEmail) throw new Error("Non connecté");
      const res = await fetch(`${API_BASE_URL}/api/companies`, {
        headers: getHeaders(userId, userEmail),
      });
      if (!res.ok) throw new Error("Erreur chargement des entreprises");
      return res.json() as Promise<string[]>;
    },
    enabled: !!(userId || userEmail) && enabled,
  });
}

export function usePendingUsers(userId: string | undefined, userEmail?: string) {
  return useQuery({
    queryKey: ["admin", "users", "pending", userId, userEmail],
    queryFn: async () => {
      if (!userId && !userEmail) throw new Error("Non connecté");
      const res = await fetch(`${API_BASE_URL}/api/users/pending`, {
        headers: getHeaders(userId, userEmail),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { message?: string }).message ?? "Erreur chargement demandes");
      }
      return res.json() as Promise<AdminUser[]>;
    },
    enabled: !!(userId || userEmail),
  });
}

export function useUpdateUser(userId: string | undefined, userEmail?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      role,
      nickname,
    }: {
      id: string;
      status?: UserStatus;
      role?: UserRole;
      nickname?: string;
    }) => {
      if (!userId && !userEmail) throw new Error("Non connecté");
      const body: Record<string, string> = {};
      if (status !== undefined) body.status = status;
      if (role !== undefined) body.role = role;
      if (nickname !== undefined) body.nickname = nickname;
      const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: "PATCH",
        headers: getHeaders(userId, userEmail),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message ?? "Erreur");
      return data as AdminUser;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useCreateUser(userId: string | undefined, userEmail?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email: string;
      password: string;
      fullName: string;
      companyName: string;
      role?: UserRole;
      nickname?: string;
      /** IDs des partenariats à affecter à l'entreprise du nouvel utilisateur */
      partenariatIds?: string[];
    }) => {
      if (!userId && !userEmail) throw new Error("Non connecté");
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: getHeaders(userId, userEmail),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message ?? "Erreur");
      return data as AdminUser;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["partenariats"] });
    },
  });
}

/** Affecter des partenariats à l'entreprise d'un utilisateur existant (admin). */
export function useSetUserPartenariats(userId: string | undefined, userEmail?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId: targetUserId, partenariatIds }: { userId: string; partenariatIds: string[] }) => {
      if (!userId && !userEmail) throw new Error("Non connecté");
      const res = await fetch(`${API_BASE_URL}/api/users/${targetUserId}/partenariats`, {
        method: "PUT",
        headers: getHeaders(userId, userEmail),
        body: JSON.stringify({ partenariatIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message ?? "Erreur");
      return data as { ok: boolean; count: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["partenariats"] });
    },
  });
}

export interface UserLog {
  id: string;
  userId: string;
  action: string;
  details: string | null;
  createdAt: string;
  userEmail: string | null;
  userNickname: string | null;
}

export function useLogs(userId: string | undefined, userEmail?: string) {
  return useQuery({
    queryKey: ["admin", "logs", userId, userEmail],
    queryFn: async () => {
      if (!userId && !userEmail) throw new Error("Non connecté");
      const res = await fetch(`${API_BASE_URL}/api/logs`, {
        headers: getHeaders(userId, userEmail),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { message?: string }).message ?? "Erreur chargement des logs");
      }
      return res.json() as Promise<UserLog[]>;
    },
    enabled: !!(userId || userEmail),
  });
}
