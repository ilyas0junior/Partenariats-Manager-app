import { Link } from "react-router-dom";
import { ArrowLeft, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import AppHeader from "@/components/AppHeader";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  editor: "Editeur",
  spectate: "Spectateur",
  ajouter: "Ajouter",
  modifier: "Modifier",
  suppression: "Suppression",
};

export default function Profile() {
  const { session, signOut, isAdmin } = useAuth();
  const displayName = session?.nickname || session?.fullName || session?.email || "";

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={displayName} isAdmin={isAdmin} onSignOut={signOut} userId={session.id} />

      <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mon profil</h1>
            <p className="text-sm text-muted-foreground">
              Informations du compte et sécurité
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Ces informations sont utilisées pour vous identifier dans l’application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-foreground">{session.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nom complet</p>
              <p className="text-foreground">{session.fullName || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pseudonyme</p>
              <p className="text-foreground">{session.nickname || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rôle</p>
              <p className="text-foreground">{ROLE_LABELS[session.role] ?? session.role}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </CardTitle>
            <CardDescription>
              Authenticator (2FA) : bientôt vous pourrez activer une double authentification
              avec une application comme Google Authenticator pour renforcer la sécurité de votre compte.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              L’option « Activer l’authenticator » sera disponible ici. Vous scannerez un QR code
              avec votre application, puis vous devrez saisir un code à 6 chiffres à chaque connexion.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
