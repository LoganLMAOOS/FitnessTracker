import { Home, BarChart2, Plus, User } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location, navigate] = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 max-w-md mx-auto ios-padding-bottom">
      <div className="flex justify-around">
        <button 
          className={cn(
            "flex flex-col items-center py-3 px-4",
            location === "/" ? "text-primary" : "text-gray-500 hover:text-primary"
          )}
          onClick={() => navigate("/")}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Home</span>
        </button>
        
        <button 
          className={cn(
            "flex flex-col items-center py-3 px-4",
            location === "/progress" ? "text-primary" : "text-gray-500 hover:text-primary"
          )}
          onClick={() => navigate("/progress")}
        >
          <BarChart2 className="h-5 w-5" />
          <span className="text-xs mt-1">Progress</span>
        </button>
        
        <button 
          className="flex flex-col items-center py-3 px-4 relative"
          onClick={() => navigate("/log-workout")}
        >
          <div className="absolute -top-5 flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white shadow-lg">
            <Plus className="h-6 w-6" />
          </div>
          <span className="text-xs mt-7 text-primary">Workout</span>
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
