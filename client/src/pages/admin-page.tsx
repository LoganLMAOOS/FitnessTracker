import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin-layout";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { MembershipKey, User } from "@shared/schema";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Loader2,
  Users,
  Key,
  Activity,
  Search,
  Ban,
  LogOut,
  Copy
} from "lucide-react";
import { format } from "date-fns";

// Schema for generating membership keys
const keyGenerationSchema = z.object({
  tier: z.enum(["premium", "pro", "elite"], {
    required_error: "Please select a membership tier",
  }),
  duration: z.enum(["30", "90", "180", "365", "3650"], {
    required_error: "Please select a duration",
  }),
  count: z.coerce.number().min(1).max(100).default(1),
});

type KeyGenerationValues = z.infer<typeof keyGenerationSchema>;

export default function AdminPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("keys");
  const [selectedKey, setSelectedKey] = useState<MembershipKey | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);

  // Determine which tab is active based on the URL
  useEffect(() => {
    if (location === "/admin/users") {
      setActiveTab("users");
    } else if (location === "/admin/logs") {
      setActiveTab("logs");
    } else {
      setActiveTab("keys");
    }
  }, [location]);

  // Redirect if not admin or owner
  if (user?.role !== "admin" && user?.role !== "owner") {
    navigate("/");
    return null;
  }
  
  // For owner accounts, we will also add account management buttons directly here

  // Fetch users
  const {
    data: users,
    isLoading: isUsersLoading,
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user && (user.role === "admin" || user.role === "owner"),
  });

  // Fetch membership keys
  const {
    data: membershipKeys,
    isLoading: isKeysLoading,
  } = useQuery<MembershipKey[]>({
    queryKey: ["/api/admin/membership-keys"],
    enabled: !!user && (user.role === "admin" || user.role === "owner"),
  });

  // Fetch activity logs
  const {
    data: activityLogs,
    isLoading: isLogsLoading,
  } = useQuery({
    queryKey: ["/api/admin/activity-logs"],
    enabled: !!user && (user.role === "admin" || user.role === "owner"),
  });
  
  // Logout function for the admin page
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Handle tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL based on tab
    if (value === "users") {
      navigate("/admin/users");
    } else if (value === "logs") {
      navigate("/admin/logs");
    } else {
      navigate("/admin");
    }
  };

  // Set up key generation form
  const keyForm = useForm<KeyGenerationValues>({
    resolver: zodResolver(keyGenerationSchema),
    defaultValues: {
      tier: "premium",
      duration: "30",
      count: 1,
    },
  });

  // Generate keys mutation
  const generateKeysMutation = useMutation({
    mutationFn: async (data: KeyGenerationValues) => {
      const res = await apiRequest("POST", "/api/admin/membership-keys", data);
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/membership-keys"] });
      toast({
        title: "Keys generated",
        description: `Successfully generated ${data.length} membership key(s)`,
      });
      keyForm.reset({
        tier: "premium",
        duration: "30",
        count: 1,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to generate keys",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Revoke key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      const res = await apiRequest("POST", `/api/admin/membership-keys/${keyId}/revoke`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/membership-keys"] });
      toast({
        title: "Key revoked",
        description: "The membership key has been successfully revoked",
      });
      setIsRevokeDialogOpen(false);
      setSelectedKey(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to revoke key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitKeyGeneration = (data: KeyGenerationValues) => {
    generateKeysMutation.mutate(data);
  };

  const handleRevokeKey = (key: MembershipKey) => {
    setSelectedKey(key);
    setIsRevokeDialogOpen(true);
  };

  const confirmRevokeKey = () => {
    if (selectedKey) {
      revokeKeyMutation.mutate(selectedKey.id);
    }
  };

  const formatDuration = (days: number) => {
    if (days >= 365) return `${Math.floor(days / 365)} year${days >= 730 ? 's' : ''}`;
    if (days >= 30) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''}`;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <p className="text-gray-600 mt-1 text-sm">Manage users, memberships, and system settings</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLogout}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
          <div className="bg-primary-50 text-primary px-3 py-2 rounded-lg border border-primary/20 text-sm flex items-center">
            <Users className="mr-1 h-4 w-4" />
            {isUsersLoading ? (
              <Loader2 className="animate-spin h-4 w-4 mr-1" />
            ) : (
              <span>{users?.length || 0} Users</span>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="keys" className="flex flex-col sm:flex-row items-center px-1 py-2 sm:py-1 h-auto text-xs sm:text-sm sm:h-10">
            <Key className="mb-1 sm:mb-0 sm:mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Keys</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex flex-col sm:flex-row items-center px-1 py-2 sm:py-1 h-auto text-xs sm:text-sm sm:h-10">
            <Users className="mb-1 sm:mb-0 sm:mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Users</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex flex-col sm:flex-row items-center px-1 py-2 sm:py-1 h-auto text-xs sm:text-sm sm:h-10">
            <Activity className="mb-1 sm:mb-0 sm:mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* Membership Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Membership Keys</CardTitle>
                <CardDescription>Create new membership keys for distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...keyForm}>
                  <form onSubmit={keyForm.handleSubmit(onSubmitKeyGeneration)} className="space-y-4">
                    <FormField
                      control={keyForm.control}
                      name="tier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Membership Tier</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select tier" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="premium">Premium ($5.99/month)</SelectItem>
                              <SelectItem value="pro">Pro ($9.99/month)</SelectItem>
                              <SelectItem value="elite">Elite ($14.99/month)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={keyForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="30">1 Month</SelectItem>
                              <SelectItem value="90">3 Months</SelectItem>
                              <SelectItem value="180">6 Months</SelectItem>
                              <SelectItem value="365">1 Year</SelectItem>
                              <SelectItem value="3650">Lifetime</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={keyForm.control}
                      name="count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Keys</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={generateKeysMutation.isPending}
                    >
                      {generateKeysMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Generate Keys"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Management</CardTitle>
                <CardDescription>Overview of recent key statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {isKeysLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        membershipKeys?.filter(k => !k.isRevoked && !k.usedBy)?.length || 0
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Available Keys</div>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {isKeysLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        membershipKeys?.filter(k => k.usedBy)?.length || 0
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Used Keys</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Membership Keys</CardTitle>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardDescription>Manage membership access keys</CardDescription>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search keys..."
                    className="pl-8 w-full sm:w-[200px] text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-1 sm:px-6">
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Key</TableHead>
                      <TableHead className="whitespace-nowrap">Tier</TableHead>
                      <TableHead className="whitespace-nowrap">Duration</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Created</TableHead>
                      <TableHead className="whitespace-nowrap">Status</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">Used By</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isKeysLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : membershipKeys && membershipKeys.length > 0 ? (
                      membershipKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell className="font-mono text-xs truncate max-w-[80px] md:max-w-none">
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="p-1 h-auto w-full justify-start text-left font-mono"
                                onClick={() => {
                                  navigator.clipboard.writeText(key.key);
                                  toast({
                                    title: "Key copied",
                                    description: "Membership key copied to clipboard",
                                    duration: 2000,
                                  });
                                }}
                              >
                                {key.key}
                                <Copy className="h-3 w-3 ml-1 flex-shrink-0" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize whitespace-nowrap">{key.tier}</TableCell>
                          <TableCell className="whitespace-nowrap">{formatDuration(key.duration)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {key.createdAt ? format(new Date(key.createdAt), 'MMM d, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            {key.isRevoked ? (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                                Revoked
                              </span>
                            ) : key.usedBy ? (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                Used
                              </span>
                            ) : (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                Available
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {key.usedBy ? key.usedBy : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {!key.isRevoked && !key.usedBy ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRevokeKey(key)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0 sm:px-3"
                              >
                                <Ban className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Revoke</span>
                              </Button>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No membership keys found. Generate some keys to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardDescription>View and manage user accounts</CardDescription>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8 w-full sm:w-[200px] text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-1 sm:px-6">
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="hidden sm:table-cell">ID</TableHead>
                      <TableHead className="whitespace-nowrap">Username</TableHead>
                      <TableHead className="whitespace-nowrap">Role</TableHead>
                      <TableHead className="whitespace-nowrap">Membership</TableHead>
                      <TableHead className="whitespace-nowrap hidden md:table-cell">Created</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : users && users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="hidden sm:table-cell">{user.id}</TableCell>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell className="capitalize">{user.role || 'user'}</TableCell>
                          <TableCell>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              Free
                            </span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-0 sm:px-3"
                            >
                              <span className="hidden sm:inline">View</span>
                              <span className="sm:hidden">👁️</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <CardDescription>System activity and user logs</CardDescription>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <Input
                    placeholder="Search logs..."
                    className="pl-8 w-full sm:w-[200px] text-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-1 sm:px-6">
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Time</TableHead>
                      <TableHead className="whitespace-nowrap hidden sm:table-cell">User</TableHead>
                      <TableHead className="whitespace-nowrap">Activity</TableHead>
                      <TableHead className="whitespace-nowrap">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLogsLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : activityLogs && Array.isArray(activityLogs) && activityLogs.length > 0 ? (
                      activityLogs.map((log: any, index) => (
                        <TableRow key={index}>
                          <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                            {log.timestamp ? format(new Date(log.timestamp), 'MM/dd, h:mm a') : '-'}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {log.username || '-'}
                          </TableCell>
                          <TableCell className="capitalize whitespace-nowrap text-xs sm:text-sm">
                            {log.activityType || '-'}
                          </TableCell>
                          <TableCell className="max-w-[120px] sm:max-w-xs truncate text-xs sm:text-sm">
                            {log.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          No activity logs found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Membership Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this membership key? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRevokeKey} className="bg-red-500 hover:bg-red-600">
              {revokeKeyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Key"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}