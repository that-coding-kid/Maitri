import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";

interface CategoryData {
  label: string;
  count: number;
  percentage: number;
  color: string;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
}

function getCategoryTranslationKey(label: string): string {
  const keyMap: Record<string, string> = {
    'Maternal': 'chart.maternal',
    'Infant': 'chart.infant',
    'Menstrual': 'chart.menstrual',
    'General': 'chart.general',
  };
  return keyMap[label] || `chart.${label.toLowerCase()}`;
}

export default function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  const { t } = useLanguage();

  return (
    <Card data-testid="card-category-breakdown">
      <CardHeader>
        <CardTitle>{t('chart.categoryBreakdown')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.map((category, index) => (
          <div key={index} className="space-y-2" data-testid={`category-${category.label.toLowerCase()}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" data-testid="text-category-label">{t(getCategoryTranslationKey(category.label))}</span>
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
