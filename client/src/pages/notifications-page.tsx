import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Bell, Trash2, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/bottom-nav";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

// Sample notification data (in a real app, these would come from an API)
const sampleNotifications = [
  {
    id: 1,
    type: "workout",
    title: "Weekly Workout Reminder",
    message: "Don't forget to log your workouts for this week!",
    date: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: false
  },
  {
    id: 2,
    type: "goal",
    title: "Goal Progress Update",
    message: "You're 75% of the way to completing your running goal!",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true
  },
  {
    id: 3,
    type: "system",
    title: "New Feature Available",
    message: "Try our new workout mood tracker with AI insights!",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    read: false
  },
  {
    id: 4,
    type: "membership",
    title: "Membership Update",
    message: "Your free trial will end in 3 days. Upgrade now to continue premium features!",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    read: true
  },
  {
    id: 5,
    type: "workout",
    title: "Workout Milestone",
    message: "Congratulations! You've completed 10 workouts this month.",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    read: true
  }
];

export default function NotificationsPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const [notifications, setNotifications] = useState(sampleNotifications);
  const [activeTab, setActiveTab] = useState("all");
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });
  
  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };
  
  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  // Format date to relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Notifications" />
      
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
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Mark All Read
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-xs text-red-500 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
            <p className="text-gray-600 mt-1">
              Stay up to date with your fitness journey
            </p>
          </div>
          
          <Tabs 
            defaultValue="all" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="mb-6"
          >
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="workout">Workouts</TabsTrigger>
              <TabsTrigger value="goal">Goals</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {filteredNotifications.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-700">No Notifications</h3>
                    <p className="text-gray-500 mt-1">
                      You're all caught up! Check back later for new updates.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map(notification => (
                    <Card 
                      key={notification.id} 
                      className={`transition-colors ${!notification.read ? 'bg-primary-50 border-primary/20' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 p-2 rounded-full ${getNotificationIcon(notification.type).bgColor}`}>
                            {getNotificationIcon(notification.type).icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-gray-900">{notification.title}</h3>
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(notification.date)}
                              </span>
                            </div>
                            <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                            
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-2 h-8 text-xs text-primary"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
}

// Helper function to get appropriate icon and color for notification type
function getNotificationIcon(type: string) {
  switch (type) {
    case 'workout':
      return { 
        icon: <Bell className="h-4 w-4 text-white" />, 
        bgColor: 'bg-blue-500' 
      };
    case 'goal':
      return { 
        icon: <CheckCircle className="h-4 w-4 text-white" />, 
        bgColor: 'bg-green-500' 
      };
    case 'membership':
      return { 
        icon: <Bell className="h-4 w-4 text-white" />, 
        bgColor: 'bg-purple-500' 
      };
    case 'system':
    default:
      return { 
        icon: <Bell className="h-4 w-4 text-white" />, 
        bgColor: 'bg-gray-500' 
      };
  }
}