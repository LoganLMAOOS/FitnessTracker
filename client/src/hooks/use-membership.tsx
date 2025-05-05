import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Membership } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle } from "lucide-react";

type MembershipContextType = {
  membership: Membership | null;
  isLoading: boolean;
  upgradeMutation: any;
  redeemKeyMutation: any;
  membershipFeatures: {
    [key: string]: {
      workoutLogLimit: number | null;
      exerciseLibrarySize: number;
      goalLimit: number;
      supportsPfCard: boolean;
      supportsPfAnalytics: boolean;
      supportsAppleBasic: boolean;
      supportsAppleFull: boolean;
      supportsAdvancedAnalytics: boolean;
      featureList: string[];
    }
  }
};

export const membershipFeatures = {
  free: {
    workoutLogLimit: 5, // per week
    exerciseLibrarySize: 20,
    goalLimit: 1,
    supportsPfCard: true,
    supportsPfAnalytics: false,
    supportsAppleBasic: false,
    supportsAppleFull: false,
    supportsAdvancedAnalytics: false,
    featureList: [
      "Limited to 5 workout logs per week",
      "Basic exercise library (20 exercises)",
      "Simple progress tracking",
      "Single goal tracking",
      "Basic Planet Fitness account linking",
      "Digital PF membership card"
    ]
  },
  premium: {
    workoutLogLimit: null, // unlimited
    exerciseLibrarySize: 100,
    goalLimit: 5,
    supportsPfCard: true,
    supportsPfAnalytics: true,
    supportsAppleBasic: true,
    supportsAppleFull: false,
    supportsAdvancedAnalytics: false,
    featureList: [
      "Unlimited workout logging",
      "Extended exercise library (100+ exercises)",
      "Customizable workout routines",
      "Weight tracking with BMI calculator",
      "Weekly progress reports",
      "Advanced goal setting (up to 5 concurrent goals)",
      "Nutrition logging basics",
      "Basic Apple Fitness data import (workouts only)",
      "Full Planet Fitness data integration",
      "Planet Fitness visit reminders",
      "Enhanced digital membership card with history",
      "Quick check-in shortcuts"
    ]
  },
  pro: {
    workoutLogLimit: null, // unlimited
    exerciseLibrarySize: 200,
    goalLimit: 10,
    supportsPfCard: true,
    supportsPfAnalytics: true,
    supportsAppleBasic: true,
    supportsAppleFull: true,
    supportsAdvancedAnalytics: true,
    featureList: [
      "All Premium features",
      "Detailed performance analytics",
      "Workout plan generator",
      "Exercise technique guides",
      "Progress photos storage",
      "Rest day recommendations",
      "Body measurements tracking",
      "Export data to CSV/PDF",
      "Nutrition macro tracking",
      "Full Apple Fitness integration",
      "Historical Apple Fitness data import",
      "Enhanced Planet Fitness analytics",
      "PF equipment recommendations",
      "Combined gym and home workout planning",
      "Multiple membership card support",
      "Check-in notifications"
    ]
  },
  elite: {
    workoutLogLimit: null, // unlimited
    exerciseLibrarySize: 300,
    goalLimit: null, // unlimited
    supportsPfCard: true,
    supportsPfAnalytics: true,
    supportsAppleBasic: true,
    supportsAppleFull: true,
    supportsAdvancedAnalytics: true,
    featureList: [
      "All Pro features",
      "AI-powered workout recommendations",
      "Personal records tracking",
      "Advanced performance metrics",
      "Priority support",
      "Customizable analytics dashboard",
      "Workout sharing capabilities",
      "Heart rate zone calculator",
      "Fitness age estimation",
      "Sleep quality tracking integration",
      "Advanced Apple Fitness integration",
      "Premium Planet Fitness insights",
      "Multi-gym profile support",
      "Personal trainer recommendation engine",
      "Family membership card management",
      "Premium check-in features"
    ]
  }
};

export const MembershipContext = createContext<MembershipContextType | null>(null);

export function MembershipProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const {
    data: membership,
    isLoading,
  } = useQuery<Membership | null>({
    queryKey: ["/api/membership"],
    queryFn: async ({ queryKey }) => {
      if (!user) return null;
      const response = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch membership");
      }
      return response.json();
    },
    enabled: !!user,
  });

  const upgradeMutation = useMutation({
    mutationFn: async ({ tier, membershipKey, forceApply = false }: { tier: string, membershipKey: string, forceApply?: boolean }) => {
      const res = await apiRequest("POST", "/api/membership/upgrade", { tier, membershipKey, forceApply });
      
      // If response returns a keyData property but not in a 200 status
      if (!res.ok) {
        const data = await res.json();
        
        if (data.keyData && data.canBypass) {
          const error = new Error(data.message || "Error processing membership key");
          (error as any).canBypass = data.canBypass;
          (error as any).keyData = data.keyData;
          throw error;
        }
        
        throw new Error(data.message || "Failed to upgrade membership");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/membership"] });
      toast({
        title: data.message || "Membership upgraded",
        description: `You now have ${data.tier || "the upgraded"} membership`,
      });
    },
    onError: (error: Error) => {
      const errorObject = error as any;
      
      // If the error can be bypassed (already used key, etc.)
      if (errorObject.canBypass) {
        toast({
          title: "Confirmation Required",
          description: (
            <div className="space-y-1">
              <p>{error.message}</p>
              <p className="text-sm text-muted-foreground">
                You can proceed with this key by confirming your choice.
              </p>
            </div>
          ),
          variant: "default",
        });
      } else {
        toast({
          title: "Upgrade Not Completed",
          description: (
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <span>{error.message}</span>
            </div>
          ),
          variant: "destructive",
        });
      }
    },
  });

  const redeemKeyMutation = useMutation({
    mutationFn: async ({ key, forceApply = false }: { key: string, forceApply?: boolean }) => {
      const res = await apiRequest("POST", "/api/membership/redeem", { key, forceApply });
      const data = await res.json();
      
      // Check if it's an information response rather than an actual redemption
      if (data.status === "current_subscription" && !forceApply) {
        // Add bypass information to the error for the UI to handle
        const error = new Error(data.message);
        (error as any).canBypass = data.canBypass;
        (error as any).keyData = data.keyData;
        (error as any).currentPlan = data.currentPlan;
        (error as any).timeRemaining = data.timeRemaining;
        throw error;
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/membership"] });
      toast({
        title: data.message || "Key redeemed successfully",
        description: `You now have ${data.tier} membership`,
        variant: data.message?.includes("override") ? "default" : "default"
      });
    },
    onError: (error: Error) => {
      const errorMessage = error.message;
      const errorObject = error as any;
      
      // Handle bypass scenarios and other non-critical issues
      if (errorObject.canBypass) {
        if (errorMessage.startsWith("You currently have an active")) {
          toast({
            title: "Subscription Status",
            description: (
              <div className="space-y-1">
                <p>{errorMessage}</p>
                <p className="text-sm text-muted-foreground">
                  You can choose to apply this key anyway.
                </p>
              </div>
            ),
            variant: "default",
          });
        } else if (errorMessage.includes("already been redeemed")) {
          toast({
            title: "Key Already Used",
            description: (
              <div className="space-y-1">
                <p>{errorMessage}</p>
                <p className="text-sm text-muted-foreground">
                  This key has previously been used, but you may still apply it.
                </p>
              </div>
            ),
            variant: "default",
          });
        }
      } 
      // Information about current subscription without bypass option
      else if (errorMessage.startsWith("You currently have an active")) {
        toast({
          title: "Current Subscription Information",
          description: errorMessage,
          variant: "default",
        });
      } 
      // Regular error
      else {
        toast({
          title: "Membership Key Issue",
          description: (
            <div className="flex flex-col space-y-2">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
          ),
          variant: "destructive",
        });
      }
    },
  });

  return (
    <MembershipContext.Provider
      value={{
        membership,
        isLoading,
        upgradeMutation,
        redeemKeyMutation,
        membershipFeatures
      }}
    >
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership() {
  const context = useContext(MembershipContext);
  if (!context) {
    throw new Error("useMembership must be used within a MembershipProvider");
  }
  return context;
}
