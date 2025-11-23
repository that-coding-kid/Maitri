import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Shield, Users, AlertTriangle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";

interface SystemStatus {
  twilioConfigured: boolean;
  openaiConfigured: boolean;
  totalCalls: number;
  emergencyAlerts: number;
}

export default function IVRSystemStatus() {
  const [twilioNumber, setTwilioNumber] = useState<string | null>(null);
  const { t } = useLanguage();

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
          {t('ivr.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* System Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('ivr.ivrNumber')}:</span>
            <Badge variant="outline" className="font-mono">
              {twilioNumber}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('ivr.status')}:</span>
            <Badge variant="default" className="bg-green-500">
              {t('ivr.active')}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('ivr.totalCalls')}:</span>
            <Badge variant="secondary">
              {stats?.callsToday || 0}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('ivr.activeAlerts')}:</span>
            <Badge variant={stats?.activeAlerts > 0 ? "destructive" : "secondary"}>
              {stats?.activeAlerts || 0}
            </Badge>
          </div>
        </div>

        {/* How it Works */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('ivr.howItWorks')}
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• {t('ivr.step1')}</p>
            <p>• {t('ivr.step2')}</p>
            <p>• {t('ivr.step3')}</p>
            <p>• {t('ivr.step4')}</p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {t('ivr.privacyTitle')}
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• {t('ivr.privacy1')}</p>
            <p>• {t('ivr.privacy2')}</p>
            <p>• {t('ivr.privacy3')}</p>
          </div>
        </div>

        {/* Emergency Protocol */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t('ivr.breakGlassTitle')}
          </h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• {t('ivr.breakGlass1')}</p>
            <p>• {t('ivr.breakGlass2')}</p>
            <p>• {t('ivr.breakGlass3')}</p>
            <p>• {t('ivr.breakGlass4')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}