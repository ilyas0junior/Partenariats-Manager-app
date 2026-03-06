import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AUTH_STORAGE_KEY } from "@/hooks/useAuth";

export interface Partenariat {
  id: string;
  titre: string;
  type_partenariat: string;
  nature: string;
  domaine: string;
  entite_cnss: string;
  entite_concernee: string | null;
  partenaire: string;
  date_debut: string | null;
  date_fin: string | null;
  date_prise_effet: string | null;
  statut: string;
  description: string | null;
  company_name: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

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

function getAuthHeaders(userId?: string) {
  const h: Record<string, string> = {};
  const token = getStoredToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  if (userId) h["X-User-Id"] = String(userId);
  return h;
}

export const TYPES_PARTENARIAT = [
  { value: "convention", label: "Convention" },
  { value: "convention_cadre", label: "Convention Cadre" },
  { value: "protocole_accord", label: "Protocole d'accord" },
  { value: "avenant", label: "Avenant" },
  { value: "academique", label: "Académique" },
  { value: "strategique", label: "Stratégique" },
  { value: "entreprise_privee", label: "Entreprise Privée" },
  { value: "internationale", label: "Internationale" },
  { value: "semi_public", label: "Semi Public" },
];

export const NATURES = [
  { value: "public", label: "Public" },
  { value: "prive", label: "Privé" },
  { value: "mixte", label: "Mixte" },
];

export const DOMAINES = [
  { value: "sante", label: "Santé" },
  { value: "social", label: "Social" },
  { value: "education", label: "Éducation" },
  { value: "technologie", label: "Technologie" },
  { value: "finance", label: "Finance" },
  { value: "autre", label: "Autre" },
];

export const ENTITES_CNSS = [
  { value: "entite_centrale", label: "Entité Centrale" },
  { value: "dr", label: "DR (Direction Régionale)" },
  { value: "pum", label: "PUM" },
  { value: "clinique", label: "Clinique" },
  { value: "polyclinique", label: "Polyclinique" },
];

export const STATUTS = [
  { value: "operationnel", label: "Opérationnel" },
  { value: "non_operationnel", label: "Non opérationnel" },
  { value: "echu", label: "Échu" },
  { value: "a_renouveler", label: "À renouveler" },
  { value: "en_cours", label: "En cours" },
];

export const usePartenariats = (userId?: string) => {
  return useQuery({
    queryKey: ["partenariats", userId || null],
    enabled: Boolean(userId),
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/partenariats`, {
        headers: getAuthHeaders(userId),
      });
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des partenariats.");
      }
      const data = await response.json();
      return data as Partenariat[];
    },
  });
};

export const useCreatePartenariat = (userId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<Partenariat, "id" | "created_at" | "updated_at" | "created_by">) => {
      const response = await fetch(`${API_BASE_URL}/api/partenariats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(userId),
        },
        body: JSON.stringify(p),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la création du partenariat.");
      }
      const data = await response.json();
      return data as Partenariat;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partenariats"] }),
  });
};

export const useUpdatePartenariat = (userId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...p }: Partial<Partenariat> & { id: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/partenariats/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(userId),
        },
        body: JSON.stringify(p),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du partenariat.");
      }
      const data = await response.json();
      return data as Partenariat;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partenariats"] }),
  });
};

export const useDeletePartenariat = (userId?: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/partenariats/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(userId),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du partenariat.");
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partenariats"] }),
  });
};
