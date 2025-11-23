import AlertFeedItem from '../AlertFeedItem';

export default function AlertFeedItemExample() {
  return (
    <div className="w-80">
      <AlertFeedItem
        timestamp="2:45 PM"
        severity={5}
        village="Dharampur"
        category="Maternal"
        onView={() => console.log('View alert clicked')}
      />
    </div>
  );
}
