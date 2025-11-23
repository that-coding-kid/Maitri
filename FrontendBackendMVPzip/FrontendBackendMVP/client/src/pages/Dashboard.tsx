import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCard from "@/components/StatsCard";
import TrendsChart from "@/components/TrendsChart";
import CategoryBreakdownChart from "@/components/CategoryBreakdownChart";
import RecentCallsTable from "@/components/RecentCallsTable";
import AlertFeedSidebar, { type Alert } from "@/components/AlertFeedSidebar";
import EmergencyAlertModal from "@/components/EmergencyAlertModal";
import IVRSystemStatus from "@/components/IVRDemo";
import { Phone, AlertTriangle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";

interface DashboardStats {
  callsToday: number;
  activeAlerts: number;
  avgResponseTime: string;
  categoryBreakdown: Array<{
    label: string;
    count: number;
    percentage: number;
  }>;
  trends: Array<{ name: string; calls: number }>;
}

interface CallRecord {
  id: string;
  time: string;
  category: string;
  severity: number;
  status: string;
}

let socket: Socket | null = null;

export default function Dashboard() {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [isAlertSidebarOpen, setIsAlertSidebarOpen] = useState(true);
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // Fetch dashboard stats
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch pending alerts
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch recent calls
  const { data: recentCalls = [] } = useQuery<CallRecord[]>({
    queryKey: ['/api/calls/recent'],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Mutation to resolve alerts
  const resolveAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      return await apiRequest(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/calls/recent'] });
      toast({
        title: t('alert.resolved_msg'),
        description: t('alert.responded_desc'),
      });
    },
    onError: () => {
      toast({
        title: t('alert.error'),
        description: t('alert.error_resolve'),
        variant: "destructive",
      });
    },
  });

  // Setup WebSocket for real-time emergency alerts
  useEffect(() => {
    // Connect to Socket.IO server
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('emergency_alert', (newAlert: Alert) => {
      console.log('Emergency alert received:', newAlert);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Show toast notification
      toast({
        title: "Emergency Alert!",
        description: `${t('alert.emergency')} - ${newAlert.villageName || newAlert.village}`,
        variant: "destructive",
      });
      
      // Auto-open modal for emergency
      setSelectedAlert(newAlert);
      setIsAlertModalOpen(true);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [queryClient, toast]);

  const handleViewAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsAlertModalOpen(true);
  };

  const handleMarkResolved = (alertId: string) => {
    resolveAlertMutation.mutate(alertId);
    setIsAlertModalOpen(false);
    setSelectedAlert(null);
  };

  return (
    <div className="h-screen flex flex-col">
      <DashboardHeader 
        alertCount={alerts.length} 
        onNotificationClick={() => setIsAlertSidebarOpen(!isAlertSidebarOpen)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title={t('stats.callsToday')}
                value={stats?.callsToday ?? 0}
                trend={{ value: 12, isPositive: true }}
                icon={Phone}
              />
              <StatsCard
                title={t('stats.activeAlerts')}
                value={alerts.length}
                trend={{ value: 8, isPositive: false }}
                icon={AlertTriangle}
              />
              <StatsCard
                title={t('stats.avgResponseTime')}
                value={stats?.avgResponseTime ?? "N/A"}
                trend={{ value: 15, isPositive: true }}
                icon={TrendingUp}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendsChart 
                data={stats?.trends ?? []}
                onFilterChange={(filter) => console.log('Filter changed:', filter)}
              />
              <CategoryBreakdownChart 
                data={stats?.categoryBreakdown ?? []} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-xl font-medium">{t('chart.recentCalls')}</h2>
                <RecentCallsTable calls={recentCalls} />
              </div>
              <div className="space-y-4">
                <h2 className="text-xl font-medium">{t('chart.systemStatus')}</h2>
                <IVRSystemStatus />
              </div>
            </div>
          </div>
        </div>

        <AlertFeedSidebar 
          alerts={alerts}
          onViewAlert={handleViewAlert}
          isOpen={isAlertSidebarOpen}
        />
      </div>

      <EmergencyAlertModal
        alert={selectedAlert}
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onMarkResolved={handleMarkResolved}
      />
    </div>
  );
}
