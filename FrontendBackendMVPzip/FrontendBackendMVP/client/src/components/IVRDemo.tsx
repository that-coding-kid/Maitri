import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Shield, Users, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SystemStatus {
  twilioConfigured: boolean;
  openaiConfigured: boolean;
  totalCalls: number;
  emergencyAlerts: number;
}

export default function IVRSystemStatus() {
  const [twilioNumber, setTwilioNumber] = useState<string | null>(null);

  // Check system status
  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 5000,
  });

  useEffect(() => {
    // In production, this would come from an API endpoint
    setTwilioNumber("+1-XXX-XXX-XXXX");
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Maitri IVR System
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">IVR Number:</span>
            <Badge variant="outline" className="font-mono">
              {twilioNumber}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant="default" className="bg-green-500">
              Active
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Calls:</span>
            <Badge variant="secondary">
              {stats?.callsToday || 0}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Active Alerts:</span>
            <Badge variant={stats?.activeAlerts > 0 ? "destructive" : "secondary"}>
              {stats?.activeAlerts || 0}
            </Badge>
          </div>
        </div>

        {/* How it Works */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            How It Works
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Patients call the IVR number above</p>
            <p>• Maitri analyzes health concerns in Hindi</p>
            <p>• Calls are anonymized and logged here</p>
            <p>• High severity triggers emergency alerts</p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy Protection
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Phone numbers are encrypted</p>
            <p>• Only emergency calls are de-anonymized</p>
            <p>• ASHA workers see alerts in real-time</p>
          </div>
        </div>

        {/* Emergency Protocol */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Break-Glass Protocol
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Severity ≥ 4 triggers emergency mode</p>
            <p>• System asks for village name</p>
            <p>• Full phone number revealed to ASHA</p>
            <p>• Real-time alert sent to dashboard</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}