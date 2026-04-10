import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Pencil, Trash2, Eye } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import type { Partenariat } from "@/hooks/usePartenariats";
import { TYPES_PARTENARIAT, ENTITES_CNSS } from "@/hooks/usePartenariats";

interface Props {
  partenariats: Partenariat[];
  onEdit: (p: Partenariat) => void;
  onDelete: (id: string) => void;
  onView: (p: Partenariat) => void;
  /** If false, only "Voir" and export are available (spectator mode). */
  canModify?: boolean;
  /** When set, overrides canModify for edit/delete actions. */
  canEdit?: boolean;
  canDelete?: boolean;
  /** Afficher la colonne Entreprise (affectation) */
  showCompany?: boolean;
}

const getLabel = (list: { value: string; label: string }[], value: string) =>
  list.find((i) => i.value === value)?.label || value;

const PartenariatTable = ({ partenariats, onEdit, onDelete, onView, canModify = true, canEdit, canDelete, showCompany }: Props) => {
  const allowEdit = canEdit !== undefined ? canEdit : canModify;
  const allowDelete = canDelete !== undefined ? canDelete : canModify;
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = partenariats.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.titre.toLowerCase().includes(q) ||
      p.partenaire.toLowerCase().includes(q) ||
      p.domaine.toLowerCase().includes(q)
    );
  });

  const exportToCsv = () => {
    if (filtered.length === 0) return;

    const header = [
      "Titre",
      ...(showCompany ? ["Entreprise"] : []),
      "Type",
      "Nature",
      "Domaine",
      "Entité responsable",
      "Entité concernée",
      "Partenaire",
      "Date de signature",
      "Date fin",
      "Date prise d'effet",
      "Statut",
      "Description",
      "Créé le",
      "Créé par",
    ];

    const escape = (value: unknown) => {
      if (value === null || value === undefined) return "";
      const str = String(value);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = filtered.map((p) => [
      p.titre,
      ...(showCompany ? [p.company_name ?? ""] : []),
      getLabel(TYPES_PARTENARIAT, p.type_partenariat),
      p.nature,
      p.domaine,
      getLabel(ENTITES_CNSS, p.entite_cnss),
      p.entite_concernee ? getLabel(ENTITES_CNSS, p.entite_concernee) : "",
      p.partenaire,
      p.date_debut ?? "",
      p.date_fin ?? "",
      p.date_prise_effet ?? "",
      p.statut,
      p.description ?? "",
      p.created_at,
      p.created_by ?? "",
    ]);

    const csvContent = [
      header.map(escape).join(","),
      ...rows.map((row) => row.map(escape).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "partenariats.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle className="text-lg">Partenariats</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} résultat(s){search ? " (filtré)" : ""}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-[320px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un partenariat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-10"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={exportToCsv}
            disabled={filtered.length === 0}
            className="h-10"
          >
            Exporter en Excel
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-hidden rounded-b-lg border-t border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold">Titre</TableHead>
                {showCompany && (
                  <TableHead className="font-semibold">Entreprise</TableHead>
                )}
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Partenaire</TableHead>
                <TableHead className="font-semibold">Entité CNSS</TableHead>
                <TableHead className="font-semibold">État</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={showCompany ? 7 : 6}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {search ? "Aucun résultat trouvé" : "Aucun partenariat enregistré"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => (
                  <TableRow
                    key={p.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="py-4">
                      <p className="font-medium text-foreground">{p.titre}</p>
                      <p className="text-xs text-muted-foreground">{p.domaine}</p>
                    </TableCell>
                    {showCompany && (
                      <TableCell className="text-muted-foreground">
                        {p.company_name || "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {getLabel(TYPES_PARTENARIAT, p.type_partenariat)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.partenaire}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getLabel(ENTITES_CNSS, p.entite_cnss)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge statut={p.statut} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                          >
                            Plus
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(p)}>
                            <Eye className="mr-2 h-4 w-4" /> Voir
                          </DropdownMenuItem>
                          {allowEdit && (
                            <DropdownMenuItem onClick={() => onEdit(p)}>
                              <Pencil className="mr-2 h-4 w-4" /> Modifier
                            </DropdownMenuItem>
                          )}
                          {allowDelete && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(p.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce partenariat ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default PartenariatTable;
