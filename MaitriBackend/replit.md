# Maitri - Rural Health IVR System

## Overview

Maitri is a voice-based Interactive Voice Response (IVR) health monitoring system designed for rural India. The system enables community members to call a toll-free number, describe health concerns in their native language (Hindi), and receive AI-powered health triage. Critical cases trigger emergency alerts for ASHA (Accredited Social Health Activist) workers through a real-time dashboard.

The application uses voice-to-text transcription, AI-powered severity assessment, and a privacy-first architecture with encrypted phone number storage and "break-glass" emergency protocols for high-severity cases.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with Material Design 3 principles
- **State Management**: TanStack Query (React Query) for server state
- **Real-time Updates**: Socket.IO client for live alert notifications

**Design System**:
- Typography: Roboto (primary), Roboto Mono (metrics/data)
- Color palette: Neutral base with teal/emerald primary accent
- Layout: 12-column grid system with responsive breakpoints
- Component library: Pre-built shadcn components for consistency

**Key Pages**:
- Dashboard: Single-page application showing real-time call statistics, alert feed, category breakdowns, and trend charts
- Alert management: Modal-based emergency alert viewing and resolution

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Design**:
- REST endpoints for dashboard data (`/api/dashboard/stats`, `/api/calls/recent`, `/api/alerts`)
- Twilio webhook handlers for IVR flow (`/ivr/incoming`, `/ivr/process-audio`, `/ivr/break-glass-confirm`)
- WebSocket server (Socket.IO) for real-time alert broadcasting

**IVR Flow Architecture**:
1. **Incoming Call** → Greeting in Hindi (TwiML with Polly.Aditi voice)
2. **Audio Recording** → 60-second maximum capture
3. **AI Processing Pipeline**:
   - Download audio from Twilio recording URL
   - Transcribe using OpenAI Whisper API (Hindi support)
   - Analyze with GPT/Llama for health triage
   - Extract severity (1-5 scale), category, and empathetic response
4. **Response Routing**:
   - Severity < 4: Play advice, continue conversation
   - Severity ≥ 4: Activate "break-glass" protocol, request village name
5. **Break-Glass Protocol**: Emergency cases collect village location to decrypt phone number for ASHA worker contact

**Privacy & Security**:
- Phone numbers stored as SHA-256 hashes by default (stable salt: `PHONE_HASH_SALT`)
- AES-256-GCM encryption for actual phone numbers (key: `ENCRYPTION_KEY`)
- Encrypted phone only decrypted during break-glass emergencies
- Encryption key must be 32-byte hex string (generated via `openssl rand -hex 32`)

### Data Storage

**ORM**: Drizzle ORM with PostgreSQL dialect
- Schema defined in `shared/schema.ts`
- Two primary tables: `call_logs` and `alerts`

**CallLogs Table**:
- `caller_hash`: SHA-256 hash of phone number (searchable, privacy-preserving)
- `encrypted_phone`: AES-256-GCM encrypted actual number (break-glass only)
- `transcription`: Whisper API output
- `ai_response`: GPT-generated empathetic advice
- `severity_level`: Integer 1-5 scale
- `category`: "Maternal" | "Infant" | "Menstrual" | "General"
- `is_break_glass`: Boolean flag for emergencies
- `village_location`: Collected during break-glass flow

**Alerts Table**:
- `call_id`: Foreign key to call_logs
- `status`: "PENDING" | "RESOLVED"
- `emergency_reason`: AI-generated explanation for high severity
- `asha_worker_id`: Assigned worker (nullable)

**Development Storage**: In-memory storage (`MemStorage` class) for rapid prototyping without database setup

### AI Service Layer

**Primary Provider**: OpenAI API
- **Whisper API**: Audio-to-text transcription with Hindi language support
- **GPT-4**: Health triage analysis with structured JSON output

**Analysis Pipeline** (`server/services/aiService.ts`):
1. Fetch audio from Twilio recording URL
2. Convert to format suitable for Whisper
3. Transcribe with language hint (`language: "hi"`)
4. Send transcription + prompt to GPT for analysis
5. Parse JSON response containing severity, category, response text, and emergency reason

**Mock AI Fallback**: When `OPENAI_API_KEY` not configured, uses deterministic mock responses for testing

**Prompt Engineering**:
- System role: Health triage specialist for rural India
- Output format: Strict JSON schema with severity, category, empathetic response
- Context-aware: Considers maternal health, infant care, menstrual health categories

### Telephony Integration

**Provider**: Twilio Voice API

**TwiML Generation** (`server/services/twilioService.ts`):
- Voice: Amazon Polly "Aditi" (Indian English/Hindi)
- Recording: Max 60 seconds, 5-second timeout, no transcription (handled by Whisper)
- Flow control: Conditional TwiML based on severity level

**Webhook Security**: 
- Signature validation middleware (`server/middleware/twilioAuth.ts`)
- Validates `X-Twilio-Signature` header using `TWILIO_AUTH_TOKEN`
- Skipped in development mode for easier testing

**Environment Variables Required**:
- `TWILIO_ACCOUNT_SID`: Account identifier
- `TWILIO_AUTH_TOKEN`: Webhook signature validation
- `TWILIO_PHONE_NUMBER`: Assigned IVR number (optional, for display)

### Real-time Communication

**Technology**: Socket.IO bidirectional WebSockets

**Events**:
- `new-alert`: Emitted when severity ≥ 4 call creates alert
- Client auto-reconnects on disconnect
- Dashboard subscribes on mount, unsubscribes on unmount

**Use Case**: Instant dashboard updates when emergency call comes in, enabling ASHA workers to respond within seconds

## External Dependencies

### Third-Party APIs

**OpenAI** (Required for production):
- Whisper API: Speech-to-text transcription
- GPT API: Health analysis and triage
- Authentication: API key via `OPENAI_API_KEY` environment variable

**Twilio** (Required for production):
- Voice API: Phone call handling and TwiML
- Recording API: Audio storage and retrieval
- Authentication: Account SID and Auth Token

### Database

**PostgreSQL** (via Neon or similar serverless provider):
- Connection: `DATABASE_URL` environment variable
- Required format: PostgreSQL connection string
- Note: Application architecture supports Drizzle with any SQL database, not strictly limited to Postgres

### UI Component Library

**Shadcn/ui**: Unstyled, accessible component primitives
- Based on Radix UI (headless components)
- Customized via Tailwind CSS
- Config: `components.json` defines path aliases and styling preferences

### Build & Development Tools

**Vite**: Frontend build tool and dev server
- HMR (Hot Module Replacement) for fast development
- TypeScript compilation
- Asset optimization

**Esbuild**: Backend bundling for production
- Bundles Express server into single file
- Maintains ES module format
- External dependencies (node_modules) not bundled

**TypeScript**: Type safety across full stack
- Shared types in `shared/schema.ts`
- Path aliases: `@/` (client), `@shared/` (shared), `@assets/` (assets)

### Testing Utilities

**Development Scripts**:
- `test-ai-pipeline.js`: Validates OpenAI integration
- `test-database.js`: Checks call/alert storage
- `test-emergency.js`: Simulates break-glass flow
- `debug-ai.js`: Inspects AI pipeline with mock data

These scripts test the system without needing actual phone calls.