import AlertFeedSidebar from '../AlertFeedSidebar';

export default function AlertFeedSidebarExample() {
  const mockAlerts = [
    { id: '1', timestamp: '2:45 PM', severity: 5, village: 'Dharampur', category: 'Maternal' },
    { id: '2', timestamp: '2:30 PM', severity: 4, village: 'Khanpur', category: 'Infant' },
    { id: '3', timestamp: '1:15 PM', severity: 4, village: 'Rampur', category: 'Maternal' },
  ];

  return (
    <div className="h-screen">
      <AlertFeedSidebar
        alerts={mockAlerts}
        onViewAlert={(alert) => console.log('View alert:', alert)}
      />
    </div>
  );
}
