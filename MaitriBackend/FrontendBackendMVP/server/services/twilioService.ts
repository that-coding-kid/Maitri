/**
 * Twilio Service for generating TwiML responses
 * 
 * TwiML (Twilio Markup Language) is XML that tells Twilio what to do with a call.
 * This service generates the appropriate TwiML for different call states.
 */

/**
 * Generates TwiML for the initial greeting and audio recording
 * This is returned when a call first comes in to /ivr/incoming
 */
export function generateGreetingTwiML(): string {
  // TODO: When TTS integration is ready, use dynamic voice generation
  // For now, using Twilio's built-in text-to-speech with Indian English voice
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    Namaste. Aap Maitri se baat kar rahe hain. Main aapki madad karne ke liye yahan hoon. 
    Kripaya mujhe apni samasya batayen.
  </Say>
  <Record
    action="/ivr/process-audio"
    method="POST"
    maxLength="60"
    timeout="5"
    transcribe="false"
  />
</Response>`;
}

/**
 * Generates TwiML to play AI-generated advice and continue conversation
 * Used when severity < 4 (non-emergency)
 * 
 * @param adviceText - The text to speak to the caller
 */
export function generateAdviceTwiML(adviceText: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    ${escapeXml(adviceText)}
  </Say>
  <Say voice="Polly.Aditi" language="hi-IN">
    Kya aapka koi aur sawal hai? Agar nahi toh "alvida" kahiye.
  </Say>
  <Record
    action="/ivr/continue-conversation"
    method="POST"
    maxLength="30"
    timeout="5"
    transcribe="false"
  />
</Response>`;
}

/**
 * Generates TwiML to end conversation gracefully
 * Used when user wants to end the call
 */
export function generateGoodbyeTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    Dhanyavaad. Apna khayal rakhein. Alvida.
  </Say>
  <Hangup/>
</Response>`;
}

/**
 * Generates TwiML to ask for village name (Break-Glass protocol)
 * Used when severity >= 4 (emergency)
 */
export function generateVillageRequestTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    Main aapki sthiti ke baare mein chintit hoon. 
    Aapki behtar madad ke liye, kripaya apne gaon ka naam batayen.
  </Say>
  <Record
    action="/ivr/break-glass-confirm"
    method="POST"
    maxLength="10"
    timeout="5"
    transcribe="false"
  />
</Response>`;
}

/**
 * Generates TwiML for emergency confirmation after village name is captured
 */
export function generateEmergencyConfirmationTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    Dhanyavaad. Main aapki jaankari aapke ASHA karyakarta ko bhej rahi hoon. 
    Ve jaldi hi aapse sampark karenge. Kripaya shant rahein.
  </Say>
  <Hangup/>
</Response>`;
}

/**
 * Generates TwiML for timeout/error fallback
 * Used when AI service is unavailable or times out
 */
export function generateFallbackTwiML(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi" language="hi-IN">
    Maaf kijiye, main aapko sunne mein samasya ka samna kar rahi hoon. 
    Kripaya apne ASHA karyakarta se turant sampark karein.
  </Say>
  <Hangup/>
</Response>`;
}

/**
 * Escape XML special characters to prevent TwiML injection
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
