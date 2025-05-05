import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Shield, Eye, Database, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/bottom-nav";
import { useState } from "react";

export default function PrivacyPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // States for privacy settings
  const [dataSharing, setDataSharing] = useState(false);
  const [anonymousAnalytics, setAnonymousAnalytics] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Privacy & Security" />
      
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy & Security</h1>
            <p className="text-gray-600">
              Manage your data and security settings
            </p>
          </div>
          
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    <Eye className="text-gray-500 h-5 w-5 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Profile Visibility</h3>
                      <p className="text-sm text-gray-500">Control who can see your profile information</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Private
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex">
                    <Database className="text-gray-500 h-5 w-5 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Data Sharing</h3>
                      <p className="text-sm text-gray-500">Share fitness data with third-party services</p>
                    </div>
                  </div>
                  <Switch checked={dataSharing} onCheckedChange={setDataSharing} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex">
                    <Shield className="text-gray-500 h-5 w-5 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Anonymous Analytics</h3>
                      <p className="text-sm text-gray-500">Help improve the app by sending anonymous usage data</p>
                    </div>
                  </div>
                  <Switch checked={anonymousAnalytics} onCheckedChange={setAnonymousAnalytics} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex">
                    <Lock className="text-gray-500 h-5 w-5 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-base font-medium text-gray-900">Two-Factor Authentication</h3>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Switch checked={twoFactorAuth} onCheckedChange={setTwoFactorAuth} />
                </div>
                
                <div className="border-t border-gray-100 pt-4">
                  <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Your data is processed according to our <a href="#" className="text-primary underline">Privacy Policy</a> and <a href="#" className="text-primary underline">Terms of Service</a>.
            </p>
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}