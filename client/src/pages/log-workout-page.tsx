import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertWorkoutSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, Heart, Dumbbell, SmilePlus } from "lucide-react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Cardio exercises
const cardioExercises = [
  "Running",
  "Walking",
  "Cycling",
  "Swimming",
  "Elliptical",
  "Stair Climbing",
  "Rowing",
  "Jump Rope",
  "HIIT",
  "Dancing",
];

// Strength exercises
const strengthExercises = [
  "Bench Press",
  "Squats",
  "Deadlifts",
  "Shoulder Press",
  "Pull Ups",
  "Push Ups",
  "Lunges",
  "Bicep Curls",
  "Tricep Extensions",
  "Leg Press",
];

// Extended the workout schema for form validation
const workoutFormSchema = insertWorkoutSchema.omit({ userId: true }).extend({
  workoutType: z.enum(["cardio", "strength"]),
  exercise: z.string().min(1, "Please select an exercise"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute"),
  intensity: z.enum(["low", "medium", "high"]),
  notes: z.string().optional(),
  mood: z.string().optional(),
  moodReason: z.string().optional(),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

export default function LogWorkoutPage() {
  const { user } = useAuth();
  const { membership } = useMembership();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Check for workout type from URL parameter
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const initialWorkoutType = searchParams.get("type") as "cardio" | "strength" || "cardio";
  
  const [workoutType, setWorkoutType] = useState<"cardio" | "strength">(initialWorkoutType);
  
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      workoutType: initialWorkoutType,
      exercise: "",
      duration: 30,
      intensity: "medium",
      notes: "",
      mood: "",
      moodReason: "",
    },
  });
  
  // Update workout type when form value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "workoutType" && value.workoutType) {
        setWorkoutType(value.workoutType as "cardio" | "strength");
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);
  
  // Fetch weekly workout count for free tier validation
  const { data: workouts } = useQuery({
    queryKey: ["/api/workouts"],
    enabled: membership?.tier === "free" && !!user,
  });
  
  const weeklyWorkoutCount = workouts?.filter(workout => {
    const workoutDate = new Date(workout.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return workoutDate >= weekAgo;
  }).length || 0;
  
  const logWorkoutMutation = useMutation({
    mutationFn: async (data: WorkoutFormValues) => {
      // Add user ID to the form data
      const workoutData = {
        ...data,
        userId: user!.id,
      };
      
      const res = await apiRequest("POST", "/api/workouts", workoutData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts/recent"] });
      
      toast({
        title: "Workout logged",
        description: "Your workout has been successfully logged.",
      });
      
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to log workout",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: WorkoutFormValues) => {
    // Check for free tier workout limit
    if (membership?.tier === "free" && weeklyWorkoutCount >= 5) {
      toast({
        title: "Workout limit reached",
        description: "Free tier limited to 5 workouts per week. Please upgrade your membership.",
        variant: "destructive",
      });
      return;
    }
    
    logWorkoutMutation.mutate(data);
  };
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Log Workout" />
      
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
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Workout Type</FormLabel>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="relative">
                    <FormField
                      control={form.control}
                      name="workoutType"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <input
                              {...field}
                              type="radio"
                              id="cardio"
                              value="cardio"
                              className="sr-only peer"
                              checked={field.value === "cardio"}
                              onChange={() => field.onChange("cardio")}
                            />
                          </FormControl>
                          <label
                            htmlFor="cardio"
                            className="flex flex-col items-center p-4 bg-white border rounded-xl shadow-sm cursor-pointer peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary hover:border-gray-300"
                          >
                            <div className="mb-2 p-2 bg-primary-100 rounded-lg">
                              <Heart className="text-primary h-5 w-5" />
                            </div>
                            <span className="font-medium">Cardio</span>
                          </label>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="relative">
                    <FormField
                      control={form.control}
                      name="workoutType"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <input
                              {...field}
                              type="radio"
                              id="strength"
                              value="strength"
                              className="sr-only peer"
                              checked={field.value === "strength"}
                              onChange={() => field.onChange("strength")}
                            />
                          </FormControl>
                          <label
                            htmlFor="strength"
                            className="flex flex-col items-center p-4 bg-white border rounded-xl shadow-sm cursor-pointer peer-checked:border-primary peer-checked:ring-2 peer-checked:ring-primary hover:border-gray-300"
                          >
                            <div className="mb-2 p-2 bg-secondary-100 rounded-lg">
                              <Dumbbell className="text-secondary-600 h-5 w-5" />
                            </div>
                            <span className="font-medium">Strength</span>
                          </label>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormMessage>
                  {form.formState.errors.workoutType?.message}
                </FormMessage>
              </div>
              
              <FormField
                control={form.control}
                name="exercise"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercise</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an exercise" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workoutType === "cardio"
                          ? cardioExercises.map((exercise) => (
                              <SelectItem key={exercise} value={exercise}>
                                {exercise}
                              </SelectItem>
                            ))
                          : strengthExercises.map((exercise) => (
                              <SelectItem key={exercise} value={exercise}>
                                {exercise}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Enter duration in minutes"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="intensity"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Intensity</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-2"
                      >
                        <div className="flex-1 relative">
                          <label
                            htmlFor="low"
                            className="flex justify-center items-center p-2 bg-white border rounded-lg shadow-sm cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary-50 hover:border-gray-300"
                            data-state={field.value === "low" ? "checked" : "unchecked"}
                          >
                            <RadioGroupItem value="low" id="low" className="sr-only" />
                            <span>Low</span>
                          </label>
                        </div>
                        <div className="flex-1 relative">
                          <label
                            htmlFor="medium"
                            className="flex justify-center items-center p-2 bg-white border rounded-lg shadow-sm cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary-50 hover:border-gray-300"
                            data-state={field.value === "medium" ? "checked" : "unchecked"}
                          >
                            <RadioGroupItem value="medium" id="medium" className="sr-only" />
                            <span>Medium</span>
                          </label>
                        </div>
                        <div className="flex-1 relative">
                          <label
                            htmlFor="high"
                            className="flex justify-center items-center p-2 bg-white border rounded-lg shadow-sm cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary-50 hover:border-gray-300"
                            data-state={field.value === "high" ? "checked" : "unchecked"}
                          >
                            <RadioGroupItem value="high" id="high" className="sr-only" />
                            <span>High</span>
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about your workout"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Mood Tracker Section */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <CardTitle className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-lg flex items-center">
                    <SmilePlus className="mr-2 h-5 w-5" />
                    How do you feel about this workout?
                  </CardTitle>
                  
                  <div className="p-4">
                    <FormField
                      control={form.control}
                      name="mood"
                      render={({ field }) => (
                        <FormItem>
                          <FormDescription>
                            Select an emoji that matches your mood after this workout
                          </FormDescription>
                          <div className="grid grid-cols-5 gap-2 my-3">
                            {["😀", "😊", "😐", "😫", "🤩", "💪", "😓", "🙌", "😴", "🔥"].map((emoji) => (
                              <Button
                                key={emoji}
                                type="button"
                                variant={field.value === emoji ? "default" : "outline"}
                                onClick={() => field.onChange(emoji)}
                                className="text-2xl h-12 hover:bg-primary-50"
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="moodReason"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="Why do you feel this way? (optional)"
                              rows={2}
                              {...field}
                              className="mt-2"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {membership?.tier === "free" && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="p-3 text-sm">
                    <p className="text-amber-800">
                      <strong>Free tier: </strong>
                      You've logged {weeklyWorkoutCount}/5 workouts this week.
                      {weeklyWorkoutCount >= 4 && (
                        <span className="block mt-1">
                          Consider upgrading to Premium for unlimited workouts.
                        </span>
                      )}
                    </p>
                  </CardContent>
                </Card>
              )}
              
              <Button
                type="submit"
                className="w-full"
                disabled={logWorkoutMutation.isPending}
              >
                {logWorkoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Workout"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
