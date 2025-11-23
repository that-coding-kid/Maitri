// Debug AI Pipeline

const BASE_URL = 'http://localhost:5000';

async function debugAI() {
  console.log('🔍 Debugging AI Pipeline...\n');
  
  console.log('Making request to process-audio...');
  
  const response = await fetch(`${BASE_URL}/ivr/process-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'RecordingUrl=https://demo.twilio.com/docs/classic.mp3&From=+918340570832&CallSid=debug123'
  });
  
  const twiml = await response.text();
  console.log('\n📄 TwiML Response:');
  console.log(twiml);
  
  console.log('\n🔍 Check your server logs for:');
  console.log('- [AI] Using mock AI - OpenAI not configured');
  console.log('- [AI] Transcribing audio with Whisper...');
  console.log('- [IVR] AI Analysis - Severity: X, Category: Y');
  
  // Check stored calls
  const calls = await fetch(`${BASE_URL}/api/calls/recent`).then(r => r.json());
  if (calls.length > 0) {
    console.log('\n📊 Latest Call Data:');
    console.log(`Severity: ${calls[0].severity}`);
    console.log(`Category: ${calls[0].category}`);
    console.log(`AI Response: ${calls[0].aiResponse || 'None'}`);
  }
}

debugAI().catch(console.error);