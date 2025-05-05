
import { Home, BarChart2, Plus, User } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location, navigate] = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 max-w-md mx-auto ios-padding-bottom">
      <div className="grid grid-cols-4 items-center relative">
        <button 
          className={cn(
            "flex flex-col items-center py-3",
            location === "/" ? "text-primary" : "text-gray-500 hover:text-primary"
          )}
          onClick={() => navigate("/")}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </button>
        
        <button 
          className={cn(
            "flex flex-col items-center py-3",
            location === "/progress" ? "text-primary" : "text-gray-500 hover:text-primary"
          )}
          onClick={() => navigate("/progress")}
        >
          <BarChart2 className="h-5 w-5" />
          <span className="text-xs mt-1">Progress</span>
        </button>
        
        <button 
          className="flex flex-col items-center"
          onClick={() => navigate("/log-workout")}
        >
          <div className="flex items-center justify-center h-14 w-14 -mt-6 rounded-full bg-primary text-white shadow-lg">
            <Plus className="h-7 w-7" />
          </div>
          <span className="text-xs mt-1 text-primary">Workout</span>
        </button>
        
        <button 
          className={cn(
            "flex flex-col items-center py-3",
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
