#!/usr/bin/env node

// Test AI Pipeline - OpenAI Integration

const BASE_URL = 'http://localhost:5000';

async function testAIPipeline() {
  console.log('🤖 Testing AI Pipeline...\n');

  // Test 1: Normal health concern
  console.log('1. Testing normal health concern...');
  try {
    const response1 = await fetch(`${BASE_URL}/ivr/process-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'RecordingUrl=https://demo.twilio.com/docs/classic.mp3&From=+918340570832&CallSid=test1'
    });
    
    const twiml1 = await response1.text();
    console.log('   Response received:', twiml1.includes('Say') ? '✅ TwiML generated' : '❌ No TwiML');
    
    // Check if call was stored with AI analysis
    const calls = await fetch(`${BASE_URL}/api/calls/recent`).then(r => r.json());
    const latestCall = calls[0];
    if (latestCall) {
      console.log(`   Severity: ${latestCall.severity}, Category: ${latestCall.category}`);
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n2. Testing emergency keyword detection...');
  
  // Test 2: Emergency scenario (will use mock AI but test keyword detection)
  try {
    const response2 = await fetch(`${BASE_URL}/ivr/process-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'RecordingUrl=emergency-audio&From=+918340570832&CallSid=test2'
    });
    
    const twiml2 = await response2.text();
    
    if (twiml2.includes('gaon ka naam')) {
      console.log('   ✅ Emergency detected - Break-Glass protocol activated');
    } else if (twiml2.includes('Dhanyavaad')) {
      console.log('   ✅ Normal response - Low severity detected');
    } else {
      console.log('   ⚠️  Unexpected response');
    }
    
    // Check alerts
    const alerts = await fetch(`${BASE_URL}/api/alerts`).then(r => r.json());
    console.log(`   Alerts created: ${alerts.length}`);
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n3. Testing OpenAI API connection...');
  
  // Test 3: Direct API test with real audio
  try {
    const response3 = await fetch(`${BASE_URL}/ivr/process-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'RecordingUrl=https://file-examples.com/storage/fe68c1d7d8e0c2b8c4e9b8c/2017/11/file_example_MP3_700KB.mp3&From=+918340570832&CallSid=test3'
    });
    
    console.log('   API Response Status:', response3.status);
    
    if (response3.ok) {
      console.log('   ✅ OpenAI API connection working');
    } else {
      console.log('   ⚠️  Check OpenAI API key or quota');
    }
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n4. Testing dashboard data flow...');
  
  // Test 4: Check if data flows to dashboard
  try {
    const stats = await fetch(`${BASE_URL}/api/dashboard/stats`).then(r => r.json());
    const recentCalls = await fetch(`${BASE_URL}/api/calls/recent`).then(r => r.json());
    
    console.log(`   Dashboard stats: ${stats.callsToday} calls today`);
    console.log(`   Recent calls: ${recentCalls.length} stored`);
    console.log(`   Active alerts: ${stats.activeAlerts}`);
    
    if (recentCalls.length > 0) {
      console.log('   ✅ Data pipeline working');
    } else {
      console.log('   ⚠️  No calls stored');
    }
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n📊 AI Pipeline Test Summary:');
  console.log('- Audio processing: Check server logs for Whisper transcription');
  console.log('- GPT-4 analysis: Check server logs for AI responses');
  console.log('- Emergency detection: Check if Break-Glass protocol triggers');
  console.log('- Real-time updates: Check dashboard for live data');
  
  console.log('\n🔍 Check server logs for detailed AI processing info!');
}

testAIPipeline().catch(console.error);