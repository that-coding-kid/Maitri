import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { analyzeAudio } from "./services/aiService";
import {
  generateGreetingTwiML,
  generateAdviceTwiML,
  generateVillageRequestTwiML,
  generateEmergencyConfirmationTwiML,
  generateFallbackTwiML,
  generateGoodbyeTwiML
} from "./services/twilioService";
import crypto from "crypto";

// Encryption helpers using AES-256-GCM
// CRITICAL: Encryption key MUST be set in environment variable for production
// Use a 32-byte hex string: openssl rand -hex 32
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY || ''; 
if (!ENCRYPTION_KEY_HEX) {
  console.error('ERROR: ENCRYPTION_KEY environment variable is not set!');
  console.error('Generate one with: openssl rand -hex 32');
  console.error('For MVP testing, using fallback key - DO NOT USE IN PRODUCTION');
}
const ENCRYPTION_KEY = ENCRYPTION_KEY_HEX 
  ? Buffer.from(ENCRYPTION_KEY_HEX, 'hex')
  : Buffer.from('00000000000000000000000000000000000000000000000000000000000000000', 'hex').slice(0, 32);

const IV_LENGTH = 16; // For AES, this is always 16

// Stable salt for phone hashing - MUST persist across restarts
// TODO: Move to environment variable
const PHONE_HASH_SALT = process.env.PHONE_HASH_SALT || 'maitri-stable-salt-2024';

function encryptPhone(phone: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return iv + authTag + encrypted data (all hex encoded)
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decryptPhone(encryptedData: string): string {
  const parts = encryptedData.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

function hashPhone(phone: string): string {
  // Use stable salt to ensure hashes match across restarts
  return crypto.createHash('sha256').update(phone + PHONE_HASH_SALT).digest('hex');
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize Socket.IO for real-time alerts
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // TODO: Configure proper CORS in production
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Dashboard connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Dashboard disconnected:', socket.id);
    });
  });

  // ==========================================
  // IVR ENDPOINTS (Twilio Webhooks)
  // ==========================================

  /**
   * POST /ivr/incoming
   * Twilio webhook - called when a new call comes in
   * Returns TwiML to greet caller and record their message
   */
  app.post("/ivr/incoming", async (req, res) => {
    try {
      const { From: callerPhone } = req.body;
      
      console.log(`[IVR] Incoming call from: ${callerPhone}`);
      
      // Store initial call log (anonymized)
      const callLog = await storage.createCallLog({
        callerHash: hashPhone(callerPhone),
        encryptedPhone: encryptPhone(callerPhone),
        transcription: null,
        aiResponse: null,
        severityLevel: 0, // Will be updated after analysis
        category: "General",
        isBreakGlass: false,
        villageLocation: null
      });
      
      // Return TwiML to greet and record
      res.type('text/xml');
      res.send(generateGreetingTwiML());
    } catch (error) {
      console.error('[IVR] Error in incoming call:', error);
      res.type('text/xml');
      res.send(generateFallbackTwiML());
    }
  });

  /**
   * POST /ivr/process-audio
   * Twilio webhook - called after user's audio is recorded
   * Processes audio through AI pipeline and determines next steps
   */
  app.post("/ivr/process-audio", async (req, res) => {
    try {
      const { RecordingUrl, From: callerPhone, CallSid } = req.body;
      
      console.log(`[IVR] Processing audio from: ${callerPhone}, Recording: ${RecordingUrl}`);
      
      // Analyze audio through AI pipeline (currently mocked)
      const aiResult = await analyzeAudio(RecordingUrl);
      
      console.log(`[IVR] AI Analysis - Severity: ${aiResult.severity}, Category: ${aiResult.category}`);
      console.log(`[IVR] Emergency Reason: ${aiResult.emergencyReason || 'None'}`);
      
      // Update call log with FULL AI results including emergency reasoning
      const callLogs = await storage.getAllCallLogs();
      const recentCall = callLogs
        .filter(log => log.callerHash === hashPhone(callerPhone))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      
      if (recentCall) {
        // Update call log with AI analysis results
        const updatedCall = await storage.updateCallLog(recentCall.id, {
          transcription: `Recording URL: ${RecordingUrl}`, // Store URL for future transcription
          aiResponse: aiResult.responseText,
          severityLevel: aiResult.severity,
          category: aiResult.category
        });
        
        if (!updatedCall) {
          console.error('[IVR] Failed to update call log');
          res.type('text/xml');
          res.send(generateFallbackTwiML());
          return;
        }
        
        // For emergencies, immediately create alert with AI emergency reason
        if (aiResult.severity >= 4) {
          try {
            const alert = await storage.createAlert({
              callId: recentCall.id,
              ashaWorkerId: null,
              status: "PENDING",
              emergencyReason: aiResult.emergencyReason || `Severity ${aiResult.severity} emergency detected`
            });
            console.log(`[IVR] Emergency alert created: ${alert.id}`);
          } catch (alertError) {
            console.error('[IVR] CRITICAL: Failed to create emergency alert:', alertError);
            // Continue with Break-Glass flow even if alert creation fails
            // The village capture step will handle alerting
          }
        }
      }
      
      // Branching logic based on severity
      if (aiResult.severity >= 4) {
        console.log('[IVR] EMERGENCY DETECTED - Activating Break-Glass protocol');
        
        // Return TwiML to ask for village name
        res.type('text/xml');
        res.send(generateVillageRequestTwiML());
      } else {
        console.log('[IVR] Low severity - Playing advice and ending call');
        
        // Return TwiML to play advice and hang up
        res.type('text/xml');
        res.send(generateAdviceTwiML(aiResult.responseText));
      }
    } catch (error) {
      console.error('[IVR] Error processing audio:', error);
      res.type('text/xml');
      res.send(generateFallbackTwiML());
    }
  });

  /**
   * POST /ivr/continue-conversation
   * Twilio webhook - handles ongoing conversation for low severity cases
   */
  // Track conversation turns per call
  const conversationTurns = new Map<string, number>();
  const MAX_CONVERSATION_TURNS = 5; // Limit to 5 back-and-forth exchanges
  
  app.post("/ivr/continue-conversation", async (req, res) => {
    try {
      const { RecordingUrl, From: callerPhone, CallSid } = req.body;
      
      console.log(`[IVR] Continuing conversation from: ${callerPhone}`);
      
      // Check conversation turn limit
      const currentTurns = conversationTurns.get(CallSid) || 0;
      conversationTurns.set(CallSid, currentTurns + 1);
      
      if (currentTurns >= MAX_CONVERSATION_TURNS) {
        console.log('[IVR] Maximum conversation turns reached - ending call');
        conversationTurns.delete(CallSid);
        res.type('text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    Aapne bahut saare sawal pooche hain. Agar aur madad chahiye toh ASHA karyakarta se miliye. Dhanyavaad.
  </Say>
  <Hangup/>
</Response>`);
        return;
      }
      
      // First, get transcription WITHOUT full AI analysis
      const transcriptionResult = await analyzeAudio(RecordingUrl);
      const transcription = transcriptionResult.transcription || "";
      
      // Check if user wants to end the call FIRST (before analyzing as health concern)
      const endKeywords = [
        // Hindi variations of alvida
        "अलविदा", "अल्विदा", "alvida",
        // Other Hindi goodbye/end words
        "धन्यवाद", "समाप्त", "बंद", "खत्म", "रुको", "बाय",
        // English variations
        "bye", "goodbye", "thanks", "thank you", "end", "stop", "quit", "exit"
      ];
      
      // Check if transcription contains any end keyword (case-insensitive)
      const lowerTranscription = transcription.toLowerCase();
      const wantsToEnd = endKeywords.some(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        return lowerTranscription.includes(lowerKeyword);
      });
      
      console.log('[IVR] Transcription:', transcription, 'Wants to end:', wantsToEnd);
      
      if (wantsToEnd) {
        console.log('[IVR] User wants to end conversation');
        conversationTurns.delete(CallSid); // Clean up
        res.type('text/xml');
        res.send(generateGoodbyeTwiML());
        return;
      }
      
      // Now check if new emergency symptoms mentioned
      const aiResult = transcriptionResult;
      if (aiResult.severity >= 4) {
        console.log('[IVR] New emergency symptoms detected in conversation');
        
        // Create new alert
        const callLogs = await storage.getAllCallLogs();
        const recentCall = callLogs
          .filter(log => log.callerHash === hashPhone(callerPhone))
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
        
        if (recentCall) {
          await storage.createAlert({
            callId: recentCall.id,
            ashaWorkerId: null,
            status: "PENDING",
            emergencyReason: aiResult.emergencyReason || "New emergency symptoms during conversation"
          });
        }
        
        res.type('text/xml');
        res.send(generateVillageRequestTwiML());
        return;
      }
      
      // Continue normal conversation
      console.log('[IVR] Continuing normal conversation');
      res.type('text/xml');
      res.send(generateAdviceTwiML(aiResult.responseText));
      
    } catch (error) {
      console.error('[IVR] Error in continue-conversation:', error);
      res.type('text/xml');
      res.send(generateFallbackTwiML());
    }
  });

  /**
   * POST /ivr/break-glass-confirm
   * Twilio webhook - called after village name is recorded (emergency flow)
   * De-anonymizes call, updates alert, broadcasts to dashboard
   */
  app.post("/ivr/break-glass-confirm", async (req, res) => {
    try {
      const { RecordingUrl, From: callerPhone } = req.body;
      
      console.log(`[IVR] Break-Glass confirmation from: ${callerPhone}`);
      console.log(`[IVR] Village recording URL: ${RecordingUrl}`);
      
      // TODO: Transcribe village name from RecordingUrl using OpenAI Whisper
      // For now, store the recording URL for manual verification/future transcription
      const villageName = `Village Recording: ${RecordingUrl}`;
      
      // Find the most recent call log and its associated alert
      const callLogs = await storage.getAllCallLogs();
      const recentCall = callLogs
        .filter(log => log.callerHash === hashPhone(callerPhone))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      
      if (recentCall) {
        try {
          // Update call log - de-anonymize by adding village location
          const updatedCall = await storage.updateCallLog(recentCall.id, {
            isBreakGlass: true,
            villageLocation: villageName
          });
          
          if (!updatedCall) {
            console.error('[IVR] CRITICAL: Failed to update call log with village');
            // Still try to broadcast alert even if update failed
          }
          
          // Find or create alert for this emergency call
          const alerts = await storage.getAllAlerts();
          let existingAlert = alerts.find(a => a.callId === recentCall.id);
          
          // If no alert exists (failsafe), create one now
          if (!existingAlert) {
            console.warn('[IVR] No existing alert found - creating emergency alert now');
            existingAlert = await storage.createAlert({
              callId: recentCall.id,
              ashaWorkerId: null,
              status: "PENDING",
              emergencyReason: `Severity ${recentCall.severityLevel} emergency from ${villageName}`
            });
          }
          
          // Decrypt phone number with error handling
          let maskedPhone = '****-****-XXXX';
          try {
            if (recentCall.encryptedPhone) {
              const decryptedPhone = decryptPhone(recentCall.encryptedPhone);
              maskedPhone = '****-****-' + decryptedPhone.slice(-4);
            }
          } catch (decryptError) {
            console.error('[IVR] CRITICAL: Phone decryption failed - alert will show masked placeholder', decryptError);
            // Continue with alert broadcast using placeholder
          }
          
          // Broadcast emergency alert to dashboard via WebSocket
          io.emit('emergency_alert', {
            id: existingAlert.id,
            phoneNumber: maskedPhone, // MASKED for security
            villageName: villageName,
            timestamp: new Date().toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            severityLevel: recentCall.severityLevel,
            category: recentCall.category,
            emergencyReason: existingAlert.emergencyReason
          });
          
          console.log(`[IVR] Emergency alert broadcast - Alert ID: ${existingAlert.id}`);
          console.log(`[IVR] Village: ${villageName}, Severity: ${recentCall.severityLevel}`);
        } catch (error) {
          console.error('[IVR] CRITICAL: Break-Glass workflow error:', error);
          // Even on error, try to inform ASHA through fallback mechanism
          // TODO: Implement SMS/email fallback notification system
        }
      }
      
      // Return TwiML to confirm and hang up
      res.type('text/xml');
      res.send(generateEmergencyConfirmationTwiML());
    } catch (error) {
      console.error('[IVR] Error in break-glass confirm:', error);
      res.type('text/xml');
      res.send(generateFallbackTwiML());
    }
  });

  // ==========================================
  // DASHBOARD API ENDPOINTS
  // ==========================================

  /**
   * GET /api/dashboard/stats
   * Returns aggregated statistics for the dashboard
   */
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const callLogs = await storage.getAllCallLogs();
      const alerts = await storage.getAllAlerts();
      
      // Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCalls = callLogs.filter(log => log.createdAt >= today);
      const pendingAlerts = alerts.filter(a => a.status === "PENDING");
      
      // Calculate average response time (mock for now)
      const avgResponseTime = "8 min"; // TODO: Calculate from real data
      
      // Category breakdown
      const categoryCount = callLogs.reduce((acc, log) => {
        acc[log.category] = (acc[log.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const totalCalls = callLogs.length || 1;
      const categoryBreakdown = Object.entries(categoryCount).map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / totalCalls) * 100)
      }));
      
      res.json({
        callsToday: todayCalls.length,
        activeAlerts: pendingAlerts.length,
        avgResponseTime,
        categoryBreakdown,
        trends: generateMockTrends() // TODO: Calculate from real time-series data
      });
    } catch (error) {
      console.error('[API] Error fetching dashboard stats:', error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  /**
   * GET /api/alerts
   * Returns all pending alerts for the dashboard
   */
  app.get("/api/alerts", async (req, res) => {
    try {
      const alerts = await storage.getPendingAlerts();
      
      // Enrich alerts with call log data
      const enrichedAlerts = await Promise.all(
        alerts.map(async (alert) => {
          const callLog = await storage.getCallLog(alert.callId);
          if (!callLog) {
            console.error(`[API] Alert ${alert.id} has no associated call log`);
            return null;
          }
          
          // Decrypt phone number ONLY for authenticated dashboard access
          // This is where Break-Glass de-anonymization happens
          let decryptedPhone = "Decryption Failed";
          try {
            decryptedPhone = callLog.encryptedPhone 
              ? decryptPhone(callLog.encryptedPhone)
              : "Not Available";
          } catch (decryptError) {
            console.error(`[API] CRITICAL: Failed to decrypt phone for alert ${alert.id}`, decryptError);
            // Return placeholder but keep alert visible to ASHA workers
            decryptedPhone = "****-DECRYPTION-ERROR****";
          }
          
          return {
            id: alert.id,
            timestamp: alert.createdAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            severity: callLog.severityLevel,
            village: callLog.villageLocation || "Pending location capture",
            category: callLog.category,
            phoneNumber: decryptedPhone, // Full number only in secure API, not WebSocket
            villageName: callLog.villageLocation || "Pending location capture",
            severityLevel: callLog.severityLevel,
            emergencyReason: alert.emergencyReason || "Assessment in progress"
          };
        })
      );
      
      res.json(enrichedAlerts.filter(a => a !== null));
    } catch (error) {
      console.error('[API] Error fetching alerts:', error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  /**
   * GET /api/calls/recent
   * Returns recent call logs for the dashboard table
   */
  app.get("/api/calls/recent", async (req, res) => {
    try {
      const callLogs = await storage.getAllCallLogs();
      const alerts = await storage.getAllAlerts();
      
      // Get last 10 calls, sorted by time
      const recentCalls = callLogs
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)
        .map(log => {
          const callAlert = alerts.find(a => a.callId === log.id);
          const status = callAlert?.status === "PENDING" ? "Pending" : "Resolved";
          
          return {
            id: log.id,
            time: log.createdAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }),
            category: log.category,
            severity: log.severityLevel,
            status
          };
        });
      
      res.json(recentCalls);
    } catch (error) {
      console.error('[API] Error fetching recent calls:', error);
      res.status(500).json({ error: "Failed to fetch calls" });
    }
  });

  /**
   * POST /api/alerts/:id/resolve
   * Mark an alert as resolved
   */
  app.post("/api/alerts/:id/resolve", async (req, res) => {
    try {
      const { id } = req.params;
      
      const updatedAlert = await storage.updateAlert(id, {
        status: "RESOLVED",
        resolvedAt: new Date()
      });
      
      if (!updatedAlert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      
      console.log(`[API] Alert resolved: ${id}`);
      res.json({ success: true, alert: updatedAlert });
    } catch (error) {
      console.error('[API] Error resolving alert:', error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });

  return httpServer;
}

// Helper function to generate mock trend data
function generateMockTrends() {
  return [
    { name: '6 AM', calls: Math.floor(Math.random() * 15) + 5 },
    { name: '9 AM', calls: Math.floor(Math.random() * 20) + 10 },
    { name: '12 PM', calls: Math.floor(Math.random() * 25) + 15 },
    { name: '3 PM', calls: Math.floor(Math.random() * 30) + 20 },
    { name: '6 PM', calls: Math.floor(Math.random() * 20) + 10 },
    { name: 'Now', calls: Math.floor(Math.random() * 15) + 5 },
  ];
}
