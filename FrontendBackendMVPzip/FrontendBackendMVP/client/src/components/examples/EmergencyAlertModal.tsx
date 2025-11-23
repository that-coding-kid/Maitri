import { useState } from 'react';
import EmergencyAlertModal from '../EmergencyAlertModal';
import { Button } from '@/components/ui/button';

export default function EmergencyAlertModalExample() {
  const [isOpen, setIsOpen] = useState(true);
  
  const mockAlert = {
    id: '1',
    phoneNumber: '+91 98765 43210',
    villageName: 'Dharampur',
    timestamp: '2:45 PM',
    severityLevel: 5,
    category: 'Maternal',
    emergencyReason: 'Heavy bleeding reported after childbirth, requires immediate medical attention'
  };

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)} data-testid="button-show-alert">
        Show Emergency Alert
      </Button>
      <EmergencyAlertModal
        alert={mockAlert}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMarkResolved={(id) => {
          console.log('Marked as resolved:', id);
          setIsOpen(false);
        }}
      />
    </div>
  );
}
