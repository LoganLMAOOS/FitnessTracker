import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Membership } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

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
    mutationFn: async (tier: string) => {
      const res = await apiRequest("POST", "/api/membership/upgrade", { tier });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/membership"] });
      toast({
        title: "Membership upgraded",
        description: "Your membership has been successfully upgraded",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upgrade failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const redeemKeyMutation = useMutation({
    mutationFn: async (key: string) => {
      const res = await apiRequest("POST", "/api/membership/redeem", { key });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/membership"] });
      toast({
        title: "Key redeemed successfully",
        description: `You now have ${data.tier} membership`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to redeem key",
        description: error.message,
        variant: "destructive",
      });
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
