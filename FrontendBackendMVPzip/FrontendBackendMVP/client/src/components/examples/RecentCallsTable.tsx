import RecentCallsTable from '../RecentCallsTable';

export default function RecentCallsTableExample() {
  const mockCalls = [
    { id: '1', time: '2:45 PM', category: 'Maternal', severity: 5, status: 'Pending' },
    { id: '2', time: '2:30 PM', category: 'Infant', severity: 3, status: 'Resolved' },
    { id: '3', time: '1:15 PM', category: 'General', severity: 2, status: 'Resolved' },
    { id: '4', time: '12:50 PM', category: 'Menstrual', severity: 1, status: 'Resolved' },
  ];

  return <RecentCallsTable calls={mockCalls} />;
}
