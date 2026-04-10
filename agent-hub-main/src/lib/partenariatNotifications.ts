import type { Partenariat } from "@/hooks/usePartenariats";

const STORAGE_PREFIX = "cnss_boite_notif_v1";

/** Jours : partenariat considéré comme récemment créé ou modifié */
const RECENT_MS = 14 * 24 * 60 * 60 * 1000;
/** Fenêtre « fin proche » (jours à partir d’aujourd’hui) */
export const FIN_PROCHE_JOURS = 60;
/** Écart mini création → MAJ pour compter comme « modifié » (évite le bruit à la création) */
const MAJ_MIN_ECART_MS = 120_000;

export type BoiteNotificationType = "fin_proche" | "mis_a_jour" | "nouveau";

export interface BoiteNotificationItem {
  key: string;
  type: BoiteNotificationType;
  partenariat: Partenariat;
  detail: string;
}

function ackStorageKey(userId: string) {
  return `${STORAGE_PREFIX}_ack_${userId}`;
}

export function readAckMap(userId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(ackStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}

export function writeAckMap(userId: string, map: Record<string, string>) {
  localStorage.setItem(ackStorageKey(userId), JSON.stringify(map));
}

export function acknowledgeAllUpdates(userId: string, partenariats: Partenariat[]) {
  const ack = readAckMap(userId);
  for (const p of partenariats) {
    ack[p.id] = p.updated_at;
  }
  writeAckMap(userId, ack);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseIso(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function buildBoiteNotifications(
  partenariats: Partenariat[],
  ack: Record<string, string>,
): BoiteNotificationItem[] {
  const now = Date.now();
  const today = startOfDay(new Date());
  const limitEnd = new Date(today);
  limitEnd.setDate(limitEnd.getDate() + FIN_PROCHE_JOURS);

  const items: BoiteNotificationItem[] = [];

  for (const p of partenariats) {
    const end = parseIso(p.date_fin);
    if (end && p.statut !== "echu") {
      const endDay = startOfDay(end);
      if (endDay >= today && endDay <= limitEnd) {
        const days = Math.ceil((endDay.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
        items.push({
          key: `fin-${p.id}`,
          type: "fin_proche",
          partenariat: p,
          detail:
            days <= 0
              ? "Date de fin : aujourd'hui"
              : `Date de fin dans ${days} jour${days > 1 ? "s" : ""}`,
        });
      }
    }

    const created = parseIso(p.created_at);
    const updated = parseIso(p.updated_at);
    if (!updated) continue;

    const unseen = ack[p.id] !== p.updated_at;
    if (!unseen) continue;

    const recentWindow = now - updated.getTime() < RECENT_MS;
    if (!recentWindow) continue;

    const createdMs = created?.getTime() ?? 0;
    const isNouveau =
      created != null && updated.getTime() - createdMs < MAJ_MIN_ECART_MS;
    const isMaj = created != null && updated.getTime() - createdMs >= MAJ_MIN_ECART_MS;

    if (isNouveau) {
      items.push({
        key: `nouveau-${p.id}`,
        type: "nouveau",
        partenariat: p,
        detail: "Nouveau partenariat enregistré",
      });
    } else if (isMaj) {
      items.push({
        key: `maj-${p.id}`,
        type: "mis_a_jour",
        partenariat: p,
        detail: "Informations récemment mises à jour",
      });
    }
  }

  return items.sort((a, b) => {
    if (a.type === "fin_proche" && b.type !== "fin_proche") return -1;
    if (a.type !== "fin_proche" && b.type === "fin_proche") return 1;
    const ua = parseIso(a.partenariat.updated_at)?.getTime() ?? 0;
    const ub = parseIso(b.partenariat.updated_at)?.getTime() ?? 0;
    return ub - ua;
  });
}
