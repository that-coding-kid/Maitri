import StatsCard from '../StatsCard';
import { Phone } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <StatsCard 
      title="Calls Today"
      value={127}
      trend={{ value: 12, isPositive: true }}
      icon={Phone}
    />
  );
}
