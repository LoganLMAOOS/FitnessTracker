import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
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
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, CheckIcon, AlertTriangle } from "lucide-react";

// Schema for membership key redemption
const membershipKeySchema = z.object({
  key: z.string().min(8, "Membership key must be at least 8 characters"),
});

type MembershipKeyValues = z.infer<typeof membershipKeySchema>;

export default function MembershipPage() {
  const { user } = useAuth();
  const { membership, upgradeMutation, redeemKeyMutation, membershipFeatures } = useMembership();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Redirect owner account to admin panel
  if (user?.role === "owner") {
    navigate("/admin");
    return null;
  }
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false);
  const [keyError, setKeyError] = useState<{ title: string; message: string } | null>(null);
  const [upgradeError, setUpgradeError] = useState<{ title: string; message: string } | null>(null);
  
  const keyForm = useForm<MembershipKeyValues>({
    resolver: zodResolver(membershipKeySchema),
    defaultValues: {
      key: "",
    },
  });
  
  const onSubmitKey = (data: MembershipKeyValues) => {
    redeemKeyMutation.mutate(data.key, {
      onSuccess: () => {
        setShowRedeemDialog(false);
        keyForm.reset();
      },
      onError: (error: Error) => {
        setKeyError({
          title: "Membership Key Issue",
          message: error.message
        });
        // Keep dialog open to show the error message
      }
    });
  };
  
  const handleUpgrade = (tier: string) => {
    setSelectedTier(tier);
    setShowUpgradeConfirm(true);
  };
  
  const confirmUpgrade = () => {
    if (selectedTier) {
      upgradeMutation.mutate(selectedTier, {
        onSuccess: () => {
          setShowUpgradeConfirm(false);
          toast({
            title: "Membership upgraded",
            description: `You now have ${selectedTier} membership!`,
          });
        },
        onError: (error: Error) => {
          setUpgradeError({
            title: "Upgrade Not Completed",
            message: error.message
          });
          // Keep dialog open to show the error message
        }
      });
    }
  };
  
  const formatPrice = (tier: string) => {
    switch (tier) {
      case "premium":
        return "$5.99";
      case "pro":
        return "$9.99";
      case "elite":
        return "$14.99";
      default:
        return "Free";
    }
  };
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-50 pb-20">
      <Header title="Membership" />
      
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Membership Plans</h1>
            <p className="text-gray-600">
              Choose the plan that fits your fitness goals
            </p>
          </div>
          
          <div className="space-y-4">
            {/* Free Plan */}
            <Card className={`border ${membership?.tier === "free" ? "border-primary" : "border-gray-200"}`}>
              <CardContent className="p-0">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Basic</h2>
                    {membership?.tier === "free" && (
                      <span className="bg-primary-100 text-primary text-xs px-2 py-1 rounded-full">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">Free</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Limited features to get you started</p>
                </div>
                <div className="px-5 py-4">
                  <ul className="space-y-2">
                    {membershipFeatures.free.featureList.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-4 w-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                        <span className="ml-2 text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
                  <Button 
                    className="w-full" 
                    variant="outline" 
                    disabled={membership?.tier === "free"}
                  >
                    {membership?.tier === "free" ? "Current Plan" : "Select Plan"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Premium Plan */}
            <Card className={`border-2 ${membership?.tier === "premium" ? "border-primary" : "border-gray-200"} rounded-xl shadow-lg relative`}>
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                POPULAR
              </div>
              <CardContent className="p-0">
                <div className="px-5 py-4 bg-primary-50 border-b border-primary-100">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-primary-900">Premium</h2>
                    {membership?.tier === "premium" && (
                      <span className="bg-primary-200 text-primary-700 text-xs px-2 py-1 rounded-full">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-bold text-primary-900">$5.99</span>
                    <span className="ml-1 text-sm text-primary-700">/month</span>
                  </div>
                  <p className="mt-1 text-sm text-primary-700">Unlock more features and tracking</p>
                </div>
                <div className="px-5 py-4">
                  <ul className="space-y-2">
                    {membershipFeatures.premium.featureList.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-4 w-4 text-primary-600 mt-0.5 flex-shrink-0" />
                        <span className="ml-2 text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="px-5 py-4 border-t border-primary-100 bg-primary-50">
                  {membership?.tier === "premium" ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : membership?.tier === "pro" || membership?.tier === "elite" ? (
                    <Button className="w-full" variant="outline" disabled>
                      Downgrade Not Available
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpgrade("premium")}
                    >
                      Upgrade Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Pro Plan */}
            <Card className={`border ${membership?.tier === "pro" ? "border-primary" : "border-gray-200"}`}>
              <CardContent className="p-0">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Pro</h2>
                    {membership?.tier === "pro" && (
                      <span className="bg-primary-100 text-primary text-xs px-2 py-1 rounded-full">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">$9.99</span>
                    <span className="ml-1 text-sm text-gray-500">/month</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Advanced features for serious fitness enthusiasts</p>
                </div>
                <div className="px-5 py-4">
                  <ul className="space-y-2">
                    {membershipFeatures.pro.featureList.slice(0, 6).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-4 w-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                        <span className="ml-2 text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {membershipFeatures.pro.featureList.length > 6 && (
                      <li className="text-sm text-gray-500 italic">
                        + {membershipFeatures.pro.featureList.length - 6} more features
                      </li>
                    )}
                  </ul>
                </div>
                <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
                  {membership?.tier === "pro" ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : membership?.tier === "elite" ? (
                    <Button className="w-full" variant="outline" disabled>
                      Downgrade Not Available
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-gray-800 hover:bg-gray-900" 
                      onClick={() => handleUpgrade("pro")}
                    >
                      Upgrade Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Elite Plan */}
            <Card className={`border ${membership?.tier === "elite" ? "border-primary" : "border-gray-200"}`}>
              <CardContent className="p-0">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Elite</h2>
                    {membership?.tier === "elite" && (
                      <span className="bg-primary-100 text-primary text-xs px-2 py-1 rounded-full">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-bold text-gray-900">$14.99</span>
                    <span className="ml-1 text-sm text-gray-500">/month</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Premium experience with AI-powered features</p>
                </div>
                <div className="px-5 py-4">
                  <ul className="space-y-2">
                    {membershipFeatures.elite.featureList.slice(0, 6).map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-4 w-4 text-secondary-500 mt-0.5 flex-shrink-0" />
                        <span className="ml-2 text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {membershipFeatures.elite.featureList.length > 6 && (
                      <li className="text-sm text-gray-500 italic">
                        + {membershipFeatures.elite.featureList.length - 6} more features
                      </li>
                    )}
                  </ul>
                </div>
                <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
                  {membership?.tier === "elite" ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className="w-full bg-gray-800 hover:bg-gray-900" 
                      onClick={() => handleUpgrade("elite")}
                    >
                      Upgrade Now
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Redeem key button */}
            <div className="mt-8 text-center">
              <Button 
                variant="outline"
                onClick={() => setShowRedeemDialog(true)}
              >
                Redeem Membership Key
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Redeem Key Dialog */}
      <Dialog 
        open={showRedeemDialog} 
        onOpenChange={(open) => {
          setShowRedeemDialog(open);
          if (!open) setKeyError(null); // Clear errors when closing
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redeem Membership Key</DialogTitle>
            <DialogDescription>
              Enter your membership key to upgrade your account
            </DialogDescription>
          </DialogHeader>
          
          {keyError ? (
            <div className="py-4">
              <div className="bg-destructive/10 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-medium text-destructive">{keyError.title}</h3>
                    <p className="text-sm text-gray-700">{keyError.message}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setKeyError(null)}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setKeyError(null);
                    setShowRedeemDialog(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <Form {...keyForm}>
              <form onSubmit={keyForm.handleSubmit(onSubmitKey)} className="space-y-4">
                <FormField
                  control={keyForm.control}
                  name="key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Membership Key</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your key (e.g. PRE-12345678)"
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
                    onClick={() => setShowRedeemDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={redeemKeyMutation.isPending}
                  >
                    {redeemKeyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redeeming...
                      </>
                    ) : (
                      "Redeem Key"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Upgrade Confirmation Dialog */}
      <Dialog 
        open={showUpgradeConfirm} 
        onOpenChange={(open) => {
          setShowUpgradeConfirm(open);
          if (!open) setUpgradeError(null); // Clear errors when closing
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Membership Upgrade</DialogTitle>
            <DialogDescription>
              You are about to upgrade to {selectedTier} membership for {formatPrice(selectedTier || "")} per month.
            </DialogDescription>
          </DialogHeader>
          
          {upgradeError ? (
            <div className="py-4">
              <div className="bg-destructive/10 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-medium text-destructive">{upgradeError.title}</h3>
                    <p className="text-sm text-gray-700">{upgradeError.message}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setUpgradeError(null)}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setUpgradeError(null);
                    setShowUpgradeConfirm(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="py-4">
                <div className="flex items-start p-3 bg-amber-50 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    This is a simulated payment. In a real app, you would proceed to payment processing.
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeConfirm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmUpgrade}
                  disabled={upgradeMutation.isPending}
                >
                  {upgradeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Upgrade"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  );
}
