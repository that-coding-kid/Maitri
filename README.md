# Maitri - Rural Health IVR System

## Overview

Maitri is a voice-based Interactive Voice Response (IVR) health monitoring system designed for rural India. The system enables community members to call a toll-free number, describe health concerns in their native language (Hindi), and receive AI-powered health triage and guidance. The application uses voice-to-text transcription, AI-powered severity assessment, and a privacy-first architecture with encrypted phone number storage and "break-glass" emergency protocols for high-severity cases.

The system consists of two main components:
1. **IVR Call System**: Twilio-based telephony that captures caller audio, transcribes it, analyzes health severity, and responds with appropriate guidance
2. **ASHA Dashboard**: Real-time web dashboard for ASHA (Accredited Social Health Activist) workers to monitor emergency alerts and health trends

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, composable UI elements
- **Styling**: Tailwind CSS with Material Design 3 principles for consistent visual hierarchy
- **State Management**: TanStack Query (React Query) for server state synchronization and caching
- **Real-time Updates**: Socket.IO client for live alert notifications from the backend

**Design System**:
- Typography: Roboto (primary interface), Roboto Mono (metrics and data display)
- Color palette: Neutral base with teal/emerald primary accent for health-positive associations
- Layout: 12-column responsive grid system with breakpoints for mobile/tablet/desktop
- Component approach: Pre-built shadcn components provide consistency across the dashboard

**Key Pages**:
- **Login**: Authentication page with hardcoded credentials (temporary: username: ashasharma, password: asha123) featuring the Maitri logo and emerald-themed UI
- **Dashboard**: Protected single-page application displaying real-time call statistics, emergency alert feed, health category breakdowns, and trend charts
- **Alert Management**: Modal-based emergency alert viewing with phone number reveal and resolution tracking

**Authentication & Authorization**:
- **Client-Side Auth**: React Context-based authentication with localStorage session persistence
- **Hardcoded Credentials**: Temporary development setup (ashasharma/asha123) - must be replaced with backend authentication before production
- **Protected Routes**: ProtectedRoute wrapper component redirects unauthenticated users to login page
- **Session Management**: Login state persists across browser refreshes via localStorage
- **Auto-Redirect**: Authenticated users are automatically redirected away from login page to dashboard

**Brand Assets**:
- **Logo**: Maitri logo (maitri-logo.png) displayed in header of all authenticated pages and on login screen
- **Color Scheme**: Emerald green (#059669) primary color representing health and growth

**Architectural Decisions**:
- **Problem**: Need for real-time updates without constant polling
- **Solution**: Socket.IO integration for server-pushed alerts
- **Rationale**: Reduces server load and provides instant notification to ASHA workers when high-severity calls occur

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Design**:
- REST endpoints for dashboard data (`/api/dashboard/stats`, `/api/calls/recent`, `/api/alerts`)
- Twilio webhook handlers for IVR flow (`/ivr/incoming`, `/ivr/process-audio`, `/ivr/break-glass-confirm`)
- WebSocket server (Socket.IO) for real-time alert broadcasting to connected dashboard clients

**IVR Flow Architecture**:
1. **Incoming Call** (`/ivr/incoming`): Returns TwiML greeting in Hindi using Polly.Aditi voice
2. **Audio Recording**: Captures up to 60 seconds of caller describing health concern
3. **AI Processing Pipeline** (`/ivr/process-audio`):
   - Downloads audio from Twilio recording URL
   - Transcribes using OpenAI Whisper API (supports Hindi)
   - Analyzes with GPT/Llama for health triage (severity 1-5, category classification)
   - Extracts empathetic response text for caller
4. **Response Routing**:
   - **Low severity (1-3)**: Speak AI-generated advice and end call
   - **High severity (4-5)**: Trigger "Break-Glass" protocol to capture village location
5. **Break-Glass Protocol** (`/ivr/break-glass-confirm`): 
   - Requests village name via audio recording
   - Decrypts and reveals phone number to ASHA workers
   - Creates emergency alert with full caller information

**Privacy-First Architecture**:
- **Problem**: Need to protect caller privacy while enabling emergency response
- **Solution**: Two-tier storage system
  - Default: Store only SHA-256 hash of phone number
  - Emergency: Store AES-256-GCM encrypted phone number, only decryptable when severity >= 4
- **Rationale**: Balances privacy (anonymous call logs) with emergency needs (ASHA can contact critical cases)
- **Implementation**: 
  - Encryption key stored in environment variable (`ENCRYPTION_KEY`)
  - Stable salt for hashing (`PHONE_HASH_SALT`) ensures consistent caller identification across calls
  - Break-glass protocol explicitly captures village name only when emergency threshold met

**AI Service Layer** (`server/services/aiService.ts`):
- **Problem**: Need reliable health triage from voice recordings in Hindi
- **Solution**: Two-step AI pipeline
  1. OpenAI Whisper for multilingual speech-to-text
  2. GPT-4 or Groq Llama for structured health analysis
- **Response Format**: JSON with severity (1-5), category (Maternal/Infant/Menstrual/General), empathetic advice text
- **Fallback**: Mock AI responses when OpenAI API key not configured (for development/testing)

**Data Storage**:
- **Development**: In-memory storage using Map structures for rapid prototyping
- **Production**: PostgreSQL via Drizzle ORM with Neon serverless database
- **Migration Path**: Abstract storage interface (`IStorage`) allows switching between implementations without changing business logic

### Data Schema

**CallLogs Table**:
- `id`: UUID primary key
- `callerHash`: SHA-256 hash of phone number (always stored)
- `encryptedPhone`: AES-256-GCM encrypted phone (only for severity >= 4)
- `transcription`: Whisper API output text
- `aiResponse`: GPT-generated empathetic advice
- `severityLevel`: Integer 1-5 scale
- `category`: Enum (Maternal, Infant, Menstrual, General)
- `isBreakGlass`: Boolean flag for emergency cases
- `villageLocation`: Village name (captured only in break-glass)
- `createdAt`: Timestamp

**Alerts Table**:
- `id`: UUID primary key
- `callId`: Foreign key to CallLogs
- `ashaWorkerId`: Optional reference to assigned ASHA worker
- `status`: Enum (PENDING, RESOLVED)
- `emergencyReason`: AI-generated explanation of emergency severity
- `createdAt`: Timestamp
- `resolvedAt`: Nullable timestamp

**Architectural Decision - Dual Storage**:
- **Problem**: PostgreSQL not initially available in development
- **Solution**: Interface-based storage abstraction with MemStorage and DrizzleStorage implementations
- **Pros**: Enables parallel development of frontend/backend before database provisioning
- **Cons**: Requires maintaining two implementations temporarily
- **Migration**: Simple swap via dependency injection when DATABASE_URL environment variable becomes available

## External Dependencies

### Third-Party Services

**Twilio** (Telephony/IVR):
- Service: Voice calling and TwiML generation
- Integration: Webhook endpoints receive call events
- Configuration: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` environment variables
- Voice: Polly.Aditi (Amazon Polly) for Hindi text-to-speech
- Purpose: Handles all telephone infrastructure for incoming calls, audio recording, and playback

**OpenAI** (AI/ML):
- Whisper API: Speech-To-Text transcription with Hindi language support
- GPT-4/GPT-3.5: Health concern analysis and triage
- Configuration: `OPENAI_API_KEY` environment variable
- Timeout: Extended to 60 seconds for audio upload operations
- Fallback: Mock AI responses when API key not configured

**Groq** (Alternative AI):
- Service: Llama 3 inference for health analysis (alternative to OpenAI)
- Configuration: `GROQ_API_KEY` environment variable
- Purpose: Cost-effective alternative for GPT-based analysis

**Neon Database** (PostgreSQL):
- Service: Serverless PostgreSQL hosting
- Driver: `@neondatabase/serverless` with Drizzle ORM
- Configuration: `DATABASE_URL` environment variable
- Migration: Drizzle Kit for schema management (`npm run db:push`)

### Key NPM Packages

**Backend**:
- `express`: HTTP server framework
- `socket.io`: WebSocket server for real-time alerts
- `twilio`: Official Twilio SDK for webhook validation
- `drizzle-orm`: Type-safe SQL query builder
- `openai`: Official OpenAI API client
- `postgres`: PostgreSQL client for Drizzle

**Frontend**:
- `@tanstack/react-query`: Server state management
- `socket.io-client`: WebSocket client
- `recharts`: Chart rendering for trends
- `wouter`: Lightweight routing
- `@radix-ui/*`: Headless UI primitives (19+ components)
- `tailwindcss`: Utility-first CSS framework

**Build Tools**:
- `vite`: Frontend build tool and dev server
- `tsx`: TypeScript execution for Node.js
- `esbuild`: Production backend bundling

### Environment Variables Required

**Production**:
- `DATABASE_URL`: PostgreSQL connection string (Neon)
- `TWILIO_ACCOUNT_SID`: Twilio account identifier
- `TWILIO_AUTH_TOKEN`: Twilio authentication token
- `OPENAI_API_KEY`: OpenAI API key for Whisper + GPT
- `ENCRYPTION_KEY`: 32-byte hex string for AES-256-GCM phone encryption (generate with `openssl rand -hex 32`)
- `PHONE_HASH_SALT`: Stable salt for SHA-256 phone hashing

**Optional**:
- `GROQ_API_KEY`: Groq API key (alternative to OpenAI)
- `NODE_ENV`: Set to 'production' for production builds
