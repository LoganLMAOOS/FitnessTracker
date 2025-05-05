import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import LogWorkoutPage from "@/pages/log-workout-page";
import ProgressPage from "@/pages/progress-page";
import ExercisesPage from "@/pages/exercises-page";
import ProfilePage from "@/pages/profile-page";
import MembershipPage from "@/pages/membership-page";
import AdminPage from "@/pages/admin-page";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { MembershipProvider } from "./hooks/use-membership";
import { QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// AdminApp is a completely separate app experience for owner/admin
function AdminApp() {
  const { user, logoutMutation } = useAuth();
  
  if (!user || (user.role !== "admin" && user.role !== "owner")) {
    return <Redirect to="/auth" />;
  }
  
  return (
    <div className="admin-app">
      <AdminPage />
    </div>
  );
}

// Regular user app with all fitness tracking features
function UserApp() {
  const { user } = useAuth();
  
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/log-workout" component={LogWorkoutPage} />
      <Route path="/progress" component={ProgressPage} />
      <Route path="/exercises" component={ExercisesPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/membership" component={MembershipPage} />
      <Route path="/admin">
        <Redirect to="/" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

// LoginApp for unauthenticated users
function LoginApp() {
  return <AuthPage />;
}

// App router that determines which app to show based on user role
function AppRouter() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={LoginApp} />
        <Route>
          <Redirect to="/auth" />
        </Route>
      </Switch>
    );
  }
  
  // For owner/admin accounts, show ONLY the admin interface
  if (user.role === "owner" || user.role === "admin") {
    return (
      <Switch>
        <Route path="/admin" component={AdminApp} />
        <Route>
          <Redirect to="/admin" />
        </Route>
      </Switch>
    );
  }
  
  // For regular users, show the fitness tracking experience
  return <UserApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MembershipProvider>
          <TooltipProvider>
            <Toaster />
            <AppRouter />
          </TooltipProvider>
        </MembershipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;