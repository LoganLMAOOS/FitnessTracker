import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  User,
  Bell,
  Lock,
  Globe,
  Moon,
  Eye,
  Smartphone,
  RefreshCw,
  Trash2,
  LogOut,
  ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/bottom-nav";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Settings" />
      
      <main className="pt-16 pb-4">
        <div className="px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Button>
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">
              Manage your account preferences and app settings
            </p>
          </div>
          
          {/* Account Settings */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
              
              <div className="space-y-3">
                <Button variant="ghost" className="w-full justify-between" onClick={() => navigate("/profile")}>
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-primary" />
                    <span>Profile Information</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
                
                <Button variant="ghost" className="w-full justify-between" onClick={() => navigate("/membership")}>
                  <div className="flex items-center">
                    <Lock className="mr-2 h-4 w-4 text-primary" />
                    <span>Membership & Billing</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
                
                <Button variant="ghost" className="w-full justify-between" onClick={() => navigate("/privacy")}>
                  <div className="flex items-center">
                    <Eye className="mr-2 h-4 w-4 text-primary" />
                    <span>Privacy & Data</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Notification Settings */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="mr-2 h-4 w-4 text-primary" />
                    <Label htmlFor="workout-reminders">Workout Reminders</Label>
                  </div>
                  <Switch id="workout-reminders" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="mr-2 h-4 w-4 text-primary" />
                    <Label htmlFor="goal-alerts">Goal Alerts</Label>
                  </div>
                  <Switch id="goal-alerts" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="mr-2 h-4 w-4 text-primary" />
                    <Label htmlFor="app-updates">App Updates</Label>
                  </div>
                  <Switch id="app-updates" defaultChecked />
                </div>
                
                <Button variant="ghost" className="w-full justify-between mt-2" onClick={() => navigate("/notifications")}>
                  <div className="flex items-center">
                    <Bell className="mr-2 h-4 w-4 text-primary" />
                    <span>Manage All Notifications</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* App Settings */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">App Settings</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="mr-2 h-4 w-4 text-primary" />
                    <Label htmlFor="language">Language</Label>
                  </div>
                  <div className="text-sm text-gray-500">English</div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Moon className="mr-2 h-4 w-4 text-primary" />
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                  </div>
                  <Switch id="dark-mode" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Smartphone className="mr-2 h-4 w-4 text-primary" />
                    <Label htmlFor="mobile-data">Use Mobile Data</Label>
                  </div>
                  <Switch id="mobile-data" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Advanced Settings */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Advanced Settings</h2>
              
              <div className="space-y-3">
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <RefreshCw className="mr-2 h-4 w-4 text-primary" />
                    <span>Sync Data</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
                
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                    <span className="text-red-500">Clear App Data</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
                
                <Button variant="ghost" className="w-full justify-between" onClick={handleLogout}>
                  <div className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4 text-red-500" />
                    <span className="text-red-500">Log Out</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-center text-xs text-gray-500 mt-6">
            <p>FitTrack v1.0.0</p>
            <p className="mt-1">© 2023 FitTrack. All rights reserved.</p>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}