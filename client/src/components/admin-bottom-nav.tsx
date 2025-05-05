import { Settings, Users, Key, CreditCard, User } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function AdminBottomNav() {
  const [location, navigate] = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 max-w-md mx-auto ios-padding-bottom">
      <div className="flex justify-around">
        <button 
          className={cn(
            "flex flex-col items-center py-3 px-4",
            location === "/admin" ? "text-primary" : "text-gray-500 hover:text-primary"
          )}
          onClick={() => navigate("/admin")}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs mt-1">Dashboard</span>
        </button>
        
        <button 
          className={cn(
            "flex flex-col items-center py-3 px-4",
            location === "/admin/users" ? "text-primary" : "text-gray-500 hover:text-primary"
          )}
          onClick={() => navigate("/admin/users")}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs mt-1">Users</span>
        </button>
        
        <button 
          className={cn(
            "flex flex-col items-center py-3 px-4",
            location === "/admin/keys" ? "text-primary" : "text-gray-500 hover:text-primary"
          )}
          onClick={() => navigate("/admin/keys")}
        >
          <Key className="h-5 w-5" />
          <span className="text-xs mt-1">Keys</span>
        </button>
        
        <button 
          className={cn(
            "flex flex-col items-center py-3 px-4",
            location === "/admin/memberships" ? "text-primary" : "text-gray-500 hover:text-primary"
          )}
          onClick={() => navigate("/admin/memberships")}
        >
          <CreditCard className="h-5 w-5" />
          <span className="text-xs mt-1">Plans</span>
        </button>
        
        <button 
          className={cn(
            "flex flex-col items-center py-3 px-4",
            location === "/profile" ? "text-primary" : "text-gray-500 hover:text-primary"
          )}
          onClick={() => navigate("/profile")}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
}