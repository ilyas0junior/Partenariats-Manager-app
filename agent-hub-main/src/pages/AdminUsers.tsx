import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  Pencil,
  Users,
  ScrollText,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";
import {
  useUsersList,
  useUpdateUser,
  useCreateUser,
  useSetUserPartenariats,
  useLogs,
  type AdminUser,
  type UserRole,
} from "@/hooks/useAdminUsers";
import { usePartenariats } from "@/hooks/usePartenariats";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur (accès total, toutes entreprises)",
  editor: "Editeur (créer / modifier / supprimer, son entreprise)",
  spectate: "Spectateur (lecture seule, son entreprise)",
  ajouter: "Ajouter (créer uniquement, son entreprise)",
  modifier: "Modifier (modifier uniquement, son entreprise)",
  suppression: "Suppression (supprimer uniquement, son entreprise)",
};

const LOG_ACTION_LABELS: Record<string, string> = {
  login: "Connexion",
  create_partenariat: "Création partenariat",
  update_partenariat: "Modif. partenariat",
  delete_partenariat: "Suppr. partenariat",
  create_user: "Création utilisateur",
  update_user: "Modif. utilisateur",
};

const ADMIN_EMAILS = ["admin@local", "ilyas@local"];

export default function AdminUsers() {
  const { session, signOut, isAdmin } = useAuth();
  const userId = session?.id;
  const userEmail =
    session?.email && ADMIN_EMAILS.includes(session.email)
      ? session.email
      : undefined;
  const displayName =
    session?.nickname || session?.fullName || session?.email || "";

  const {
    data: users = [],
    isLoading: loadingUsers,
    isError: errorUsers,
  } = useUsersList(userId, userEmail);
  const {
    data: logs = [],
    isLoading: loadingLogs,
    isError: errorLogs,
  } = useLogs(userId, userEmail);
  const updateUser = useUpdateUser(userId, userEmail);
  const createUser = useCreateUser(userId, userEmail);
  const setUserPartenariats = useSetUserPartenariats(userId, userEmail);
  const { toast } = useToast();

  const [approveUser, setApproveUser] = useState<AdminUser | null>(null);
  const [approveNickname, setApproveNickname] = useState("");
  const [approveRole, setApproveRole] = useState<UserRole>("spectate");
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editNickname, setEditNickname] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("spectate");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("spectate");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [selectedPartenariatIds, setSelectedPartenariatIds] = useState<
    string[]
  >([]);
  const [assignPartenariatsUser, setAssignPartenariatsUser] =
    useState<AdminUser | null>(null);
  const [assignPartenariatsSelected, setAssignPartenariatsSelected] = useState<
    string[]
  >([]);

  const { data: partenariats = [], isLoading: loadingPartenariats } =
    usePartenariats(userId ?? undefined);

  const handleApprove = () => {
    if (!approveUser) return;
    updateUser.mutate(
      {
        id: approveUser.id,
        status: "approved",
        nickname:
          approveNickname.trim() || approveUser.fullName || approveUser.email,
        role: approveRole,
      },
      {
        onSuccess: () => {
          toast({ title: "Utilisateur approuvé" });
          setApproveUser(null);
          setApproveNickname("");
          setApproveRole("spectate");
        },
        onError: (e: Error) =>
          toast({
            title: "Erreur",
            description: e.message,
            variant: "destructive",
          }),
      },
    );
  };

  const handleReject = (user: AdminUser) => {
    updateUser.mutate(
      { id: user.id, status: "rejected" },
      {
        onSuccess: () => toast({ title: "Demande refusée" }),
        onError: (e: Error) =>
          toast({
            title: "Erreur",
            description: e.message,
            variant: "destructive",
          }),
      },
    );
  };

  const openEdit = (u: AdminUser) => {
    setEditUser(u);
    setEditNickname(u.nickname || u.fullName || "");
    setEditRole(u.role);
  };

  const openAssignPartenariats = (u: AdminUser) => {
    setAssignPartenariatsUser(u);
    const company = u.companyName?.trim() || "";
    setAssignPartenariatsSelected(
      partenariats
        .filter((p) => (p.company_name || "").trim() === company)
        .map((p) => p.id),
    );
  };

  const handleSaveAssignPartenariats = () => {
    if (!assignPartenariatsUser) return;
    setUserPartenariats.mutate(
      {
        userId: assignPartenariatsUser.id,
        partenariatIds: assignPartenariatsSelected,
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Partenariats affectés",
            description: `${data.count} partenariat(s) lié(s) à l'entreprise.`,
          });
          setAssignPartenariatsUser(null);
        },
        onError: (e: Error) =>
          toast({
            title: "Erreur",
            description: e.message,
            variant: "destructive",
          }),
      },
    );
  };

  const handleSaveEdit = () => {
    if (!editUser) return;
    updateUser.mutate(
      {
        id: editUser.id,
        nickname: editNickname.trim() || editUser.email,
        role: editRole,
      },
      {
        onSuccess: () => {
          toast({ title: "Utilisateur mis à jour" });
          setEditUser(null);
        },
        onError: (e: Error) =>
          toast({
            title: "Erreur",
            description: e.message,
            variant: "destructive",
          }),
      },
    );
  };

  const handleRoleChange = (u: AdminUser, newRole: UserRole) => {
    if (u.role === newRole) return;
    updateUser.mutate(
      { id: u.id, role: newRole },
      {
        onSuccess: () => toast({ title: "Rôle mis à jour" }),
        onError: (e: Error) =>
          toast({
            title: "Erreur",
            description: e.message,
            variant: "destructive",
          }),
      },
    );
  };

  if (!isAdmin || !session) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader
          userName={displayName}
          isAdmin={false}
          onSignOut={signOut}
          userId={session?.id}
        />
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <p className="text-muted-foreground">
            Accès réservé aux administrateurs.
          </p>
          <Button asChild variant="link" className="mt-2">
            <Link to="/">Retour au tableau de bord</Link>
          </Button>
        </main>
      </div>
    );
  }

  const approvedUsers = users.filter(
    (u) => u.status === "approved" || !u.status,
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={displayName} isAdmin onSignOut={signOut} userId={session?.id} />

      <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Gestion des utilisateurs
            </h2>
            <p className="text-sm text-muted-foreground">
              Créer des comptes et gérer les rôles et pseudos
            </p>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <ScrollText className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Utilisateurs approuvés</CardTitle>
                <CardDescription>
                  Modifiez le pseudonyme (affiché dans le profil) et le rôle de
                  chaque utilisateur.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 rounded-lg border border-border bg-card p-4">
                  <h3 className="text-sm font-medium mb-3">
                    Créer un utilisateur
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    L&apos;utilisateur pourra modifier uniquement les données de
                    son entreprise.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newFullName">Nom complet</Label>
                      <Input
                        id="newFullName"
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newCompany">Nom d&apos;entreprise</Label>
                      <Input
                        id="newCompany"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Entreprise X"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">Email</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="user@local"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Mot de passe</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <Select
                        value={newRole}
                        onValueChange={(v) => setNewRole(v as UserRole)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            {ROLE_LABELS.admin}
                          </SelectItem>
                          <SelectItem value="editor">
                            {ROLE_LABELS.editor}
                          </SelectItem>
                          <SelectItem value="spectate">
                            {ROLE_LABELS.spectate}
                          </SelectItem>
                          <SelectItem value="ajouter">
                            {ROLE_LABELS.ajouter}
                          </SelectItem>
                          <SelectItem value="modifier">
                            {ROLE_LABELS.modifier}
                          </SelectItem>
                          <SelectItem value="suppression">
                            {ROLE_LABELS.suppression}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 sm:col-span-2">
                    <Label>Affecter des partenariats à l&apos;entreprise</Label>
                    <p className="text-xs text-muted-foreground">
                      Cochez les partenariats qui seront visibles et gérables
                      par cet utilisateur (entreprise : {newCompanyName || "—"}
                      ).
                    </p>
                    {loadingPartenariats ? (
                      <p className="text-sm text-muted-foreground">
                        Chargement des partenariats... ssber m3ana{" "}
                      </p>
                    ) : partenariats.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Aucun partenariat. Créez-en depuis l&apos;accueil.
                      </p>
                    ) : (
                      <ScrollArea className="h-48 rounded-md border border-border p-2">
                        <div className="flex flex-col gap-2">
                          {partenariats.map((p) => (
                            <label
                              key={p.id}
                              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                            >
                              <Checkbox
                                checked={selectedPartenariatIds.includes(p.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedPartenariatIds((prev) =>
                                    checked
                                      ? [...prev, p.id]
                                      : prev.filter((id) => id !== p.id),
                                  );
                                }}
                              />
                              <span className="text-sm truncate">
                                {p.titre}
                              </span>
                              {p.company_name && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  ({p.company_name})
                                </span>
                              )}
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end sm:col-span-2">
                    <Button
                      onClick={() => {
                        createUser.mutate(
                          {
                            fullName: newFullName.trim(),
                            companyName: newCompanyName.trim(),
                            email: newEmail.trim(),
                            password: newPassword,
                            role: newRole,
                            partenariatIds:
                              selectedPartenariatIds.length > 0
                                ? selectedPartenariatIds
                                : undefined,
                          },
                          {
                            onSuccess: () => {
                              toast({ title: "Utilisateur créé" });
                              setNewFullName("");
                              setNewCompanyName("");
                              setNewEmail("");
                              setNewPassword("");
                              setNewRole("spectate");
                              setSelectedPartenariatIds([]);
                            },
                            onError: (e: Error) =>
                              toast({
                                title: "Erreur",
                                description: e.message,
                                variant: "destructive",
                              }),
                          },
                        );
                      }}
                      disabled={createUser.isPending}
                      className="gradient-primary"
                    >
                      {createUser.isPending ? "Création..." : "Créer"}
                    </Button>
                  </div>
                </div>

                {loadingUsers ? (
                  <p className="text-muted-foreground">Chargement... (0x0)</p>
                ) : errorUsers ? (
                  <p className="text-destructive">
                    Erreur lors du chargement des utilisateurs.
                  </p>
                ) : approvedUsers.length === 0 ? (
                  <p className="text-muted-foreground">
                    Aucun utilisateur approuvé.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="p-3 text-left font-medium">Email</th>
                          <th className="p-3 text-left font-medium">
                            Pseudonyme
                          </th>
                          <th className="p-3 text-left font-medium">Rôle</th>
                          <th className="p-3 text-left font-medium">Créé le</th>
                          <th className="p-3 text-left font-medium">
                            Dernière connexion
                          </th>
                          <th className="p-3 w-24"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {approvedUsers.map((u) => (
                          <tr
                            key={u.id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="p-3">{u.email}</td>
                            <td className="p-3">
                              {u.nickname || u.fullName || "—"}
                            </td>
                            <td className="p-3">
                              <Select
                                value={u.role}
                                onValueChange={(v) =>
                                  handleRoleChange(u, v as UserRole)
                                }
                                disabled={updateUser.isPending}
                              >
                                <SelectTrigger className="h-8 w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">
                                    {ROLE_LABELS.admin}
                                  </SelectItem>
                                  <SelectItem value="editor">
                                    {ROLE_LABELS.editor}
                                  </SelectItem>
                                  <SelectItem value="spectate">
                                    {ROLE_LABELS.spectate}
                                  </SelectItem>
                                  <SelectItem value="ajouter">
                                    {ROLE_LABELS.ajouter}
                                  </SelectItem>
                                  <SelectItem value="modifier">
                                    {ROLE_LABELS.modifier}
                                  </SelectItem>
                                  <SelectItem value="suppression">
                                    {ROLE_LABELS.suppression}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {u.createdAt
                                ? new Date(u.createdAt).toLocaleString("fr-FR")
                                : "—"}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {u.lastLogin
                                ? new Date(u.lastLogin).toLocaleString("fr-FR")
                                : "Jamais"}
                            </td>
                            <td className="p-3 flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(u)}
                                title="Modifier le pseudonyme"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openAssignPartenariats(u)}
                                title="Affecter des partenariats à cet utilisateur"
                              >
                                <Link2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  Liste des utilisateurs et dernière connexion
                </CardTitle>
                <CardDescription>
                  Tous les comptes avec la date de leur dernière connexion.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <p className="text-muted-foreground">Chargement...</p>
                ) : errorUsers ? (
                  <p className="text-destructive">
                    Erreur lors du chargement. Vérifiez que le serveur tourne et
                    que vous êtes connecté en tant qu&apos;admin. En cas de
                    doute, déconnectez-vous puis reconnectez-vous.
                  </p>
                ) : users.length === 0 ? (
                  <p className="text-muted-foreground">Aucun utilisateur.</p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="p-3 text-left font-medium">Email</th>
                          <th className="p-3 text-left font-medium">
                            Pseudonyme
                          </th>
                          <th className="p-3 text-left font-medium">Admin</th>
                          <th className="p-3 text-left font-medium">Créé le</th>
                          <th className="p-3 text-left font-medium">
                            Dernière connexion
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => {
                          const createdStr = u.createdAt
                            ? (() => {
                                try {
                                  return new Date(u.createdAt).toLocaleString(
                                    "fr-FR",
                                  );
                                } catch {
                                  return "—";
                                }
                              })()
                            : "—";
                          const lastStr = u.lastLogin
                            ? (() => {
                                try {
                                  return new Date(u.lastLogin).toLocaleString(
                                    "fr-FR",
                                  );
                                } catch {
                                  return "Jamais";
                                }
                              })()
                            : "Jamais";
                          return (
                            <tr
                              key={u.id}
                              className="border-b border-border last:border-0"
                            >
                              <td className="p-3">{u.email}</td>
                              <td className="p-3">
                                {u.nickname || u.fullName || "—"}
                              </td>
                              <td className="p-3">
                                {u.role === "admin" ? "Oui" : "Non"}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {createdStr}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {lastStr}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Historique des actions (connexions et modifications)
                </CardTitle>
                <CardDescription>
                  Connexions, créations et modifications de partenariats et
                  d&apos;utilisateurs (500 dernières entrées).
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <p className="text-muted-foreground">Chargement...</p>
                ) : errorLogs ? (
                  <p className="text-destructive">
                    Erreur lors du chargement. Vérifiez que le serveur tourne et
                    que vous êtes connecté en tant qu&apos;admin. En cas de
                    doute, déconnectez-vous puis reconnectez-vous.
                  </p>
                ) : logs.length === 0 ? (
                  <p className="text-muted-foreground">
                    Aucune action enregistrée.
                  </p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="p-3 text-left font-medium">
                            Date / Heure
                          </th>
                          <th className="p-3 text-left font-medium">
                            Utilisateur
                          </th>
                          <th className="p-3 text-left font-medium">Action</th>
                          <th className="p-3 text-left font-medium">Détails</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr
                            key={log.id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="p-3 text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString("fr-FR")}
                            </td>
                            <td className="p-3">
                              {log.userNickname || log.userEmail || log.userId}
                            </td>
                            <td className="p-3">
                              {LOG_ACTION_LABELS[log.action] ?? log.action}
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {log.details || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Approve dialog */}
      <Dialog
        open={!!approveUser}
        onOpenChange={(open) => !open && setApproveUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver l&apos;utilisateur</DialogTitle>
          </DialogHeader>
          {approveUser && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                {approveUser.email} — {approveUser.fullName || "—"}
              </p>
              <div className="space-y-2">
                <Label>Pseudonyme (affiché dans le profil)</Label>
                <Input
                  value={approveNickname}
                  onChange={(e) => setApproveNickname(e.target.value)}
                  placeholder="Ex: Jean D."
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={approveRole}
                  onValueChange={(v) => setApproveRole(v as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                    <SelectItem value="editor">{ROLE_LABELS.editor}</SelectItem>
                    <SelectItem value="spectate">
                      {ROLE_LABELS.spectate}
                    </SelectItem>
                    <SelectItem value="ajouter">
                      {ROLE_LABELS.ajouter}
                    </SelectItem>
                    <SelectItem value="modifier">
                      {ROLE_LABELS.modifier}
                    </SelectItem>
                    <SelectItem value="suppression">
                      {ROLE_LABELS.suppression}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveUser(null)}>
              Annuler
            </Button>
            <Button onClick={handleApprove} disabled={updateUser.isPending}>
              Approuver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit user dialog */}
      <Dialog
        open={!!editUser}
        onOpenChange={(open) => !open && setEditUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">{editUser.email}</p>
              <div className="space-y-2">
                <Label>Pseudonyme (affiché dans le profil)</Label>
                <Input
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="Ex: Jean D."
                />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={editRole}
                  onValueChange={(v) => setEditRole(v as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                    <SelectItem value="editor">{ROLE_LABELS.editor}</SelectItem>
                    <SelectItem value="spectate">
                      {ROLE_LABELS.spectate}
                    </SelectItem>
                    <SelectItem value="ajouter">
                      {ROLE_LABELS.ajouter}
                    </SelectItem>
                    <SelectItem value="modifier">
                      {ROLE_LABELS.modifier}
                    </SelectItem>
                    <SelectItem value="suppression">
                      {ROLE_LABELS.suppression}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateUser.isPending}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Affecter partenariats à un utilisateur */}
      <Dialog
        open={!!assignPartenariatsUser}
        onOpenChange={(open) => !open && setAssignPartenariatsUser(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Affecter des partenariats</DialogTitle>
            <DialogDescription>
              {assignPartenariatsUser && (
                <>
                  Utilisateur : {assignPartenariatsUser.email}
                  {assignPartenariatsUser.companyName && (
                    <>
                      {" "}
                      — Entreprise :{" "}
                      <strong>{assignPartenariatsUser.companyName}</strong>
                    </>
                  )}
                  . Cochez les partenariats qui seront rattachés à son
                  entreprise (visibles et gérables par cet utilisateur).
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {assignPartenariatsUser && (
            <div className="space-y-3 py-2">
              {loadingPartenariats ? (
                <p className="text-sm text-muted-foreground">
                  Chargement des partenariats...
                </p>
              ) : partenariats.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun partenariat.
                </p>
              ) : (
                <ScrollArea className="h-64 rounded-md border border-border p-2">
                  <div className="flex flex-col gap-2">
                    {partenariats.map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={assignPartenariatsSelected.includes(p.id)}
                          onCheckedChange={(checked) => {
                            setAssignPartenariatsSelected((prev) =>
                              checked
                                ? [...prev, p.id]
                                : prev.filter((id) => id !== p.id),
                            );
                          }}
                        />
                        <span className="text-sm truncate">{p.titre}</span>
                        {p.company_name && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({p.company_name})
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignPartenariatsUser(null)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveAssignPartenariats}
              disabled={setUserPartenariats.isPending || loadingPartenariats}
            >
              {setUserPartenariats.isPending
                ? "Enregistrement..."
                : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
