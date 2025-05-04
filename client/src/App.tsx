import { Switch, Route } from "wouter";
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
import { AuthProvider } from "./hooks/use-auth";
import { MembershipProvider } from "./hooks/use-membership";
import { QueryClientProvider } from "@tanstack/react-query";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/log-workout" component={LogWorkoutPage} />
      <ProtectedRoute path="/progress" component={ProgressPage} />
      <ProtectedRoute path="/exercises" component={ExercisesPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/membership" component={MembershipPage} />
      <ProtectedRoute path="/admin" component={AdminPage} adminOnly={true} />
      <Route path="/auth">
        <AuthPage />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MembershipProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </MembershipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
