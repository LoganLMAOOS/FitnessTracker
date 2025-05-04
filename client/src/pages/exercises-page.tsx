import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { Heart, Dumbbell, Search, ArrowRight, Crown, Play } from "lucide-react";

// Exercise categories
const categories = [
  "All",
  "Beginner",
  "Cardio",
  "Strength",
  "HIIT",
  "Yoga",
  "Stretching",
  "Core",
  "Lower Body",
  "Upper Body",
];

// Basic exercises available to free tier
const basicExercises = [
  {
    id: 1,
    name: "Running",
    category: "Cardio",
    difficulty: "Beginner",
    muscles: ["Legs", "Cardio"],
    description: "Classic cardiovascular exercise that improves endurance and burns calories.",
    icon: <Heart className="h-5 w-5" />,
    premium: false,
  },
  {
    id: 2,
    name: "Push Ups",
    category: "Strength",
    difficulty: "Beginner",
    muscles: ["Chest", "Triceps", "Shoulders"],
    description: "Bodyweight exercise that targets the chest, shoulders, and triceps.",
    icon: <Dumbbell className="h-5 w-5" />,
    premium: false,
  },
  {
    id: 3,
    name: "Squats",
    category: "Strength",
    difficulty: "Beginner",
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
    description: "Compound exercise that primarily targets the quadriceps, hamstrings, and glutes.",
    icon: <Dumbbell className="h-5 w-5" />,
    premium: false,
  },
  {
    id: 4,
    name: "Plank",
    category: "Core",
    difficulty: "Beginner",
    muscles: ["Core", "Shoulders"],
    description: "Core strengthening exercise that also engages the shoulders and back.",
    icon: <Dumbbell className="h-5 w-5" />,
    premium: false,
  },
  {
    id: 5,
    name: "Jumping Jacks",
    category: "Cardio",
    difficulty: "Beginner",
    muscles: ["Full body", "Cardio"],
    description: "Full body cardiovascular exercise that increases heart rate and improves coordination.",
    icon: <Heart className="h-5 w-5" />,
    premium: false,
  },
  {
    id: 6,
    name: "Lunges",
    category: "Strength",
    difficulty: "Beginner",
    muscles: ["Quadriceps", "Glutes", "Hamstrings"],
    description: "Unilateral exercise that targets the lower body and improves balance.",
    icon: <Dumbbell className="h-5 w-5" />,
    premium: false,
  },
  {
    id: 7,
    name: "Bicycle Crunches",
    category: "Core",
    difficulty: "Beginner",
    muscles: ["Abs", "Obliques"],
    description: "Dynamic core exercise that targets the rectus abdominis and obliques.",
    icon: <Dumbbell className="h-5 w-5" />,
    premium: false,
  },
  {
    id: 8,
    name: "Mountain Climbers",
    category: "HIIT",
    difficulty: "Intermediate",
    muscles: ["Core", "Shoulders", "Cardio"],
    description: "High-intensity exercise that combines cardio and core strengthening.",
    icon: <Heart className="h-5 w-5" />,
    premium: false,
  },
];

// Premium exercises only available to paid tiers
const premiumExercises = [
  {
    id: 9,
    name: "Deadlifts",
    category: "Strength",
    difficulty: "Intermediate",
    muscles: ["Lower Back", "Glutes", "Hamstrings"],
    description: "Compound exercise that targets the posterior chain and builds overall strength.",
    icon: <Dumbbell className="h-5 w-5" />,
    premium: true,
  },
  {
    id: 10,
    name: "Bench Press",
    category: "Strength",
    difficulty: "Intermediate",
    muscles: ["Chest", "Triceps", "Shoulders"],
    description: "Classic strength exercise for developing upper body pushing strength.",
    icon: <Dumbbell className="h-5 w-5" />,
    premium: true,
  },
  {
    id: 11,
    name: "Pull Ups",
    category: "Strength",
    difficulty: "Intermediate",
    muscles: ["Back", "Biceps", "Shoulders"],
    description: "Challenging bodyweight exercise that builds upper body pulling strength.",
    icon: <Dumbbell className="h-5 w-5" />,
    premium: true,
  },
  {
    id: 12,
    name: "Burpees",
    category: "HIIT",
    difficulty: "Intermediate",
    muscles: ["Full body", "Cardio"],
    description: "High-intensity full body exercise that combines strength and cardio elements.",
    icon: <Heart className="h-5 w-5" />,
    premium: true,
  },
  {
    id: 13,
    name: "Russian Twists",
    category: "Core",
    difficulty: "Intermediate",
    muscles: ["Obliques", "Abs"],
    description: "Rotational core exercise that targets the obliques and improves trunk rotation.",
    icon: <Dumbbell className="h-5 w-5" />,
    premium: true,
  },
  {
    id: 14,
    name: "Box Jumps",
    category: "HIIT",
    difficulty: "Intermediate",
    muscles: ["Quads", "Glutes", "Calves"],
    description: "Plyometric exercise that builds explosive power in the lower body.",
    icon: <Heart className="h-5 w-5" />,
    premium: true,
  },
  {
    id: 15,
    name: "Kettlebell Swings",
    category: "Strength",
    difficulty: "Intermediate",
    muscles: ["Glutes", "Hamstrings", "Core", "Shoulders"],
    description: "Dynamic exercise that builds power and endurance in the posterior chain.",
    icon: <Dumbbell className="h-5 w-5" />,
    premium: true,
  },
  {
    id: 16,
    name: "Overhead Press",
    category: "Strength",
    difficulty: "Intermediate",
    muscles: ["Shoulders", "Triceps", "Upper Back"],
    description: "Strength exercise that targets the deltoids and builds overhead pressing strength.",
    icon: <Dumbbell className="h-5 w-5" />,
    premium: true,
  },
];

// Combine all exercises
const allExercises = [...basicExercises, ...premiumExercises];

export default function ExercisesPage() {
  const { user } = useAuth();
  const { membership } = useMembership();
  const [location, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExercises, setFilteredExercises] = useState(allExercises);
  
  // Determine which exercises are available based on membership tier
  const getAvailableExercises = () => {
    if (!membership || membership.tier === "free") {
      return basicExercises;
    }
    return allExercises;
  };
  
  // Filter exercises based on search query and selected category
  useEffect(() => {
    const availableExercises = getAvailableExercises();
    
    let filtered = availableExercises;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscles.some(muscle => 
          muscle.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(exercise => 
        exercise.category === selectedCategory ||
        exercise.difficulty === selectedCategory
      );
    }
    
    setFilteredExercises(filtered);
  }, [searchQuery, selectedCategory, membership]);
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const exerciseCount = {
    free: 20,
    premium: 100,
    pro: 200,
    elite: 300,
  };
  
  const currentExerciseCount = membership 
    ? exerciseCount[membership.tier as keyof typeof exerciseCount] 
    : exerciseCount.free;
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Exercises" />
      
      <main className="pt-16 pb-4">
        <div className="px-4 py-4">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Exercise Library</h1>
              <Badge variant="outline" className="flex items-center">
                <span className="text-xs text-gray-600">
                  {filteredExercises.length}/{currentExerciseCount} exercises
                </span>
              </Badge>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search exercises, muscles, or categories"
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10"
              />
            </div>
            
            <div className="flex overflow-x-auto pb-2 space-x-2 hide-scrollbar">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => handleCategorySelect(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredExercises.length > 0 ? (
              filteredExercises.map(exercise => (
                <Card key={exercise.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-start p-4">
                      <div className={`p-3 rounded-lg mr-3 ${exercise.icon.type === Heart ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {exercise.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{exercise.name}</h3>
                          {exercise.premium && (
                            <Badge className="bg-primary/10 text-primary border-none">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{exercise.description}</p>
                        <div className="flex mt-2 flex-wrap">
                          <Badge variant="secondary" className="mr-1 mb-1">
                            {exercise.category}
                          </Badge>
                          <Badge variant="outline" className="mr-1 mb-1">
                            {exercise.difficulty}
                          </Badge>
                          {exercise.muscles.slice(0, 2).map(muscle => (
                            <Badge key={muscle} variant="outline" className="mr-1 mb-1">
                              {muscle}
                            </Badge>
                          ))}
                          {exercise.muscles.length > 2 && (
                            <Badge variant="outline" className="mb-1">
                              +{exercise.muscles.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="px-4 pb-4 flex justify-end">
                      <Button size="sm" variant="ghost" className="text-primary">
                        <Play className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="inline-flex items-center justify-center p-3 bg-primary-100 rounded-full mb-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No exercises found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters to find exercises.</p>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
          
          {membership?.tier === "free" && (
            <Card className="mt-8 bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start">
                  <div className="p-2 bg-amber-100 rounded-full mr-3">
                    <Crown className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-800">Unlock Premium Exercises</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Upgrade to Premium to access 100+ exercises, detailed instructions, and video guides.
                    </p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate("/membership")}
                    >
                      Upgrade Now
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}
