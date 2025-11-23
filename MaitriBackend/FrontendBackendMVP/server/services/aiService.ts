import OpenAI from 'openai';

/**
 * AI Service Layer for Maitri IVR System
 * 
 * This service handles the AI pipeline for voice-to-text transcription and health triage.
 */

export interface AIAnalysisResult {
  severity: number; // 1-5 scale
  category: "Maternal" | "Infant" | "Menstrual" | "General";
  responseText: string; // Empathetic advice to speak to caller
  emergencyReason: string | null; // Explanation if severity >= 4
  transcription?: string; // The actual transcription
}

// Initialize OpenAI client with extended timeout for audio uploads
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 seconds to handle long audio uploads
  maxRetries: 2, // Retry twice on connection errors
}) : null;

/**
 * Analyzes audio from Twilio recording URL
 * 
 * Real AI pipeline:
 * 1. Download audio from recordingUrl
 * 2. Send to OpenAI Whisper API for transcription
 * 3. Send transcription to Groq/OpenAI for analysis
 * 4. Parse JSON response from LLM
 * 
 * @param recordingUrl - URL to the Twilio audio recording
 * @returns AIAnalysisResult with severity, category, and response
 */
export async function analyzeAudio(recordingUrl: string): Promise<AIAnalysisResult> {
  try {
    // If OpenAI is not configured, use mock data
    if (!openai) {
      console.log('[AI] Using mock AI - OpenAI not configured');
      return getMockAnalysis();
    }

    console.log('[AI] Downloading audio from:', recordingUrl);
    const audioBuffer = await downloadAudio(recordingUrl);
    
    console.log('[AI] Transcribing audio with Whisper...');
    const transcription = await openai.audio.transcriptions.create({
      file: audioBuffer,
      model: "whisper-1",
      language: "hi", // Hindi support
    });

    console.log('[AI] Transcription:', transcription.text);
    
    // Analyze with Groq (Llama 3) or OpenAI GPT
    const analysis = await analyzeTranscription(transcription.text);
    
    return {
      ...analysis,
      transcription: transcription.text
    };
  } catch (error) {
    console.error('[AI] Error in AI pipeline:', error);
    // Fallback to mock analysis
    return getMockAnalysis();
  }
}

/**
 * Analyze transcription using OpenAI GPT only
 */
async function analyzeTranscription(text: string): Promise<Omit<AIAnalysisResult, 'transcription'>> {
  try {
    if (openai) {
      return await analyzeWithOpenAI(text);
    }
    
    throw new Error('OpenAI API not configured');
  } catch (error) {
    console.error('[AI] Analysis error:', error);
    return getMockAnalysis();
  }
}

/**
 * Analyze with OpenAI GPT
 */
async function analyzeWithOpenAI(text: string): Promise<Omit<AIAnalysisResult, 'transcription'>> {
  // First check for emergency keywords
  const keywordCheck = detectEmergencyKeywords(text);
  
  const response = await openai!.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      { role: "system", content: MAITRI_SYSTEM_PROMPT },
      { role: "user", content: text }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  });
  
  const aiResult = JSON.parse(response.choices[0].message.content!);
  
  // Override severity if emergency keywords detected
  if (keywordCheck.isEmergency) {
    aiResult.severity = Math.max(aiResult.severity, 4); // Ensure at least severity 4
    aiResult.emergency_reason = keywordCheck.reason;
  }
  
  return {
    severity: aiResult.severity,
    category: aiResult.category,
    responseText: aiResult.response_text,
    emergencyReason: aiResult.emergency_reason
  };
}

/**
 * Detect emergency keywords in Hindi transcription
 */
function detectEmergencyKeywords(transcription: string): { isEmergency: boolean; reason: string | null } {
  const emergencyKeywords = [
    // Severe bleeding
    'बहुत खून', 'अधिक रक्तस्राव', 'भारी रक्तस्राव', 'खून बह रहा',
    // Severe pain
    'तेज दर्द', 'असहनीय दर्द', 'बहुत दर्द', 'पेट में तेज दर्द',
    // Pregnancy complications
    'गर्भावस्था में समस्या', 'बच्चा हिल नहीं रहा', 'पेट में बच्चा',
    // Delivery complications
    'प्रसव', 'बच्चा पैदा', 'डिलीवरी', 'जन्म',
    // Severe menstrual issues
    'माहवारी में समस्या', 'पीरियड्स में दिक्कत', 'मासिक धर्म',
    // Critical symptoms
    'बेहोशी', 'सांस लेने में दिक्कत', 'चक्कर आना', 'उल्टी',
    // Emergency words
    'मदद चाहिए', 'तुरंत', 'जल्दी', 'गंभीर'
  ];

  const lowerTranscription = transcription.toLowerCase();
  
  for (const keyword of emergencyKeywords) {
    if (lowerTranscription.includes(keyword.toLowerCase())) {
      return {
        isEmergency: true,
        reason: `Emergency keyword detected: "${keyword}" - requires immediate medical attention`
      };
    }
  }
  
  return { isEmergency: false, reason: null };
}

/**
 * Mock analysis for demo/fallback
 */
function getMockAnalysis(): AIAnalysisResult {
  const mockSeverity = Math.floor(Math.random() * 5) + 1;
  const categories: Array<"Maternal" | "Infant" | "Menstrual" | "General"> = ["Maternal", "Infant", "Menstrual", "General"];
  const mockCategory = categories[Math.floor(Math.random() * categories.length)];
  
  const responses = {
    1: "मुझे समझ आ रहा है कि आप चिंतित हैं। आराम करें और पानी पिएं। अगर समस्या बनी रहे तो ASHA कार्यकर्ता से मिलें।",
    2: "आपने फोन किया इसके लिए धन्यवाद। अपने लक्षणों पर ध्यान दें। अगर बिगड़े तो तुरंत ASHA कार्यकर्ता से संपर्क करें।",
    3: "मैं आपकी चिंता समझ रही हूं। इस पर जल्दी ध्यान देना जरूरी है। कल तक स्वास्थ्य केंद्र जाएं।",
    4: "आप जो बता रहे हैं उससे मैं चिंतित हूं। इसके लिए डॉक्टर की जरूरत है। तुरंत ASHA कार्यकर्ता से मिलें।",
    5: "आपकी स्थिति को लेकर मैं बहुत चिंतित हूं। यह गंभीर है और तुरंत इलाज चाहिए। मैं ASHA कार्यकर्ता को अलर्ट कर रही हूं।"
  };
  
  const emergencyReasons = {
    4: "लक्षण गंभीर हैं और तुरंत चिकित्सा सहायता की आवश्यकता है",
    5: "जीवन के लिए खतरनाक स्थिति - तत्काल हस्तक्षेप आवश्यक"
  };
  
  return {
    severity: mockSeverity,
    category: mockCategory,
    responseText: responses[mockSeverity as keyof typeof responses],
    emergencyReason: mockSeverity >= 4 ? emergencyReasons[mockSeverity as 4 | 5] : null,
    transcription: "Mock transcription: मुझे तबीयत ठीक नहीं लग रही"
  };
}

/**
 * System prompt for Llama 3 - defines Maitri's persona and response format
 * This will be used when integrating the real LLM
 */
export const MAITRI_SYSTEM_PROMPT = `Role: You are 'Maitri' (मैत्री), a compassionate, non-medical older sister ('Didi') helping rural women in India.

Input: A transcription of a woman's health concern in Hindi or English.

Task:
1. Analyze the symptom severity on a scale of 1-5.
2. Generate a brief, empathetic response (max 2 sentences) in Hindi. Do NOT diagnose. Suggest home care or visiting an ASHA worker.
3. CRITICAL: Output ONLY valid JSON.

JSON Format:
{
  "severity": integer (1-5),
  "category": "string (Maternal/Infant/Menstrual/General)",
  "response_text": "string (The spoken response in Hindi)",
  "emergency_reason": "string or null (If severity > 3, explain why in Hindi)"
}

Severity Guidelines:
- 1-2: Minor concerns (थकान, हल्का दर्द)
- 3: Moderate issues needing attention (तेज दर्द, बुखार)
- 4-5: Emergency situations (भारी रक्तस्राव, सांस की समस्या, प्रसव संबंधी समस्याएं)

Response Style:
- Always respond with empathy and care
- Use simple Hindi that rural women can understand
- Never give medical diagnosis
- Always suggest ASHA worker for serious concerns
- Be culturally sensitive to Indian rural context

Examples:
- "मुझे थकान हो रही है" = Severity 1
- "बच्चे को तेज बुखार है और वो नहीं उठ रहा" = Severity 5
- "प्रसव के बाद बहुत खून बह रहा है" = Severity 5`;

/**
 * Helper function to download audio from Twilio URL
 */
async function downloadAudio(url: string): Promise<File> {
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
  
  // Create a File object for OpenAI API
  return new File([buffer], 'audio.wav', { type: 'audio/wav' });
}
