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
import SettingsPage from "@/pages/settings-page";
import NotificationsPage from "@/pages/notifications-page";
import PrivacyPage from "@/pages/privacy-page";
import HelpPage from "@/pages/help-page";
import { AuthProvider, useAuth } from "./hooks/use-auth";
import { MembershipProvider } from "./hooks/use-membership";
import { QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

function App() {
  const { user, isLoading } = useAuth();

  // Show loading state while authentication status is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If not logged in, show auth page or redirect to it
  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          <Redirect to="/auth" />
        </Route>
      </Switch>
    );
  }

  // For owner/admin users - show admin panel
  if (user.role === "owner" || user.role === "admin") {
    return (
      <Switch>
        <Route path="/admin" component={AdminPage} />
        <Route path="/admin/users" component={AdminPage} />
        <Route path="/admin/:tab">
          <Redirect to="/admin" />
        </Route>
        <Route path="/auth" component={AuthPage} />
        <Route path="/" component={HomePage} />
        <Route path="/log-workout" component={LogWorkoutPage} />
        <Route path="/progress" component={ProgressPage} />
        <Route path="/exercises" component={ExercisesPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/membership" component={MembershipPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/help" component={HelpPage} />
        <Route>
          <Redirect to="/admin" />
        </Route>
      </Switch>
    );
  }

  // Regular users see fitness tracking features
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/log-workout" component={LogWorkoutPage} />
      <Route path="/progress" component={ProgressPage} />
      <Route path="/exercises" component={ExercisesPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/membership" component={MembershipPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/help" component={HelpPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/admin">
        <Redirect to="/" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MembershipProvider>
          <TooltipProvider>
            <Toaster />
            <App />
          </TooltipProvider>
        </MembershipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default AppWrapper;