import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface CallRecord {
  id: string;
  time: string;
  category: string;
  severity: number;
  status: string;
}

interface RecentCallsTableProps {
  calls: CallRecord[];
}

export default function RecentCallsTable({ calls }: RecentCallsTableProps) {
  const getSeverityVariant = (level: number) => {
    if (level >= 4) return "destructive";
    if (level >= 3) return "default";
    return "secondary";
  };

  const getStatusVariant = (status: string) => {
    if (status === "Resolved") return "default";
    if (status === "Pending") return "secondary";
    return "secondary";
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">Time</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calls.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground h-32">
                No recent calls
              </TableCell>
            </TableRow>
          ) : (
            calls.map((call) => (
              <TableRow key={call.id} data-testid={`row-call-${call.id}`} className="hover-elevate">
                <TableCell className="font-mono text-sm" data-testid="text-time">{call.time}</TableCell>
                <TableCell data-testid="text-category">{call.category}</TableCell>
                <TableCell>
                  <Badge variant={getSeverityVariant(call.severity)} data-testid="badge-severity">
                    Level {call.severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(call.status)} data-testid="badge-status">
                    {call.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
