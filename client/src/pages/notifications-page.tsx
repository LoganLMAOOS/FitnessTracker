import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/bottom-nav";
import { useState } from "react";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // States for notification settings
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [goalAlerts, setGoalAlerts] = useState(true);
  const [appUpdates, setAppUpdates] = useState(false);
  const [progressReports, setProgressReports] = useState(true);
  const [membershipAlerts, setMembershipAlerts] = useState(true);
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Notifications" />
      
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">
              Manage how you receive alerts and notifications
            </p>
          </div>
          
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Workout Reminders</h3>
                    <p className="text-sm text-gray-500">Get reminders for scheduled workouts</p>
                  </div>
                  <Switch checked={workoutReminders} onCheckedChange={setWorkoutReminders} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Goal Alerts</h3>
                    <p className="text-sm text-gray-500">Receive alerts when you achieve goals</p>
                  </div>
                  <Switch checked={goalAlerts} onCheckedChange={setGoalAlerts} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">App Updates</h3>
                    <p className="text-sm text-gray-500">Get notified about new app features</p>
                  </div>
                  <Switch checked={appUpdates} onCheckedChange={setAppUpdates} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Progress Reports</h3>
                    <p className="text-sm text-gray-500">Weekly reports on your fitness progress</p>
                  </div>
                  <Switch checked={progressReports} onCheckedChange={setProgressReports} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">Membership Alerts</h3>
                    <p className="text-sm text-gray-500">Alerts about your membership status</p>
                  </div>
                  <Switch checked={membershipAlerts} onCheckedChange={setMembershipAlerts} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Button className="w-full" variant="outline">
              Save Preferences
            </Button>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}