import DashboardHeader from '../DashboardHeader';

export default function DashboardHeaderExample() {
  return (
    <DashboardHeader
      alertCount={3}
      onNotificationClick={() => console.log('Notifications clicked')}
    />
  );
}
