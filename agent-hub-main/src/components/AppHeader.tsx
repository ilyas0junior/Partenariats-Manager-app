import { LogOut, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BoiteNotifications from "@/components/BoiteNotifications";

interface AppHeaderProps {
  userName?: string | null;
  isAdmin?: boolean;
  onSignOut: () => void;
  /** Identifiant du compte connecté (alertes et données par utilisateur) */
  userId?: string | null;
}

const AppHeader = ({ userName, isAdmin, onSignOut, userId }: AppHeaderProps) => {
  const { pathname } = useLocation();
  const isProfileActive = pathname === "/profile" || pathname.startsWith("/profile/");
  const isAdminUsersActive =
    pathname === "/admin/users" || pathname.startsWith("/admin/users/");

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-[14px] bg-white shadow-card ring-1 ring-border">
              <img
                src="/cnss-logo.png"
                alt="CNSS"
                className="h-full w-full object-cover"
              />
            </div>
            <h1 className="text-lg font-bold text-foreground">Partenariats CNSS</h1>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <BoiteNotifications userId={userId} />
          {userName && (
            <Button
              variant={isProfileActive ? "secondary" : "ghost"}
              size="sm"
              className={
                isProfileActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground font-normal"
              }
              asChild
            >
              <Link to="/profile" title="Mon profil">
                <span className="sm:hidden">Profil</span>
                <span className="hidden sm:inline">{userName}</span>
              </Link>
            </Button>
          )}
          {isAdmin && (
            <Button
              variant={isAdminUsersActive ? "secondary" : "ghost"}
              size="sm"
              className={isAdminUsersActive ? "font-medium text-foreground" : ""}
              asChild
            >
              <Link to="/admin/users" title="Espace administrateur">
                <Users className="mr-2 h-4 w-4" />
                Utilisateurs
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onSignOut} className="text-muted-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
