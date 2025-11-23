import type { Express } from "express";
import { analyzeAudio } from "./services/aiService";
import { generateGreetingTwiML, generateAdviceTwiML, generateFallbackTwiML } from "./services/twilioService";
import { storage } from "./storage";
import crypto from "crypto";
import OpenAI from 'openai';

// Encryption helpers (same as routes.ts)
const ENCRYPTION_KEY_HEX = process.env.ENCRYPTION_KEY || '';
const ENCRYPTION_KEY = ENCRYPTION_KEY_HEX 
  ? Buffer.from(ENCRYPTION_KEY_HEX, 'hex')
  : Buffer.from('00000000000000000000000000000000000000000000000000000000000000000', 'hex').slice(0, 32);

const PHONE_HASH_SALT = process.env.PHONE_HASH_SALT || 'maitri-stable-salt-2024';

function encryptPhone(phone: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function hashPhone(phone: string): string {
  return crypto.createHash('sha256').update(phone + PHONE_HASH_SALT).digest('hex');
}

// Initialize OpenAI for conversational mode
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Store conversation context (in production, use Redis/database)
const conversations = new Map<string, Array<{role: string, content: string}>>();

/**
 * Conversational IVR Routes - Similar to MeraSaarthi
 */
export function registerConversationalRoutes(app: Express) {
  
  /**
   * POST /call - Main entry point for Twilio calls
   * Similar to MeraSaarthi's /call endpoint
   */
  app.post("/call", async (req, res) => {
    console.log('[IVR] New call received');
    
    res.type('text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    Namaste! Main Maitri hoon, aapki swasthya sahayika. 
    Kripaya apni samasya bataiye. Main sunne ke liye tayyar hoon.
  </Say>
  <Record
    action="/process-speech"
    method="POST"
    maxLength="30"
    timeout="5"
    transcribe="false"
    playBeep="true"
  />
</Response>`);
  });

  /**
   * POST /process-speech - Process user's speech and continue conversation
   * Similar to MeraSaarthi's speech processing
   */
  app.post("/process-speech", async (req, res) => {
    try {
      const { RecordingUrl, From: callerPhone, CallSid } = req.body;
      
      console.log(`[IVR] Processing speech from: ${callerPhone}`);
      console.log(`[IVR] Recording URL: ${RecordingUrl}`);

      // Store call log in database
      const callLog = await storage.createCallLog({
        callerHash: hashPhone(callerPhone),
        encryptedPhone: encryptPhone(callerPhone),
        transcription: null,
        aiResponse: null,
        severityLevel: 1,
        category: "General",
        isBreakGlass: false,
        villageLocation: null
      });

      // Get or create conversation context
      let conversation = conversations.get(CallSid) || [];
      
      // Transcribe audio using OpenAI Whisper
      let transcription = "मुझे बुखार है और सिर दर्द हो रहा है"; // Fallback
      
      if (openai && RecordingUrl) {
        try {
          const audioFile = await downloadAudioForOpenAI(RecordingUrl);
          const whisperResponse = await openai.audio.transcriptions.create({
            file: audioFile,
            model: "whisper-1",
            language: "hi", // Hindi
          });
          transcription = whisperResponse.text;
          console.log(`[IVR] Transcription: ${transcription}`);
        } catch (error) {
          console.error('[IVR] Transcription error:', error);
        }
      }

      // Add user message to conversation
      conversation.push({ role: "user", content: transcription });

      // Get AI response using health-focused prompt
      let aiResponse = "मुझे खुशी है कि आपने संपर्क किया। कृपया अपने ASHA कार्यकर्ता से मिलें।";
      
      if (openai) {
        try {
          const chatResponse = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `आप 'मैत्री' हैं, एक दयालु स्वास्थ्य सहायिका। आप ग्रामीण महिलाओं की मदद करती हैं।

नियम:
1. हमेशा हिंदी में जवाब दें
2. सहानुभूति दिखाएं
3. चिकित्सा सलाह न दें
4. ASHA कार्यकर्ता से मिलने की सलाह दें
5. 2-3 वाक्यों में जवाब दें
6. यदि गंभीर लक्षण हैं तो तुरंत डॉक्टर से मिलने को कहें`
              },
              ...conversation
            ],
            temperature: 0.7,
            max_tokens: 150
          });
          
          aiResponse = chatResponse.choices[0].message.content || aiResponse;
          console.log(`[IVR] AI Response: ${aiResponse}`);
        } catch (error) {
          console.error('[IVR] AI response error:', error);
        }
      }

      // Add AI response to conversation
      conversation.push({ role: "assistant", content: aiResponse });
      conversations.set(CallSid, conversation);

      // Check if conversation should end (simple logic)
      const shouldEnd = aiResponse.includes("धन्यवाद") || 
                       aiResponse.includes("अलविदा") || 
                       conversation.length > 10;

      res.type('text/xml');
      
      if (shouldEnd) {
        // End conversation
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    ${aiResponse}
    आपका स्वास्थ्य हमारी प्राथमिकता है। धन्यवाद।
  </Say>
  <Hangup/>
</Response>`);
        
        // Clean up conversation
        conversations.delete(CallSid);
      } else {
        // Continue conversation
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    ${aiResponse}
  </Say>
  <Record
    action="/process-speech"
    method="POST"
    maxLength="30"
    timeout="5"
    transcribe="false"
    playBeep="true"
  />
</Response>`);
      }

    } catch (error) {
      console.error('[IVR] Error in process-speech:', error);
      res.type('text/xml');
      res.send(generateFallbackTwiML());
    }
  });

  /**
   * POST /make-call - Initiate outbound call (for testing)
   * Similar to MeraSaarthi's outbound calling
   */
  app.post("/make-call", async (req, res) => {
    const { phoneNumber } = req.body;
    
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return res.json({ 
        success: false, 
        message: "Twilio credentials not configured" 
      });
    }

    try {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      const call = await twilio.calls.create({
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: `${req.protocol}://${req.get('host')}/call`,
        method: 'POST'
      });

      console.log(`[IVR] Outbound call initiated: ${call.sid}`);
      
      res.json({
        success: true,
        callSid: call.sid,
        message: "Call initiated successfully"
      });
    } catch (error) {
      console.error('[IVR] Error making call:', error);
      res.json({
        success: false,
        message: error.message
      });
    }
  });
}

/**
 * Download audio file for OpenAI API
 */
async function downloadAudioForOpenAI(url: string): Promise<File> {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download audio: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  return new File([buffer], 'audio.wav', { type: 'audio/wav' });
}