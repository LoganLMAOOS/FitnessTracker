import { Home, Users, Key, LogOut } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function AdminBottomNav() {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 shadow-sm">
      <div className="grid grid-cols-3 h-16 mx-auto">
        <Link
          href="/admin"
          className={`flex flex-col items-center justify-center text-xs ${
            location === "/admin"
              ? "text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Key
            className={`h-6 w-6 mb-1 ${
              location === "/admin" ? "text-primary" : "text-gray-500"
            }`}
          />
          Memberships
        </Link>
        <Link
          href="/admin/users"
          className={`flex flex-col items-center justify-center text-xs ${
            location === "/admin/users"
              ? "text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users
            className={`h-6 w-6 mb-1 ${
              location === "/admin/users" ? "text-primary" : "text-gray-500"
            }`}
          />
          Users
        </Link>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center text-xs text-gray-500 hover:text-gray-700"
        >
          <LogOut className="h-6 w-6 mb-1 text-gray-500" />
          Sign Out
        </button>
      </div>
    </div>
  );
}