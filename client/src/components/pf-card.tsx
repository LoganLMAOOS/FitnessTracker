import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PfIntegration } from "@shared/schema";
import { useState, useEffect } from "react";
import { QrCode, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PfCardProps {
  pfIntegration: PfIntegration;
}

export function PfCard({ pfIntegration }: PfCardProps) {
  const [brightness, setBrightness] = useState(100);
  const { toast } = useToast();
  
  // Auto increase screen brightness when QR code is shown
  useEffect(() => {
    const originalBrightness = brightness;
    
    // This is a mock implementation since we can't actually control screen brightness
    setBrightness(100);
    
    return () => {
      setBrightness(originalBrightness);
    };
  }, []);
  
  const checkinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", "/api/pf-integration/checkin", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pf-integration"] });
      toast({
        title: "Check-in successful",
        description: "You've checked in to your Planet Fitness gym",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleCheckin = () => {
    checkinMutation.mutate();
  };
  
  // This would be replaced with an actual QR code component
  // Here we use a simple representation
  const QRCodeDisplay = () => (
    <div className="qr-code w-32 h-32 mx-auto">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* QR code pattern - simplified for representation */}
        <rect x="0" y="0" width="100" height="100" fill="white" />
        <rect x="10" y="10" width="20" height="20" />
        <rect x="70" y="10" width="20" height="20" />
        <rect x="10" y="70" width="20" height="20" />
        <rect x="40" y="10" width="10" height="10" />
        <rect x="40" y="30" width="10" height="10" />
        <rect x="40" y="60" width="10" height="10" />
        <rect x="60" y="40" width="10" height="10" />
        <rect x="70" y="60" width="10" height="10" />
      </svg>
    </div>
  );
  
  return (
    <Card className="mb-6 bg-[#5A297A] text-white">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="h-10 w-10 flex items-center justify-center bg-white rounded-lg mr-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#5A297A]">
              <rect width="24" height="24" rx="4" fill="#5A297A"/>
              <path d="M12 6L7 10H17L12 6Z" fill="#F6DB01"/>
              <path d="M7 14H17L12 18L7 14Z" fill="#F6DB01"/>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Planet Fitness</h3>
            <p className="text-xs text-purple-200">
              {pfIntegration.blackCardMember ? "Black Card Member" : "Standard Member"}
            </p>
          </div>
        </div>
        <div className="my-4 flex justify-center">
          <div className="bg-white p-2 rounded-lg shadow-lg">
            <QRCodeDisplay />
          </div>
        </div>
        <div className="text-center mb-4">
          <p className="text-xs text-purple-200">Member #: <span className="text-white">{pfIntegration.pfMemberNumber}</span></p>
          <p className="text-xs text-purple-200">Home Gym: <span className="text-white">{pfIntegration.pfHomeGym}</span></p>
          {pfIntegration.lastCheckIn && (
            <p className="text-xs text-purple-200">Last Check-in: <span className="text-white">
              {new Date(pfIntegration.lastCheckIn).toLocaleDateString()} at {new Date(pfIntegration.lastCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span></p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={handleCheckin}
            className="bg-[#F6DB01] hover:bg-[#e6cc00] text-[#5A297A] rounded-lg py-2 text-center text-sm font-medium"
          >
            <QrCode className="mr-1 h-4 w-4" /> Quick Check-in
          </Button>
          <Button 
            variant="outline" 
            className="bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 text-center text-sm font-medium"
          >
            <History className="mr-1 h-4 w-4" /> Visit History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
