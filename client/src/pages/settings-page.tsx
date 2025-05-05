import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/bottom-nav";

export default function SettingsPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Account Settings" />
      
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Settings</h1>
            <p className="text-gray-600">
              Manage your account preferences
            </p>
          </div>
          
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Personal Information</h2>
              <p className="text-sm text-gray-600 mb-2">
                Update your account details and personal information
              </p>
              <ul className="space-y-4 mt-4">
                <li className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Username</span>
                  <span className="font-medium">{user?.username}</span>
                </li>
                <li className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Email</span>
                  <span className="font-medium">user@example.com</span>
                </li>
                <li className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Password</span>
                  <Button size="sm" variant="outline">Change</Button>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Preferences</h2>
              <p className="text-sm text-gray-600">
                Customize your app experience
              </p>
              <ul className="space-y-4 mt-4">
                <li className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-700">Theme</span>
                  <span className="font-medium">Light</span>
                </li>
                <li className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Units</span>
                  <span className="font-medium">Imperial (lbs)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}