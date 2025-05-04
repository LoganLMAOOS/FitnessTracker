import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PfIntegration } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  LogOut,
  User as UserIcon,
  Lock,
  Bell,
  Crown,
  ArrowRight,
  AppleIcon,
} from "lucide-react";

// Schema for Planet Fitness integration
const pfIntegrationSchema = z.object({
  pfMemberNumber: z.string().min(8, "Member number must be at least 8 characters"),
  pfQrCode: z.string().min(1, "QR code is required"),
  pfHomeGym: z.string().min(3, "Home gym name is required"),
});

type PfIntegrationFormValues = z.infer<typeof pfIntegrationSchema>;

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { membership } = useMembership();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [showConnectPFDialog, setShowConnectPFDialog] = useState(false);
  const [showAppleDialog, setShowAppleDialog] = useState(false);
  
  // Fetch Planet Fitness integration
  const {
    data: pfIntegration,
    isLoading: isPfLoading,
  } = useQuery<PfIntegration>({
    queryKey: ["/api/pf-integration"],
    enabled: !!user,
  });
  
  // Fetch Apple Fitness integration
  const {
    data: appleIntegration,
    isLoading: isAppleLoading,
  } = useQuery({
    queryKey: ["/api/apple-integration"],
    enabled: !!user,
  });
  
  const pfForm = useForm<PfIntegrationFormValues>({
    resolver: zodResolver(pfIntegrationSchema),
    defaultValues: {
      pfMemberNumber: "",
      pfQrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", // Placeholder
      pfHomeGym: "",
    },
  });
  
  const connectPFMutation = useMutation({
    mutationFn: async (data: PfIntegrationFormValues) => {
      const res = await apiRequest("POST", "/api/pf-integration", {
        ...data,
        userId: user!.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pf-integration"] });
      setShowConnectPFDialog(false);
      toast({
        title: "Planet Fitness connected",
        description: "Your Planet Fitness account has been successfully connected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const connectAppleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/apple-integration", {
        isConnected: true,
        data: {
          lastSync: new Date(),
          connectedAt: new Date(),
          deviceInfo: {
            device: navigator.userAgent.indexOf('iPhone') > -1 ? 'iPhone' : 'Other',
            platform: 'Web',
            osVersion: navigator.userAgent
          }
        },
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apple-integration"] });
      setShowAppleDialog(false);
      toast({
        title: "Apple Fitness connected",
        description: "Your Apple Fitness account has been successfully connected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const syncAppleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/apple-integration/sync", {});
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/apple-integration"] });
      toast({
        title: "Apple Fitness synced",
        description: `Synced ${data.syncResults.newWorkouts} workouts, ${data.syncResults.newActivities} activities, and ${data.syncResults.newSteps} steps.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const disconnectAppleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/apple-integration", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apple-integration"] });
      setShowAppleDialog(false);
      toast({
        title: "Apple Fitness disconnected",
        description: "Your Apple Fitness account has been disconnected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmitPfForm = (data: PfIntegrationFormValues) => {
    connectPFMutation.mutate(data);
  };
  
  const handleConnectApple = () => {
    const tierMinimum = "premium";
    const tierRank = {
      free: 0,
      premium: 1,
      pro: 2,
      elite: 3
    };
    
    // Check if user's tier is high enough for Apple Fitness
    if (membership && tierRank[(membership.tier as keyof typeof tierRank)] < tierRank[tierMinimum]) {
      toast({
        title: "Membership tier required",
        description: `Apple Fitness integration requires at least a ${tierMinimum} membership.`,
        variant: "destructive",
      });
      return;
    }
    
    setShowAppleDialog(true);
  };
  
  const confirmAppleConnect = () => {
    connectAppleMutation.mutate();
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };
  
  const userInitials = user?.displayName 
    ? user.displayName.split(" ").map(n => n[0]).join("").toUpperCase() 
    : user?.username?.substring(0, 2).toUpperCase() || "U";
  
  const memberSince = user?.createdAt 
    ? format(new Date(user.createdAt), "MMMM d, yyyy")
    : "N/A";
  
  const subscriptionRenews = membership?.endDate
    ? format(new Date(membership.endDate), "MMMM d, yyyy")
    : "N/A";
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Profile" />
      
      <main className="pt-16 pb-4">
        <div className="px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          
          <Card className="mb-6 overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-primary-800 px-5 py-6">
              <div className="flex items-center">
                <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-primary text-2xl font-bold shadow-lg">
                  {userInitials}
                </div>
                <div className="ml-4 text-white">
                  <h2 className="text-xl font-bold">{user?.displayName || user?.username}</h2>
                  <p className="opacity-90">{user?.email || "No email provided"}</p>
                  <div className="mt-1 flex items-center">
                    <div className="px-2 py-0.5 bg-white/20 rounded-full text-xs backdrop-blur-sm">
                      <Crown className="inline-block mr-1 h-3 w-3" />
                      {membership && membership.tier 
                        ? membership.tier.charAt(0).toUpperCase() + membership.tier.slice(1) 
                        : "Free"} Member
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <CardContent className="p-5">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <svg className="text-gray-500 h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span className="text-gray-700">Member since</span>
                </div>
                <span className="font-medium">{memberSince}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div className="flex items-center">
                  <svg className="text-gray-500 h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span className="text-gray-700">Subscription renews</span>
                </div>
                <span className="font-medium">{subscriptionRenews}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <div className="flex items-center">
                  <svg className="text-gray-500 h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20v-6M6 20V10M18 20V4" />
                  </svg>
                  <span className="text-gray-700">Workouts completed</span>
                </div>
                <span className="font-medium">42</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Account Settings</h3>
              <ul>
                <li className="py-3 border-b border-gray-100">
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center">
                      <UserIcon className="text-gray-500 h-5 w-5 mr-3" />
                      <span className="text-gray-700">Edit Profile</span>
                    </div>
                    <ArrowRight className="text-gray-400 h-5 w-5" />
                  </Button>
                </li>
                <li className="py-3 border-b border-gray-100">
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center">
                      <Lock className="text-gray-500 h-5 w-5 mr-3" />
                      <span className="text-gray-700">Change Password</span>
                    </div>
                    <ArrowRight className="text-gray-400 h-5 w-5" />
                  </Button>
                </li>
                <li className="py-3 border-b border-gray-100">
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <div className="flex items-center">
                      <Bell className="text-gray-500 h-5 w-5 mr-3" />
                      <span className="text-gray-700">Notifications</span>
                    </div>
                    <ArrowRight className="text-gray-400 h-5 w-5" />
                  </Button>
                </li>
                <li className="py-3 border-b border-gray-100">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-0 h-auto"
                    onClick={() => navigate("/membership")}
                  >
                    <div className="flex items-center">
                      <Crown className="text-gray-500 h-5 w-5 mr-3" />
                      <span className="text-gray-700">Membership Plan</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-primary mr-2">
                        {membership && membership.tier 
                          ? membership.tier.charAt(0).toUpperCase() + membership.tier.slice(1) 
                          : "Free"}
                      </span>
                      <ArrowRight className="text-gray-400 h-5 w-5" />
                    </div>
                  </Button>
                </li>
                <li className="py-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start p-0 h-auto text-red-500 hover:text-red-700"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center">
                      <LogOut className="h-5 w-5 mr-3" />
                      <span>Sign Out</span>
                    </div>
                  </Button>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Connected Services</h3>
              <ul>
                <li className="py-3 border-b border-gray-100">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-0 h-auto"
                    onClick={handleConnectApple}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center mr-3">
                        <AppleIcon className="text-white h-5 w-5" />
                      </div>
                      <span className="text-gray-700">Apple Fitness</span>
                    </div>
                    <div className="flex items-center">
                      {isAppleLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                      ) : (appleIntegration as any)?.isConnected ? (
                        <span className="text-sm text-green-600 mr-2">Connected</span>
                      ) : (
                        <span className="text-sm text-gray-400 mr-2">Not Connected</span>
                      )}
                      <ArrowRight className="text-gray-400 h-5 w-5" />
                    </div>
                  </Button>
                </li>
                <li className="py-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-0 h-auto"
                    onClick={() => setShowConnectPFDialog(true)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-[#5A297A] flex items-center justify-center mr-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                          <rect width="24" height="24" rx="4" fill="#5A297A"/>
                          <path d="M12 6L7 10H17L12 6Z" fill="#F6DB01"/>
                          <path d="M7 14H17L12 18L7 14Z" fill="#F6DB01"/>
                        </svg>
                      </div>
                      <span className="text-gray-700">Planet Fitness</span>
                    </div>
                    <div className="flex items-center">
                      {isPfLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                      ) : pfIntegration ? (
                        <span className="text-sm text-green-600 mr-2">Connected</span>
                      ) : (
                        <span className="text-sm text-gray-400 mr-2">Not Connected</span>
                      )}
                      <ArrowRight className="text-gray-400 h-5 w-5" />
                    </div>
                  </Button>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Connect Planet Fitness Dialog */}
      <Dialog open={showConnectPFDialog} onOpenChange={setShowConnectPFDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Planet Fitness</DialogTitle>
            <DialogDescription>
              Enter your Planet Fitness membership details to connect your account
            </DialogDescription>
          </DialogHeader>
          
          <Form {...pfForm}>
            <form onSubmit={pfForm.handleSubmit(onSubmitPfForm)} className="space-y-4">
              <FormField
                control={pfForm.control}
                name="pfMemberNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your PF member number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={pfForm.control}
                name="pfHomeGym"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Home Gym</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your home gym location"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowConnectPFDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={connectPFMutation.isPending}
                >
                  {connectPFMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect Account"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Connect Apple Fitness Dialog */}
      <Dialog open={showAppleDialog} onOpenChange={setShowAppleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <AppleIcon className="text-white h-5 w-5" />
              </div>
              Connect Apple Fitness
            </DialogTitle>
            <DialogDescription className="text-center">
              Sync your Apple Fitness workout data with FitTrack
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-black flex items-center justify-center">
                <AppleIcon className="text-white h-10 w-10" />
              </div>
            </div>
            
            {(appleIntegration as any)?.isConnected ? (
              <div className="space-y-4">
                <div className="px-4 py-3 rounded-md bg-green-50 border border-green-100 text-green-700 text-sm">
                  <div className="flex items-center gap-2 font-medium">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2"/>
                      <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Connected to Apple Fitness
                  </div>
                  <p className="mt-1">Last synced: {(appleIntegration as any)?.data?.lastSync ? 
                    format(new Date((appleIntegration as any).data.lastSync), "MMM d, yyyy 'at' h:mm a") : 
                    "Just now"}</p>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Synced data:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Workouts
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Activity data
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Steps and distance
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-center text-sm text-gray-600">
                  By connecting to Apple Fitness, you'll be able to:
                </p>
                
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="mt-0.5 bg-primary/10 text-primary rounded-full p-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Import workouts</span>
                      <p className="text-gray-500">Sync your Apple Fitness workouts automatically</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="mt-0.5 bg-primary/10 text-primary rounded-full p-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Track activity</span>
                      <p className="text-gray-500">See your daily activity and progress</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="mt-0.5 bg-primary/10 text-primary rounded-full p-1">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Get insights</span>
                      <p className="text-gray-500">See comprehensive performance analytics</p>
                    </div>
                  </li>
                </ul>
                
                <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-md">
                  <p>Required permissions:</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>Workout data</li>
                    <li>Activity data</li>
                    <li>Steps and distance</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setShowAppleDialog(false)}
              className="mb-2 sm:mb-0"
            >
              {(appleIntegration as any)?.isConnected ? "Close" : "Cancel"}
            </Button>
            
            {(appleIntegration as any)?.isConnected ? (
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Trigger a new sync
                    syncAppleMutation.mutate();
                  }}
                  disabled={syncAppleMutation.isPending}
                >
                  {syncAppleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>Sync now</>
                  )}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    // Disconnect Apple Fitness
                    disconnectAppleMutation.mutate();
                  }}
                  disabled={disconnectAppleMutation.isPending}
                >
                  {disconnectAppleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    "Disconnect"
                  )}
                </Button>
              </div>
            ) : (
              <Button 
                onClick={confirmAppleConnect}
                disabled={connectAppleMutation.isPending}
                className="w-full sm:w-auto"
              >
                {connectAppleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect with Apple Fitness"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  );
}
