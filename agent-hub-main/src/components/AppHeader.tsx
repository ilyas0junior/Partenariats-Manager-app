import { LogOut, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  userName?: string | null;
  isAdmin?: boolean;
  onSignOut: () => void;
}

const AppHeader = ({ userName, isAdmin, onSignOut }: AppHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/cnss-logo.png"
              alt="CNSS"
              className="h-9 w-auto object-contain"
            />
            <h1 className="text-lg font-bold text-foreground">Partenariats CNSS</h1>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {userName && (
            <Button variant="ghost" size="sm" className="text-muted-foreground font-normal" asChild>
              <Link to="/profile" title="Mon profil">
                <span className="sm:hidden">Profil</span>
                <span className="hidden sm:inline">{userName}</span>
              </Link>
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/users">
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
