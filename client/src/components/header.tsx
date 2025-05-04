import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

export function Header({ title = "FitTrack" }: { title?: string }) {
  const { user, logoutMutation } = useAuth();
  const { membership } = useMembership();
  const [, navigate] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };
  
  const userInitials = user?.displayName 
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase() 
    : user?.username?.substring(0, 2).toUpperCase() || "U";
  
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm max-w-md mx-auto">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary mr-2">
            <path d="M19 12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12C5 8.13401 8.13401 5 12 5C15.866 5 19 8.13401 19 12Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="font-bold text-xl text-gray-800">{title}</span>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="text-gray-600" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
                <div className="h-8 w-8 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-semibold">
                  {userInitials}
                </div>
                {membership && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-secondary-500 border-2 border-white"></div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/membership")}>
                Membership
              </DropdownMenuItem>
              {user?.role === "admin" && (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  Admin Panel
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
