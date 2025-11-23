import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import AlertFeedItem from "./AlertFeedItem";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertCircle } from "lucide-react";

export interface Alert {
  id: string;
  timestamp: string;
  severity: number;
  village: string;
  category: string;
  phoneNumber?: string;
  villageName?: string;
  severityLevel?: number;
  emergencyReason?: string;
}

interface AlertFeedSidebarProps {
  alerts: Alert[];
  onViewAlert: (alert: Alert) => void;
  isOpen: boolean;
}

export default function AlertFeedSidebar({ alerts, onViewAlert, isOpen }: AlertFeedSidebarProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className={`w-80 border-l bg-card h-full flex flex-col ${isOpen ? 'animate-in slide-in-from-right' : 'animate-out slide-out-to-right'} duration-300`} data-testid="sidebar-alert-feed">
      <div className="p-6 border-b">
        <h2 className="text-lg font-medium flex items-center gap-2" data-testid="text-sidebar-title">
          <AlertCircle className="h-5 w-5" />
          {t('sidebar.pendingAlerts')}
        </h2>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-alert-count">
          {alerts.length} {t('sidebar.activeAlerts')}
        </p>
      </div>
      <ScrollArea className="flex-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-6 text-center" data-testid="empty-state-alerts">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {t('sidebar.noAlerts')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('sidebar.allClear')}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {alerts.map((alert) => (
              <AlertFeedItem
                key={alert.id}
                timestamp={alert.timestamp}
                severity={alert.severity}
                village={alert.village}
                category={alert.category}
                onView={() => onViewAlert(alert)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
