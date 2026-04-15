import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  usePartenariats,
  useCreatePartenariat,
  useUpdatePartenariat,
  useDeletePartenariat,
} from "@/hooks/usePartenariats";
import type { Partenariat } from "@/hooks/usePartenariats";
import { useCompanies } from "@/hooks/useAdminUsers";
import AppHeader from "@/components/AppHeader";
import PartenariatStats from "@/components/PartenariatStats";
import PartenariatTable from "@/components/PartenariatTable";
import PartenariatForm from "@/components/PartenariatForm";
import PartenariatDetail from "@/components/PartenariatDetail";
import type { PartenariatFormValues } from "@/components/PartenariatForm";

const Dashboard = () => {
  const { session, signOut, isAdmin, canCreatePartenariat, canEditPartenariat, canDeletePartenariat } = useAuth();
  const userId = session?.id;
  const { data: partenariats = [], isLoading } = usePartenariats(userId);
  const { data: companies = [] } = useCompanies(userId, undefined, isAdmin);
  const createP = useCreatePartenariat(userId);
  const updateP = useUpdatePartenariat(userId);
  const deleteP = useDeletePartenariat(userId);
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Partenariat | null>(null);
  const [viewItem, setViewItem] = useState<Partenariat | null>(null);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || isLoading) return;
    const p = partenariats.find((x) => x.id === openId);
    if (p) setViewItem(p);
    const next = new URLSearchParams(searchParams);
    next.delete("open");
    setSearchParams(next, { replace: true });
  }, [partenariats, isLoading, searchParams, setSearchParams]);

  const handleCreate = (data: PartenariatFormValues) => {
    createP.mutate(
      data,
      {
        onSuccess: () => {
          toast({ title: "Partenariat créé avec succès" });
          setFormOpen(false);
        },
        onError: (err: unknown) =>
          toast({
            title: "Erreur",
            description: err instanceof Error ? err.message : "Erreur lors de la création.",
            variant: "destructive",
          }),
      },
    );
  };

  const handleUpdate = (data: PartenariatFormValues) => {
    if (!editItem) return;
    updateP.mutate(
      { id: editItem.id, ...data },
      {
        onSuccess: () => {
          toast({ title: "Partenariat mis à jour avec succès" });
          setEditItem(null);
        },
        onError: (err: unknown) =>
          toast({
            title: "Erreur technique",
            description: err instanceof Error ? err.message : "Erreur lors de la mise à jour.",
            variant: "destructive",
          }),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteP.mutate(id, {
      onSuccess: () => toast({ title: "Partenariat supprimé" }),
      onError: (err: unknown) =>
        toast({
          title: "Erreur",
          description: err instanceof Error ? err.message : "Erreur lors de la suppression.",
          variant: "destructive",
        }),
    });
  };

  const displayName = session?.nickname || session?.fullName || session?.email || "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <AppHeader
        userName={displayName}
        isAdmin={isAdmin}
        onSignOut={signOut}
        userId={userId}
      />

      <main className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6">
        <div className="animate-fade-in rounded-xl border border-border bg-card/60 p-5 shadow-card backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Gestion des Partenariats
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAdmin
                  ? "Suivez et gérez tous les partenariats"
                  : canCreatePartenariat || canEditPartenariat || canDeletePartenariat
                    ? "Suivez et gérez vos partenariats"
                    : "Consultez les partenariats (lecture seule)"}
              </p>
            </div>
            {canCreatePartenariat && (
              <Button
                onClick={() => setFormOpen(true)}
                className="gradient-primary shadow-elevated hover:opacity-95"
              >
                <Plus className="mr-2 h-4 w-4" /> Nouveau partenariat
              </Button>
            )}
          </div>
        </div>

        <div className="animate-fade-in">
          <PartenariatStats partenariats={partenariats} />
        </div>

        <div className="animate-fade-in animate-delay-100">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Chargement...
            </div>
          ) : (
            <PartenariatTable
              partenariats={partenariats}
              onEdit={setEditItem}
              onDelete={handleDelete}
              onView={setViewItem}
              canEdit={canEditPartenariat}
              canDelete={canDeletePartenariat}
              showCompany={isAdmin}
            />
          )}
        </div>
      </main>

      <PartenariatForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
        loading={createP.isPending}
        isAdmin={isAdmin}
        companies={companies}
      />
      <PartenariatForm
        open={!!editItem}
        onClose={() => setEditItem(null)}
        onSubmit={handleUpdate}
        partenariat={editItem}
        loading={updateP.isPending}
        isAdmin={isAdmin}
        companies={companies}
      />
      <PartenariatDetail
        partenariat={viewItem}
        open={!!viewItem}
        onClose={() => setViewItem(null)}
      />
    </div>
  );
};

export default Dashboard;
