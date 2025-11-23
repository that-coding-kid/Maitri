// Test Emergency Flow
const BASE_URL = 'http://localhost:5000';

async function testEmergencyFlow() {
  console.log('🚨 Testing Emergency Flow...\n');

  // Step 1: Simulate incoming call
  console.log('1. Simulating incoming call...');
  await fetch(`${BASE_URL}/ivr/incoming`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'From=+1234567890'
  });

  // Step 2: Simulate high severity audio (will trigger emergency)
  console.log('2. Processing high severity audio...');
  await fetch(`${BASE_URL}/ivr/process-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'RecordingUrl=https://demo.twilio.com/docs/classic.mp3&From=+1234567890&CallSid=test123'
  });

  // Step 3: Check if alert was created
  console.log('3. Checking alerts...');
  const alerts = await fetch(`${BASE_URL}/api/alerts`).then(r => r.json());
  console.log(`   Found ${alerts.length} alerts`);

  // Step 4: Simulate village name recording (Break-Glass)
  console.log('4. Simulating Break-Glass village recording...');
  await fetch(`${BASE_URL}/ivr/break-glass-confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'RecordingUrl=village.wav&From=+1234567890'
  });

  // Step 5: Check final state
  console.log('5. Final system state:');
  const calls = await fetch(`${BASE_URL}/api/calls/recent`).then(r => r.json());
  const finalAlerts = await fetch(`${BASE_URL}/api/alerts`).then(r => r.json());
  
  console.log(`   Calls: ${calls.length}`);
  console.log(`   Alerts: ${finalAlerts.length}`);
  
  if (finalAlerts.length > 0) {
    console.log(`   Emergency Alert: ${finalAlerts[0].emergencyReason}`);
    console.log(`   Phone: ${finalAlerts[0].phoneNumber}`);
    console.log(`   Village: ${finalAlerts[0].village}`);
  }

  console.log('\n✅ Emergency flow test complete!');
}

testEmergencyFlow().catch(console.error);