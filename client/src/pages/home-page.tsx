import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { WorkoutCard } from "@/components/workout-card";
import { GoalCard } from "@/components/goal-card";
import { PfCard } from "@/components/pf-card";
import { ProgressChart } from "@/components/progress-chart";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { Workout, Goal, PfIntegration } from "@shared/schema";
import { useLocation } from "wouter";
import { Loader2, Terminal, ChevronRight, Plus, Flame, Clock } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const { membership } = useMembership();
  const [, navigate] = useLocation();
  
  // Fetch recent workouts
  const {
    data: recentWorkouts,
    isLoading: isWorkoutsLoading,
  } = useQuery<Workout[]>({
    queryKey: ["/api/workouts/recent"],
    enabled: !!user,
  });
  
  // Fetch goals
  const {
    data: goals,
    isLoading: isGoalsLoading,
  } = useQuery<Goal[]>({
    queryKey: ["/api/goals"],
    enabled: !!user,
  });
  
  // Fetch Planet Fitness integration
  const {
    data: pfIntegration,
    isLoading: isPfLoading,
  } = useQuery<PfIntegration>({
    queryKey: ["/api/pf-integration"],
    enabled: !!user,
  });
  
  // Calculate today's activity stats
  const [todayStats, setTodayStats] = useState({
    calories: 0,
    activeMinutes: 0,
  });
  
  useEffect(() => {
    if (recentWorkouts) {
      const today = new Date().setHours(0, 0, 0, 0);
      const todayWorkouts = recentWorkouts.filter(workout => {
        const workoutDate = new Date(workout.date).setHours(0, 0, 0, 0);
        return workoutDate === today;
      });
      
      const calories = todayWorkouts.reduce((sum, workout) => sum + (workout.caloriesBurned || 0), 0);
      const minutes = todayWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
      
      setTodayStats({
        calories,
        activeMinutes: minutes,
      });
    }
  }, [recentWorkouts]);
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header />
      
      <main className="pt-16 pb-4">
        <div className="px-4 py-4">
          {/* Welcome Section */}
          <div className="mb-6">
            <p className="text-gray-600 mb-1">Welcome back</p>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.displayName || user?.username}
            </h1>
            <div className="mt-1 flex items-center">
              <div className="flex items-center bg-primary-100 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
                <span>{membership?.tier.charAt(0).toUpperCase() + membership?.tier.slice(1) || "Free"}</span>
              </div>
              {membership?.endDate && (
                <>
                  <span className="mx-2 text-gray-300">|</span>
                  <div className="text-xs text-gray-500">
                    <span>
                      {Math.max(0, Math.ceil((new Date(membership.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                    </span> days remaining
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Today's Activity Summary */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Today's Activity</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary text-sm font-medium"
                onClick={() => navigate("/progress")}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Flame className="text-primary h-4 w-4" />
                  </div>
                  <span className="text-xs text-gray-400">Today</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Calories Burned</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.calories}</p>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="p-2 bg-secondary-100 rounded-lg">
                    <Clock className="text-secondary-600 h-4 w-4" />
                  </div>
                  <span className="text-xs text-gray-400">Today</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">Active Minutes</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.activeMinutes}</p>
              </div>
            </div>
          </div>
          
          {/* Quick Start Workout */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Start Workout</h2>
            <div className="bg-gradient-to-r from-primary to-primary-700 rounded-xl p-4 shadow-md text-white">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Plus className="text-white h-5 w-5" />
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold text-white">Start New Workout</h3>
                  <p className="text-primary-100 text-sm">Log your activity</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="ghost" 
                  className="bg-white/10 hover:bg-white/20 text-white rounded-lg"
                  onClick={() => navigate("/log-workout?type=cardio")}
                >
                  <Terminal className="mr-1 h-4 w-4" /> Cardio
                </Button>
                <Button 
                  variant="ghost" 
                  className="bg-white/10 hover:bg-white/20 text-white rounded-lg"
                  onClick={() => navigate("/log-workout?type=strength")}
                >
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                    <path d="M6 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v0Z" />
                    <path d="M15 11v4" />
                    <path d="M9 11v4" />
                    <path d="M12 11v4" />
                  </svg> Strength
                </Button>
              </div>
            </div>
          </div>
          
          {/* Recent Workouts */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Recent Workouts</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary text-sm font-medium"
                onClick={() => navigate("/progress")}
              >
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            
            {isWorkoutsLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentWorkouts && recentWorkouts.length > 0 ? (
              recentWorkouts.map(workout => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h3>
                <p className="text-gray-500 mb-4">Start tracking your fitness journey by logging your first workout.</p>
                <Button onClick={() => navigate("/log-workout")}>
                  Log Workout
                </Button>
              </div>
            )}
          </div>
          
          {/* Progress Chart */}
          <ProgressChart />
          
          {/* Planet Fitness Integration */}
          {isPfLoading ? (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Planet Fitness Membership</h2>
              <div className="flex justify-center p-8 bg-white rounded-xl shadow-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          ) : pfIntegration ? (
            <PfCard pfIntegration={pfIntegration} />
          ) : (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-4">Planet Fitness Membership</h2>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
                <svg className="h-12 w-12 mx-auto mb-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <path d="M8 12h.01" />
                  <path d="M12 12h.01" />
                  <path d="M16 12h.01" />
                </svg>
                <h3 className="font-medium text-gray-900 mb-2">Connect Your PF Membership</h3>
                <p className="text-gray-500 mb-4">Link your Planet Fitness membership to access your digital card.</p>
                <Button onClick={() => navigate("/profile")}>
                  Connect Account
                </Button>
              </div>
            </div>
          )}
          
          {/* Goals Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-900">Your Goals</h2>
              <Button 
                variant="ghost"
                size="sm"
                className="text-primary text-sm font-medium"
                onClick={() => navigate("/progress")}
              >
                <Plus className="mr-1 h-4 w-4" /> Add Goal
              </Button>
            </div>
            
            {isGoalsLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : goals && goals.length > 0 ? (
              <div className="space-y-3">
                {goals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No goals set</h3>
                <p className="text-gray-500 mb-4">Create fitness goals to stay motivated and track your progress.</p>
                <Button onClick={() => navigate("/progress")}>
                  Set a Goal
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
