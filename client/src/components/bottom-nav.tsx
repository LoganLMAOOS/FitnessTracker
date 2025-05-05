import { Home, BarChart2, Plus, User } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location, navigate] = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 max-w-md mx-auto ios-padding-bottom">
      <div className="flex items-center relative">
        {/* Left side navigation items */}
        <div className="flex-1 flex justify-center space-x-4">
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
        </div>
        
        {/* Floating middle button */}
        <button 
          className="absolute left-1/2 -translate-x-1/2 -top-6 z-10"
          onClick={() => navigate("/log-workout")}
        >
          <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-white shadow-lg">
            <Plus className="h-7 w-7" />
          </div>
          <span className="text-xs mt-1 text-primary text-center block w-full">Workout</span>
        </button>
        
        {/* Right side navigation items */}
        <div className="flex-1 flex justify-center">
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
      </div>
    </nav>
  );
}
