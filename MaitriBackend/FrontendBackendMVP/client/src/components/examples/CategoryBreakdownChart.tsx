import CategoryBreakdownChart from '../CategoryBreakdownChart';

export default function CategoryBreakdownChartExample() {
  const mockData = [
    { label: 'Maternal', count: 45, percentage: 42, color: 'hsl(var(--chart-1))' },
    { label: 'Infant', count: 32, percentage: 30, color: 'hsl(var(--chart-2))' },
    { label: 'Menstrual', count: 18, percentage: 17, color: 'hsl(var(--chart-3))' },
    { label: 'General', count: 12, percentage: 11, color: 'hsl(var(--chart-4))' },
  ];

  return <CategoryBreakdownChart data={mockData} />;
}
