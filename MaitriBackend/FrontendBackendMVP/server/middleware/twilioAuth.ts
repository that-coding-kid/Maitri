import { Request, Response, NextFunction } from 'express';
import { validateRequest } from 'twilio';

/**
 * Middleware to validate Twilio webhook requests
 * Ensures requests are actually from Twilio
 */
export function validateTwilioRequest(req: Request, res: Response, next: NextFunction) {
  // Skip validation in development or if auth token not set
  if (process.env.NODE_ENV === 'development' || !process.env.TWILIO_AUTH_TOKEN) {
    console.log('[Twilio] Skipping webhook validation in development');
    return next();
  }

  const twilioSignature = req.get('X-Twilio-Signature') || '';
  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  
  const isValid = validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    twilioSignature,
    url,
    req.body
  );

  if (!isValid) {
    console.error('[Twilio] Invalid webhook signature');
    return res.status(403).send('Forbidden');
  }

  next();
}