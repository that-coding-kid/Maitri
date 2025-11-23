import TrendsChart from '../TrendsChart';

export default function TrendsChartExample() {
  const mockData = [
    { name: '6 AM', calls: 12 },
    { name: '9 AM', calls: 19 },
    { name: '12 PM', calls: 28 },
    { name: '3 PM', calls: 35 },
    { name: '6 PM', calls: 22 },
    { name: 'Now', calls: 11 },
  ];

  return (
    <TrendsChart
      data={mockData}
      onFilterChange={(filter) => console.log('Filter changed:', filter)}
    />
  );
}
