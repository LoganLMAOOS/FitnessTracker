import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { WorkoutCard } from "@/components/workout-card";
import { GoalCard } from "@/components/goal-card";
import { ProgressChart } from "@/components/progress-chart";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { format, sub } from "date-fns";
import { Workout, Goal } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  BarChart3, 
  Activity, 
  Target, 
  Plus, 
  Calendar, 
  ChevronDown,
  Loader2
} from "lucide-react";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// Mock data for the charts
const monthlyData = [
  { name: "Jan", calories: 8500 },
  { name: "Feb", calories: 12000 },
  { name: "Mar", calories: 9800 },
  { name: "Apr", calories: 15000 },
  { name: "May", calories: 14000 },
  { name: "Jun", calories: 12500 },
];

const workoutTypeData = [
  { name: "Running", value: 35 },
  { name: "Cycling", value: 20 },
  { name: "HIIT", value: 15 },
  { name: "Weights", value: 25 },
  { name: "Other", value: 5 },
];

// Goal form schema
const goalFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  target: z.coerce.number().min(1, "Target must be at least 1"),
  unit: z.string().min(1, "Please select a unit"),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

export default function ProgressPage() {
  const { user } = useAuth();
  const { membership, membershipFeatures } = useMembership();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("workouts");
  const [showAddGoalDialog, setShowAddGoalDialog] = useState(false);
  
  // Fetch workouts
  const {
    data: workouts,
    isLoading: isWorkoutsLoading,
  } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
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
  
  // Set up goal form
  const goalForm = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      title: "",
      description: "",
      target: 10,
      unit: "km",
      endDate: format(sub(new Date(), { days: -30 }), "yyyy-MM-dd"),
    },
  });
  
  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (data: GoalFormValues) => {
      const goalData = {
        ...data,
        userId: user!.id,
        endDate: new Date(data.endDate),
      };
      
      const res = await apiRequest("POST", "/api/goals", goalData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      setShowAddGoalDialog(false);
      goalForm.reset();
      toast({
        title: "Goal created",
        description: "Your goal has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create goal",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmitGoal = (data: GoalFormValues) => {
    // Check if the user has reached their goal limit
    const tierLimits = {
      free: 1,
      premium: 5,
      pro: 10,
      elite: null, // null means unlimited
    };
    
    const tierLimit = membership 
      ? tierLimits[membership.tier as keyof typeof tierLimits] 
      : tierLimits.free;
    
    const activeGoals = goals?.filter(g => !g.isCompleted)?.length || 0;
    
    if (tierLimit !== null && activeGoals >= tierLimit) {
      toast({
        title: "Goal limit reached",
        description: `${membership?.tier} tier is limited to ${tierLimit} active goals. Please complete some goals or upgrade your membership.`,
        variant: "destructive",
      });
      return;
    }
    
    createGoalMutation.mutate(data);
  };
  
  // Filter workouts by date range
  const getFilteredWorkouts = (days = 7) => {
    if (!workouts) return [];
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate >= cutoffDate;
    });
  };
  
  // Calculate total calories burned
  const getTotalCalories = (filteredWorkouts: Workout[]) => {
    return filteredWorkouts.reduce((total, workout) => total + (workout.caloriesBurned || 0), 0);
  };
  
  // Get total workout time
  const getTotalWorkoutTime = (filteredWorkouts: Workout[]) => {
    return filteredWorkouts.reduce((total, workout) => total + workout.duration, 0);
  };
  
  const recentWorkouts = getFilteredWorkouts(30);
  const totalCalories = getTotalCalories(recentWorkouts);
  const totalWorkoutTime = getTotalWorkoutTime(recentWorkouts);
  const workoutCount = recentWorkouts.length;
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Progress" />
      
      <main className="pt-16 pb-4">
        <div className="px-4 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="workouts" className="flex items-center">
                <Activity className="mr-2 h-4 w-4" />
                Workouts
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center">
                <Target className="mr-2 h-4 w-4" />
                Goals
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" />
                Stats
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="workouts" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Your Workouts</h2>
                <Button 
                  size="sm" 
                  className="flex items-center"
                  onClick={() => window.location.href = "/log-workout"}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Log Workout
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Total Workouts</p>
                  <p className="text-xl font-semibold">{workoutCount}</p>
                  <p className="text-xs text-gray-400">Last 30 days</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Calories</p>
                  <p className="text-xl font-semibold">{totalCalories}</p>
                  <p className="text-xs text-gray-400">Burned</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1">Active Time</p>
                  <p className="text-xl font-semibold">{totalWorkoutTime} min</p>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
              </div>
              
              <ProgressChart title="Activity Overview" />
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Workout History</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-gray-500 flex items-center"
                  >
                    <Calendar className="mr-1 h-4 w-4" />
                    Filter
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </div>
                
                {isWorkoutsLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : workouts && workouts.length > 0 ? (
                  <div className="space-y-3">
                    {workouts.map(workout => (
                      <WorkoutCard key={workout.id} workout={workout} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                      <Activity className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No workouts yet</h3>
                    <p className="text-gray-500 mb-4">Start tracking your fitness journey by logging your first workout.</p>
                    <Button onClick={() => window.location.href = "/log-workout"}>
                      Log Workout
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="goals" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Your Goals</h2>
                <Button 
                  size="sm" 
                  className="flex items-center"
                  onClick={() => setShowAddGoalDialog(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  New Goal
                </Button>
              </div>
              
              {isGoalsLoading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : goals && goals.length > 0 ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Active Goals</h3>
                  <div className="space-y-3 mb-6">
                    {goals.filter(goal => !goal.isCompleted).map(goal => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                  
                  {goals.some(goal => goal.isCompleted) && (
                    <>
                      <h3 className="font-semibold text-gray-900 mb-3">Completed Goals</h3>
                      <div className="space-y-3">
                        {goals.filter(goal => goal.isCompleted).map(goal => (
                          <GoalCard key={goal.id} goal={goal} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                  <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No goals set</h3>
                  <p className="text-gray-500 mb-4">Set fitness goals to stay motivated and track your progress.</p>
                  <Button onClick={() => setShowAddGoalDialog(true)}>
                    Set a Goal
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="stats" className="space-y-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Your Statistics</h2>
                <p className="text-gray-600">
                  Detailed analytics of your fitness journey
                </p>
              </div>
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Monthly Progress</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 20, right: 0, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value} calories`, "Calories Burned"]}
                        contentStyle={{ borderRadius: "0.5rem" }}
                      />
                      <Bar 
                        dataKey="calories" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {(membership?.tier === "pro" || membership?.tier === "elite") && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Workout Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={workoutTypeData}
                        margin={{ top: 20, right: 0, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, "Percentage"]}
                          contentStyle={{ borderRadius: "0.5rem" }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="hsl(var(--secondary))" 
                          radius={[0, 4, 4, 0]} 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {membership?.tier === "elite" && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={monthlyData}
                        margin={{ top: 20, right: 0, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value) => [`${value} calories`, "Calories Burned"]}
                          contentStyle={{ borderRadius: "0.5rem" }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="calories" 
                          stroke="hsl(var(--primary))" 
                          activeDot={{ r: 8 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              
              {membership?.tier === "free" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-amber-800">
                  <h3 className="font-semibold mb-2">Upgrade for Advanced Analytics</h3>
                  <p className="text-sm mb-3">
                    Upgrade to Premium or higher to unlock detailed performance analytics, workout distribution, and personalized insights.
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => window.location.href = "/membership"}
                  >
                    View Plans
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Add Goal Dialog */}
      <Dialog open={showAddGoalDialog} onOpenChange={setShowAddGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
          </DialogHeader>
          
          <Form {...goalForm}>
            <form onSubmit={goalForm.handleSubmit(onSubmitGoal)} className="space-y-4">
              <FormField
                control={goalForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Goal Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Run 50km this month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={goalForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add details about your goal" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={goalForm.control}
                  name="target"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Value</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={goalForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="km">Kilometers</SelectItem>
                          <SelectItem value="miles">Miles</SelectItem>
                          <SelectItem value="calories">Calories</SelectItem>
                          <SelectItem value="workouts">Workouts</SelectItem>
                          <SelectItem value="sessions">Sessions</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={goalForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddGoalDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={createGoalMutation.isPending}
                >
                  {createGoalMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Goal"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  );
}
