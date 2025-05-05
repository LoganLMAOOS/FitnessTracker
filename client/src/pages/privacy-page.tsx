import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/bottom-nav";

export default function PrivacyPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Privacy Policy" />
      
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-gray-600">
              Last updated: May 1, 2023
            </p>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center mb-4">
                <Shield className="h-6 w-6 text-primary mr-2" />
                <h2 className="text-lg font-semibold">Your Data Privacy</h2>
              </div>
              
              <div className="space-y-4 text-sm">
                <p>
                  At FitTrack, we take your privacy seriously. This Privacy Policy outlines how 
                  we collect, use, and protect your personal information when you use our fitness 
                  tracking application.
                </p>
                
                <h3 className="font-semibold mt-4">Information We Collect</h3>
                <p>
                  When you use FitTrack, we collect the following types of information:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Account information (username, email, password)</li>
                  <li>Profile information (name, age, height, weight, fitness goals)</li>
                  <li>Workout data (exercises, duration, intensity, frequency)</li>
                  <li>Health metrics (heart rate, steps, calories burned)</li>
                  <li>Device information (device type, operating system, app version)</li>
                </ul>
                
                <h3 className="font-semibold mt-4">How We Use Your Information</h3>
                <p>
                  We use your information to:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Provide and improve our fitness tracking services</li>
                  <li>Personalize your workout recommendations</li>
                  <li>Track your progress toward fitness goals</li>
                  <li>Analyze app usage to enhance user experience</li>
                  <li>Communicate important updates about the app</li>
                </ul>
                
                <h3 className="font-semibold mt-4">Data Security</h3>
                <p>
                  We implement appropriate security measures to protect your personal information
                  from unauthorized access, alteration, disclosure, or destruction. We use 
                  industry-standard encryption protocols and regularly update our security practices.
                </p>
                
                <h3 className="font-semibold mt-4">Third-Party Services</h3>
                <p>
                  FitTrack may integrate with third-party services, such as Apple Fitness or Planet 
                  Fitness. When you connect these services, their respective privacy policies will 
                  also apply. We recommend reviewing these policies for complete understanding.
                </p>
                
                <h3 className="font-semibold mt-4">Your Rights</h3>
                <p>
                  You have the right to:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and associated data</li>
                  <li>Export your workout history</li>
                  <li>Opt out of marketing communications</li>
                </ul>
                
                <h3 className="font-semibold mt-4">Changes to This Policy</h3>
                <p>
                  We may update this Privacy Policy occasionally. We will notify you of any 
                  significant changes through the app or via email. Your continued use of 
                  FitTrack after such modifications constitutes your acceptance of the updated policy.
                </p>
                
                <h3 className="font-semibold mt-4">Contact Us</h3>
                <p>
                  If you have questions or concerns about this Privacy Policy or your data, 
                  please contact us at privacy@fittrack.app or through our Help & Support page.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}