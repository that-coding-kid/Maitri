import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CategoryData {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
}

export default function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  return (
    <Card data-testid="card-category-breakdown">
      <CardHeader>
        <CardTitle>Category Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.map((category, index) => (
          <div key={index} className="space-y-2" data-testid={`category-${category.label.toLowerCase()}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" data-testid="text-category-label">{category.label}</span>
              <span className="text-sm text-muted-foreground font-mono" data-testid="text-category-count">
                {category.count} ({category.percentage}%)
              </span>
            </div>
            <Progress 
              value={category.percentage} 
              className="h-2"
              data-testid="progress-category"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
