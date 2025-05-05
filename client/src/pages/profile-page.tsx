import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { BottomNav } from "@/components/bottom-nav";
import { Header } from "@/components/header";
import { 
  Card, 
  CardContent, 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ArrowRight,
  Settings,
  UserCircle,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  Loader2,
} from "lucide-react";

// Schema for Planet Fitness integration
const pfIntegrationSchema = z.object({
  pfMemberNumber: z.string().min(1, "Member number is required"),
  pfHomeGym: z.string().min(1, "Home gym is required"),
});

// Apple Fitness Icon Component
function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12.4483 4.94292C12.3689 5.00708 10.8359 5.89375 10.8359 7.75625C10.9259 9.87542 12.7884 10.6654 12.8333 10.6654C12.8333 10.6654 12.5995 11.3946 11.9434 12.1971C11.3698 12.9042 10.778 13.6113 9.91717 13.6113C9.10133 13.6113 8.767 13.1058 7.81883 13.1058C6.8345 13.1058 6.2955 13.6113 5.57967 13.6113C4.71883 13.6113 4.08983 12.8588 3.48833 12.1517C2.69833 11.195 2.01467 9.64708 2.00017 8.17C1.98567 7.35417 2.165 6.55875 2.52517 5.89375C3.03633 4.94292 4.01117 4.31083 5.07817 4.29625C5.93317 4.28167 6.70833 4.87833 7.22533 4.87833C7.72683 4.87833 8.66033 4.29625 9.706 4.29625C10.0883 4.29625 11.4213 4.39625 12.4483 4.94292ZM7.01483 4.07133C6.85533 3.21658 7.36267 2.36183 7.8395 1.81458C8.423 1.16875 9.3085 0.75 10.0883 0.75C10.1333 1.60475 9.78767 2.44475 9.20417 3.06208C8.67767 3.72267 7.82267 4.18375 7.01483 4.07133Z" fill="currentColor" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  const [showConnectPFDialog, setShowConnectPFDialog] = useState(false);
  const [showAppleDialog, setShowAppleDialog] = useState(false);
  
  // Form for PF integration
  const pfForm = useForm({
    resolver: zodResolver(pfIntegrationSchema),
    defaultValues: {
      pfMemberNumber: "",
      pfHomeGym: "",
    },
  });
  
  // Planet Fitness integration
  const { 
    data: pfIntegration,
    isLoading: isPfLoading,
  } = useQuery({
    queryKey: ["/api/pf-integration"],
    enabled: user?.role !== "owner", // Don't fetch for owner accounts
  });
  
  // Apple Fitness integration
  const {
    data: appleIntegration,
    isLoading: isAppleLoading,
  } = useQuery({
    queryKey: ["/api/apple-integration"],
    enabled: user?.role !== "owner", // Don't fetch for owner accounts
  });
  
  // Connect Planet Fitness mutation
  const connectPFMutation = useMutation({
    mutationFn: async (data: z.infer<typeof pfIntegrationSchema>) => {
      const res = await apiRequest("POST", "/api/pf-integration", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pf-integration"] });
      setShowConnectPFDialog(false);
      toast({
        title: "Connected",
        description: "Your Planet Fitness membership has been connected",
      });
      pfForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Connect Apple Fitness mutation
  const connectAppleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/apple-integration/connect", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apple-integration"] });
      toast({
        title: "Connected",
        description: "Your Apple Fitness account has been connected",
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
  
  // Disconnect Apple Fitness mutation
  const disconnectAppleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/apple-integration/disconnect", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apple-integration"] });
      setShowAppleDialog(false);
      toast({
        title: "Disconnected",
        description: "Your Apple Fitness account has been disconnected",
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
  
  // Sync Apple Fitness data mutation
  const syncAppleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/apple-integration/sync", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/apple-integration"] });
      toast({
        title: "Synced",
        description: "Your Apple Fitness data has been synced",
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
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const handleConnectApple = () => {
    setShowAppleDialog(true);
  };
  
  const confirmAppleConnect = () => {
    connectAppleMutation.mutate();
  };
  
  const onSubmitPfForm = (data: z.infer<typeof pfIntegrationSchema>) => {
    connectPFMutation.mutate(data);
  };
  
  if (!user) return null;
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header title="Profile" />
      
      <main className="flex-1 container max-w-md mx-auto p-4">
        <div className="mb-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <UserCircle className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{user.username}</h2>
            <p className="text-gray-500 text-sm">
              Member since {format(new Date(user.createdAt || Date.now()), "MMMM yyyy")}
            </p>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Account</h3>
              <ul>
                <li className="py-3 border-b border-gray-100">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-0 h-auto"
                    onClick={() => navigate("/settings")}
                  >
                    <div className="flex items-center">
                      <Settings className="text-gray-500 h-5 w-5 mr-3" />
                      <span className="text-gray-700">Account Settings</span>
                    </div>
                    <ArrowRight className="text-gray-400 h-5 w-5" />
                  </Button>
                </li>
                <li className="py-3 border-b border-gray-100">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-0 h-auto"
                    onClick={() => navigate("/notifications")}
                  >
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
                    onClick={() => navigate("/privacy")}
                  >
                    <div className="flex items-center">
                      <Lock className="text-gray-500 h-5 w-5 mr-3" />
                      <span className="text-gray-700">Privacy & Security</span>
                    </div>
                    <ArrowRight className="text-gray-400 h-5 w-5" />
                  </Button>
                </li>
                <li className="py-3 border-b border-gray-100">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between p-0 h-auto"
                    onClick={() => navigate("/help")}
                  >
                    <div className="flex items-center">
                      <HelpCircle className="text-gray-500 h-5 w-5 mr-3" />
                      <span className="text-gray-700">Help & Support</span>
                    </div>
                    <ArrowRight className="text-gray-400 h-5 w-5" />
                  </Button>
                </li>

                {/* Admin Panel Access - Only for admin/owner roles */}
                {user?.role === "admin" || user?.role === "owner" ? (
                  <li className="py-3 border-b border-gray-100">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between p-0 h-auto"
                      onClick={() => navigate("/admin")}
                    >
                      <div className="flex items-center">
                        <svg className="text-gray-500 h-5 w-5 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 4.5a7.5 7.5 0 00-7.5 7.5h15a7.5 7.5 0 00-7.5-7.5z" />
                          <path d="M12.5 19.5v-2" />
                          <path d="M15.5 19.5v-2" />
                          <path d="M9.5 19.5v-2" />
                          <path d="M3.5 12h17" />
                        </svg>
                        <span className="text-gray-700">Admin Panel</span>
                      </div>
                      <ArrowRight className="text-gray-400 h-5 w-5" />
                    </Button>
                  </li>
                ) : null}
                
                {/* Sign Out Button - For all users */}
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
          
          {/* Connected Services - Only show for non-owner users */}
          {user?.role !== "owner" && (
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
          )}
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