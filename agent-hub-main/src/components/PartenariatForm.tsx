import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Partenariat } from "@/hooks/usePartenariats";
import { TYPES_PARTENARIAT, NATURES, DOMAINES, ENTITES_CNSS, STATUTS } from "@/hooks/usePartenariats";

export type PartenariatFormValues = {
  titre: string;
  company_name: string;
  type_partenariat: string;
  nature: string;
  domaine: string;
  entite_cnss: string;
  entite_concernee: string;
  partenaire: string;
  date_debut: string;
  date_fin: string;
  date_prise_effet: string;
  statut: string;
  description: string;
};

interface PartenariatFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PartenariatFormValues) => void;
  partenariat?: Partenariat | null;
  loading?: boolean;
  /** Si true, affiche le champ Entreprise pour affecter le partenariat à une entreprise */
  isAdmin?: boolean;
  /** Liste des noms d'entreprises (utilisateurs) pour le select */
  companies?: string[];
}

const PartenariatForm = ({ open, onClose, onSubmit, partenariat, loading, isAdmin, companies = [] }: PartenariatFormProps) => {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
    defaultValues: {
      titre: partenariat?.titre || "",
      company_name: partenariat?.company_name ?? "",
      type_partenariat: partenariat?.type_partenariat || "convention",
      nature: partenariat?.nature || "public",
      domaine: partenariat?.domaine || "sante",
      entite_cnss: partenariat?.entite_cnss || "entite_centrale",
      entite_concernee: partenariat?.entite_concernee || "entite_centrale",
      partenaire: partenariat?.partenaire || "",
      date_debut: partenariat?.date_debut || "",
      date_fin: partenariat?.date_fin || "",
      date_prise_effet: partenariat?.date_prise_effet || "",
      statut: partenariat?.statut || "en_cours",
      description: partenariat?.description || "",
    },
  });

  const type_partenariat = watch("type_partenariat");
  const nature = watch("nature");
  const domaine = watch("domaine");
  const entite_cnss = watch("entite_cnss");
  const entite_concernee = watch("entite_concernee");
  const statut = watch("statut");
  const company_name = watch("company_name");

  const date_debut = watch("date_debut");
  const date_fin = watch("date_fin");
  const date_prise_effet = watch("date_prise_effet");

  const handleFormSubmit = (data: PartenariatFormValues) => {
    if (data.date_debut && data.date_fin && data.date_fin < data.date_debut) {
      return; // validation message shown below
    }
    if (data.date_debut && data.date_prise_effet && data.date_prise_effet < data.date_debut) {
      return;
    }
    onSubmit(data);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{partenariat ? "Modifier le partenariat" : "Nouveau partenariat"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="titre">Titre du partenariat *</Label>
              <Input id="titre" {...register("titre", { required: true })} placeholder="Titre du projet de partenariat" />
            </div>

            {isAdmin && companies.length > 0 && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Entreprise (affectation)</Label>
                <Select
                  value={company_name || "__none__"}
                  onValueChange={(v) => setValue("company_name", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger><SelectValue placeholder="Choisir une entreprise" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Aucune (non affecté) —</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Les utilisateurs de cette entreprise pourront voir et gérer ce partenariat.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="type_partenariat">Type *</Label>
              <Select value={type_partenariat} onValueChange={(v) => setValue("type_partenariat", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES_PARTENARIAT.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nature">Nature *</Label>
              <Select value={nature} onValueChange={(v) => setValue("nature", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NATURES.map((n) => (
                    <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="domaine">Domaine *</Label>
              <Select value={domaine} onValueChange={(v) => setValue("domaine", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOMAINES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entite_cnss">Entité CNSS responsable *</Label>
              <Select value={entite_cnss} onValueChange={(v) => setValue("entite_cnss", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTITES_CNSS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entite_concernee">Entité concernée *</Label>
              <Select value={entite_concernee} onValueChange={(v) => setValue("entite_concernee", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTITES_CNSS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="partenaire">Partenaire *</Label>
              <Input id="partenaire" {...register("partenaire", { required: true })} placeholder="Nom de l'organisme partenaire" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_debut">Date de signature</Label>
              <Input id="date_debut" type="date" {...register("date_debut")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_fin">Date de fin</Label>
              <Input
                id="date_fin"
                type="date"
                min={date_debut || undefined}
                {...register("date_fin", {
                  validate: (v) =>
                    !v || !date_debut || v >= date_debut || "La date de fin doit être postérieure ou égale à la date de début.",
                })}
              />
              {errors.date_fin && (
                <p className="text-xs text-destructive">{errors.date_fin.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_prise_effet">Date prise d&apos;effet</Label>
              <Input
                id="date_prise_effet"
                type="date"
                min={date_debut || undefined}
                {...register("date_prise_effet", {
                  validate: (v) =>
                    !v || !date_debut || v >= date_debut || "La date de prise d'effet doit être postérieure ou égale à la date de début.",
                })}
              />
              {errors.date_prise_effet && (
                <p className="text-xs text-destructive">{errors.date_prise_effet.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="statut">État du partenariat</Label>
              <Select value={statut} onValueChange={(v) => setValue("statut", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Objet du partenariat</Label>
            <Textarea id="description" {...register("description")} placeholder="Objet ou résumé du partenariat..." rows={3} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="gradient-primary" disabled={loading}>
              {loading ? "Enregistrement..." : partenariat ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PartenariatForm;
