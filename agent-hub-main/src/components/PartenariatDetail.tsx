import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/StatusBadge";
import type { Partenariat } from "@/hooks/usePartenariats";
import { TYPES_PARTENARIAT, NATURES, DOMAINES, ENTITES_CNSS } from "@/hooks/usePartenariats";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText, Building, Globe, Landmark, Calendar, AlignLeft } from "lucide-react";

interface Props {
  partenariat: Partenariat | null;
  open: boolean;
  onClose: () => void;
}

const getLabel = (list: { value: string; label: string }[], value: string) =>
  list.find((i) => i.value === value)?.label || value;

const formatDate = (date: string | null) => {
  if (!date) return "—";
  return format(new Date(date), "dd MMMM yyyy", { locale: fr });
};

const PartenariatDetail = ({ partenariat, open, onClose }: Props) => {
  if (!partenariat) return null;

  const fields = [
    ...(partenariat.company_name
      ? [{ icon: Building, label: "Entreprise", value: partenariat.company_name }]
      : []),
    { icon: FileText, label: "Type", value: getLabel(TYPES_PARTENARIAT, partenariat.type_partenariat) },
    { icon: Globe, label: "Nature", value: getLabel(NATURES, partenariat.nature) },
    { icon: Landmark, label: "Domaine", value: getLabel(DOMAINES, partenariat.domaine) },
    { icon: Building, label: "Entité responsable", value: getLabel(ENTITES_CNSS, partenariat.entite_cnss) },
    { icon: Building, label: "Entité concernée", value: partenariat.entite_concernee ? getLabel(ENTITES_CNSS, partenariat.entite_concernee) : "—" },
    { icon: Building, label: "Partenaire", value: partenariat.partenaire },
    { icon: Calendar, label: "Date de signature", value: formatDate(partenariat.date_debut) },
    { icon: Calendar, label: "Date de fin", value: formatDate(partenariat.date_fin) },
    { icon: Calendar, label: "Date prise d'effet", value: formatDate(partenariat.date_prise_effet) },
    { icon: AlignLeft, label: "Objet", value: partenariat.description },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground font-bold text-sm">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p>{partenariat.titre}</p>
              <div className="mt-1"><StatusBadge statut={partenariat.statut} /></div>
            </div>
          </DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.label} className="flex items-start gap-3">
              <field.icon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className="text-sm text-foreground">{field.value || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartenariatDetail;
