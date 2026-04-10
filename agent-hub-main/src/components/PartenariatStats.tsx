import { Handshake, CheckCircle, PauseCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Partenariat } from "@/hooks/usePartenariats";

interface Props {
  partenariats: Partenariat[];
}

const PartenariatStats = ({ partenariats }: Props) => {
  const total = partenariats.length;
  const operationnels = partenariats.filter((p) => p.statut === "operationnel").length;
  const nonOperationnels = partenariats.filter((p) => p.statut === "non_operationnel").length;
  const echus = partenariats.filter((p) => p.statut === "echu").length;
  const aRenouveler = partenariats.filter((p) => p.statut === "a_renouveler").length;
  const enCours = partenariats.filter((p) => p.statut === "en_cours").length;

  const stats = [
    { label: "Total", value: total, icon: Handshake, color: "text-primary" },
    { label: "Opérationnels", value: operationnels, icon: CheckCircle, color: "text-success" },
    { label: "Non opérationnels", value: nonOperationnels, icon: XCircle, color: "text-muted-foreground" },
    { label: "Échus", value: echus, icon: XCircle, color: "text-destructive" },
    { label: "À renouveler", value: aRenouveler, icon: PauseCircle, color: "text-warning" },
    { label: "En cours", value: enCours, icon: CheckCircle, color: "text-info" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="shadow-card border-border transition-shadow hover:shadow-elevated">
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`flex h-11 w-11 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PartenariatStats;
