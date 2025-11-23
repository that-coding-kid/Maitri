import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";

interface AlertFeedItemProps {
  timestamp: string;
  severity: number;
  village: string;
  category: string;
  onView: () => void;
}

function shortenVillageText(text: string): string {
  if (!text) return '';
  
  // If it contains a URL, shorten it
  if (text.includes('http')) {
    try {
      const urlMatch = text.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        const url = new URL(urlMatch[1]);
        const hostname = url.hostname.replace('www.', '');
        return text.replace(urlMatch[1], hostname);
      }
    } catch {
      // If URL parsing fails, just truncate
      return text.length > 35 ? text.substring(0, 35) + '...' : text;
    }
  }
  
  return text.length > 40 ? text.substring(0, 40) + '...' : text;
}

export default function AlertFeedItem({ timestamp, severity, village, category, onView }: AlertFeedItemProps) {
  const getSeverityVariant = (level: number) => {
    if (level >= 4) return "destructive";
    if (level >= 3) return "default";
    return "secondary";
  };

  return (
    <Card className="p-4 hover-elevate" data-testid={`card-alert-${village.toLowerCase()}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={getSeverityVariant(severity)} className="text-xs" data-testid="badge-severity">
              Level {severity}
            </Badge>
            <span className="text-xs text-muted-foreground" data-testid="text-timestamp">{timestamp}</span>
          </div>
          <p className="text-sm font-medium truncate line-clamp-1 break-all" data-testid="text-village" title={village}>
            {shortenVillageText(village)}
          </p>
          <p className="text-xs text-muted-foreground" data-testid="text-category">{category}</p>
        </div>
        <Button size="icon" variant="ghost" onClick={onView} data-testid="button-view-alert">
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
