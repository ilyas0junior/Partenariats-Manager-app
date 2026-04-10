import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarClock, Sparkles, PencilLine } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePartenariats } from "@/hooks/usePartenariats";
import type { Partenariat } from "@/hooks/usePartenariats";
import {
  buildBoiteNotifications,
  readAckMap,
  acknowledgeAllUpdates,
  type BoiteNotificationItem,
} from "@/lib/partenariatNotifications";

interface BoiteNotificationsProps {
  /** Utilisateur connecté : la liste et les accusés de lecture sont propres à chaque compte */
  userId?: string | null;
}

function typeMeta(type: BoiteNotificationItem["type"]) {
  switch (type) {
    case "fin_proche":
      return {
        label: "Échéance",
        Icon: CalendarClock,
        className: "text-amber-600 dark:text-amber-500",
        bg: "bg-amber-500/15",
      };
    case "nouveau":
      return {
        label: "Nouveau",
        Icon: Sparkles,
        className: "text-success",
        bg: "bg-success/15",
      };
    case "mis_a_jour":
    default:
      return {
        label: "Mise à jour",
        Icon: PencilLine,
        className: "text-primary",
        bg: "bg-primary/10",
      };
  }
}

const BoiteNotifications = ({ userId }: BoiteNotificationsProps) => {
  const navigate = useNavigate();
  const { data: partenariats = [], isLoading } = usePartenariats(userId ?? undefined);
  const [open, setOpen] = useState(false);
  const [ackTick, setAckTick] = useState(0);

  const ackMap = useMemo(
    () => (userId ? readAckMap(userId) : {}),
    [userId, ackTick],
  );

  const items = useMemo(
    () => buildBoiteNotifications(partenariats, ackMap),
    [partenariats, ackMap],
  );

  const count = items.length;

  const ackIfPossible = useCallback(() => {
    if (userId) {
      acknowledgeAllUpdates(userId, partenariats);
      setAckTick((t) => t + 1);
    }
  }, [userId, partenariats]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (!next) ackIfPossible();
    },
    [ackIfPossible],
  );

  const handleSelect = useCallback(
    (p: Partenariat) => {
      ackIfPossible();
      setOpen(false);
      navigate(`/?open=${encodeURIComponent(p.id)}`, { replace: true });
    },
    [ackIfPossible, navigate],
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground hover:text-foreground"
          title="Boîte notifications"
          aria-label="Boîte notifications"
        >
          <Bell className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Boîte notifications</span>
          {count > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(100vw-2rem,22rem)] p-0 sm:w-96">
        <div className="border-b border-border px-4 py-3">
          <p className="font-semibold text-foreground">Boîte notifications</p>
          <p className="text-xs text-muted-foreground">
            Alertes sur vos partenariats (échéances et changements récents).
          </p>
        </div>
        {!userId ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Connectez-vous pour voir vos alertes.
          </p>
        ) : isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Aucune notification pour le moment.
          </p>
        ) : (
          <ScrollArea className="max-h-[min(70vh,320px)]">
            <ul className="divide-y divide-border p-2">
              {items.map((item) => {
                const meta = typeMeta(item.type);
                const Icon = meta.Icon;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      className="flex w-full gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted/60"
                      onClick={() => handleSelect(item.partenariat)}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.bg}`}
                      >
                        <Icon className={`h-4 w-4 ${meta.className}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">{meta.label}</p>
                        <p className="truncate font-medium text-foreground">{item.partenariat.titre}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
        {items.length > 0 && (
          <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            Fermer cette fenêtre marque les alertes « mise à jour » comme vues. Les échéances
            restent visibles tant qu’elles sont pertinentes.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default BoiteNotifications;
