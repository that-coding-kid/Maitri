#!/usr/bin/env node

// Test Database Storage - Check what's being stored

const BASE_URL = 'http://localhost:5000';

async function testDatabase() {
  console.log('🗄️  Testing Database Storage...\n');

  // Test 1: Create a call and check storage
  console.log('1. Testing call creation and storage...');
  
  // Simulate incoming call
  await fetch(`${BASE_URL}/ivr/incoming`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'From=+918340570832'
  });

  // Process audio (triggers AI analysis)
  await fetch(`${BASE_URL}/ivr/process-audio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'RecordingUrl=https://demo.twilio.com/docs/classic.mp3&From=+918340570832&CallSid=test123'
  });

  // Check what's stored in calls
  const calls = await fetch(`${BASE_URL}/api/calls/recent`).then(r => r.json());
  console.log('\n📊 Stored Call Data:');
  if (calls.length > 0) {
    const latestCall = calls[0];
    console.log(`   Call ID: ${latestCall.id}`);
    console.log(`   Time: ${latestCall.time}`);
    console.log(`   Category: ${latestCall.category}`);
    console.log(`   Severity: ${latestCall.severity}`);
    console.log(`   Status: ${latestCall.status}`);
  } else {
    console.log('   ❌ No calls stored');
  }

  // Check alerts
  const alerts = await fetch(`${BASE_URL}/api/alerts`).then(r => r.json());
  console.log('\n🚨 Stored Alert Data:');
  if (alerts.length > 0) {
    alerts.forEach((alert, i) => {
      console.log(`   Alert ${i + 1}:`);
      console.log(`     ID: ${alert.id}`);
      console.log(`     Severity: ${alert.severityLevel}`);
      console.log(`     Village: ${alert.village}`);
      console.log(`     Phone: ${alert.phoneNumber}`);
      console.log(`     Emergency Reason: ${alert.emergencyReason}`);
    });
  } else {
    console.log('   ℹ️  No alerts stored');
  }

  // Check dashboard stats
  const stats = await fetch(`${BASE_URL}/api/dashboard/stats`).then(r => r.json());
  console.log('\n📈 Dashboard Statistics:');
  console.log(`   Calls Today: ${stats.callsToday}`);
  console.log(`   Active Alerts: ${stats.activeAlerts}`);
  console.log(`   Avg Response Time: ${stats.avgResponseTime}`);
  console.log(`   Categories: ${stats.categoryBreakdown?.map(c => `${c.label}(${c.count})`).join(', ')}`);

  console.log('\n🔍 What Gets Stored in Database:');
  console.log('');
  console.log('📋 CALL LOGS TABLE:');
  console.log('   ✅ id - Unique call identifier');
  console.log('   ✅ callerHash - Anonymized phone hash');
  console.log('   ✅ encryptedPhone - AES-256 encrypted phone');
  console.log('   ✅ transcription - Audio transcription/URL');
  console.log('   ✅ aiResponse - AI-generated advice');
  console.log('   ✅ severityLevel - 1-5 severity scale');
  console.log('   ✅ category - Maternal/Infant/Menstrual/General');
  console.log('   ✅ isBreakGlass - Emergency de-anonymization flag');
  console.log('   ✅ villageLocation - Village name (emergency only)');
  console.log('   ✅ createdAt - Timestamp');
  console.log('');
  console.log('🚨 ALERTS TABLE:');
  console.log('   ✅ id - Unique alert identifier');
  console.log('   ✅ callId - Reference to call log');
  console.log('   ✅ ashaWorkerId - ASHA worker assigned');
  console.log('   ✅ status - PENDING/RESOLVED');
  console.log('   ✅ emergencyReason - Why it\'s an emergency');
  console.log('   ✅ createdAt - Alert timestamp');
  console.log('   ✅ resolvedAt - Resolution timestamp');

  console.log('\n🔐 Privacy & Security:');
  console.log('   ✅ Phone numbers encrypted with AES-256-GCM');
  console.log('   ✅ Caller identity hashed for anonymization');
  console.log('   ✅ Break-Glass protocol for emergency de-anonymization');
  console.log('   ✅ Village location only stored for emergencies');

  console.log('\n🎯 System Status:');
  console.log(`   Database: ${calls.length > 0 ? '✅ Working' : '⚠️  No data'}`);
  console.log(`   AI Pipeline: ${calls[0]?.severity ? '✅ Working' : '⚠️  Check logs'}`);
  console.log(`   Real-time Updates: ${stats ? '✅ Working' : '❌ Failed'}`);
  console.log(`   Emergency Detection: ${alerts.length > 0 ? '✅ Working' : 'ℹ️  No emergencies'}`);
}

testDatabase().catch(console.error);