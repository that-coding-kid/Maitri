import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmergencyAlert {
  id: string;
  phoneNumber?: string;
  villageName?: string;
  timestamp: string;
  severityLevel?: number;
  severity?: number;
  category: string;
  emergencyReason?: string;
}

interface EmergencyAlertModalProps {
  alert: EmergencyAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkResolved: (alertId: string) => void;
}

export default function EmergencyAlertModal({ 
  alert, 
  isOpen, 
  onClose, 
  onMarkResolved 
}: EmergencyAlertModalProps) {
  if (!alert) return null;
  
  const severity = alert.severityLevel ?? alert.severity ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-emergency-alert">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-destructive/10 p-4 rounded-lg animate-pulse">
            <AlertTriangle className="h-16 w-16 text-destructive" data-testid="icon-alert-emergency" />
          </div>
          <div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-destructive" data-testid="text-alert-title">
                Emergency Alert
              </DialogTitle>
              <DialogDescription data-testid="text-alert-description">
                Immediate attention required
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Phone Number</p>
              <a href={`tel:${alert.phoneNumber}`} className="text-base font-medium font-mono text-blue-600 hover:underline" data-testid="text-phone-number">
                {alert.phoneNumber ? `${alert.phoneNumber.slice(0, 6)}...` : 'N/A'}
              </a>
              <p className="text-xs text-muted-foreground mt-1">{alert.phoneNumber || ''}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Village Name</p>
              <p className="text-base font-medium" data-testid="text-village-name">{alert.villageName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Time</p>
              <p className="text-base font-medium" data-testid="text-timestamp">{alert.timestamp}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Severity Level</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge 
                  variant={severity >= 4 ? "destructive" : "secondary"}
                  data-testid="badge-severity"
                >
                  Level {severity}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Risk Category</p>
              <p className="text-base font-medium" data-testid="text-category">{alert.category}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI Reasoning</p>
              <p className="text-sm" data-testid="text-emergency-reason">{alert.emergencyReason || 'No details available'}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button 
            variant="outline" 
            onClick={onClose}
            data-testid="button-view-transcript"
            className="w-full sm:w-auto"
          >
            View Full Transcript
          </Button>
          <Button 
            onClick={() => onMarkResolved(alert.id)}
            className="w-full sm:w-auto"
            data-testid="button-mark-responded"
          >
            Mark as Responded
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
