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
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { MembershipProvider } from "./hooks/use-membership";
import { QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Separate routers for regular users and admin/owner users
function UserRouter() {
  return (
    <Switch>
      <Route path="/">
        <HomePage />
      </Route>
      <Route path="/log-workout">
        <LogWorkoutPage />
      </Route>
      <Route path="/progress">
        <ProgressPage />
      </Route>
      <Route path="/exercises">
        <ExercisesPage />
      </Route>
      <Route path="/profile">
        <ProfilePage />
      </Route>
      <Route path="/membership">
        <MembershipPage />
      </Route>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/admin">
        <Redirect to="/" />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function OwnerRouter() {
  return (
    <Switch>
      <Route path="/admin">
        <AdminPage />
      </Route>
      <Route path="/profile">
        <ProfilePage />
      </Route>
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route path="/">
        <Redirect to="/admin" />
      </Route>
      <Route path="/log-workout">
        <Redirect to="/admin" />
      </Route>
      <Route path="/progress">
        <Redirect to="/admin" />
      </Route>
      <Route path="/exercises">
        <Redirect to="/admin" />
      </Route>
      <Route path="/membership">
        <Redirect to="/admin" />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

// Router picker based on user role
function RouterPicker() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return <AuthPage />;
  }
  
  // Owner gets admin-focused experience
  if (user.role === "owner") {
    return <OwnerRouter />;
  }
  
  // Regular users get fitness tracking
  return <UserRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MembershipProvider>
          <TooltipProvider>
            <Toaster />
            <RouterPicker />
          </TooltipProvider>
        </MembershipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;