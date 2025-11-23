// Quick test script to verify the system works
import { storage } from './server/storage.ts';

async function testDemo() {
  console.log('🚀 Testing Maitri MVP...');
  
  // Create a test call
  const call = await storage.createCallLog({
    callerHash: 'test-hash-123',
    encryptedPhone: 'encrypted-phone-data',
    transcription: 'I am feeling very weak after childbirth',
    aiResponse: 'I am concerned about your condition. Please contact your ASHA worker.',
    severityLevel: 4,
    category: 'Maternal',
    isBreakGlass: true,
    villageLocation: 'Test Village'
  });
  
  console.log('✅ Call created:', call.id);
  
  // Create an alert
  const alert = await storage.createAlert({
    callId: call.id,
    ashaWorkerId: null,
    status: 'PENDING',
    emergencyReason: 'High severity maternal health concern'
  });
  
  console.log('✅ Alert created:', alert.id);
  
  // Test retrieval
  const calls = await storage.getAllCallLogs();
  const alerts = await storage.getPendingAlerts();
  
  console.log(`✅ System working! ${calls.length} calls, ${alerts.length} alerts`);
  console.log('🎉 Ready for hackathon demo!');
}

testDemo().catch(console.error);