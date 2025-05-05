import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Phone, Mail, MessageSquare, HelpCircle, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/bottom-nav";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function HelpPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Function to handle phone call
  const handlePhoneCall = () => {
    window.location.href = "tel:8454799191";
  };
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Help & Support" />
      
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Help & Support</h1>
            <p className="text-gray-600">
              Get assistance with your account and the app
            </p>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
              
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={handlePhoneCall}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Call Support: (845) 479-9191
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Support
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Live Chat
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I log a workout?</AccordionTrigger>
                  <AccordionContent>
                    To log a workout, navigate to the "Log Workout" tab in the bottom navigation. 
                    Select your workout type, duration, and enter the details of your exercises.
                    Don't forget to add your workout mood to get personalized insights!
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>How do I connect my fitness trackers?</AccordionTrigger>
                  <AccordionContent>
                    You can connect Apple Fitness or Planet Fitness memberships from your Profile page.
                    Select "Connected Services" and follow the prompts to link your accounts.
                    Premium and Pro memberships offer enhanced integration features.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>What are membership tiers?</AccordionTrigger>
                  <AccordionContent>
                    FitTrack offers several membership tiers: Free, Premium, Pro, and Elite.
                    Each tier provides different features and integrations.
                    You can upgrade your membership from the Membership page in your profile.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>How do I redeem a membership key?</AccordionTrigger>
                  <AccordionContent>
                    To redeem a membership key, go to the Membership page from your profile.
                    Scroll to the bottom and select "Redeem a Key". Enter your membership key 
                    and follow the prompts to activate your premium features.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>How do I track my progress?</AccordionTrigger>
                  <AccordionContent>
                    You can track your progress in the "Progress" tab of the app.
                    Here you'll find charts and visualizations of your workout history,
                    achievements, and fitness trends over time.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
          
          <Card className="mb-4">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Helpful Resources</h2>
              
              <ul className="space-y-3">
                <li>
                  <a href="#" className="flex items-center text-primary hover:underline">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>User Guide</span>
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-primary hover:underline">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Video Tutorials</span>
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-primary hover:underline">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Workout Tips</span>
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center text-primary hover:underline">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Community Forum</span>
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
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