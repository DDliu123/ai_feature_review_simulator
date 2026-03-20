# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Feature Review Simulator (AI 需求评审模拟器) - A full-stack application that simulates multi-role PRD reviews using AI. It allows users to upload PRD documents and get feedback from simulated roles (Product Manager, Software Engineer, Test Engineer, Designer).

## Architecture

### Backend (backend/)
- **Framework**: Fastify + TypeScript
- **Database**: PostgreSQL (configured with SQLite in development)
- **ORM**: Prisma
- **AI Engine**: Kimi API (Claude API configured)
- **File Storage**: Cloudflare R2 (S3-compatible)
- **Authentication**: JWT with refresh tokens
- **SSE**: Real-time streaming for review sessions

### Frontend (feature-review-simulator/)
- **Framework**: React 18 + Vite + TypeScript
- **Routing**: React Router 6
- **Styling**: Tailwind CSS
- **State Management**: Context API (AuthContext)
- **HTTP Client**: Axios with automatic token refresh
- **Icons**: Lucide React

## Development Commands

### Backend
```bash
cd backend
npm install                    # Install dependencies
npx prisma migrate dev         # Run database migrations
npm run dev                    # Start development server (port 3001)
```

### Frontend
```bash
cd feature-review-simulator
npm install                    # Install dependencies
npm run dev                    # Start development server (port 5173)
npm run build                  # Build for production
npm run lint                   # Run ESLint
```

## Key Architecture Patterns

### Backend Structure
- **Controllers** (`backend/src/controllers/`): HTTP request handlers
- **Services** (`backend/src/services/`): Business logic layer
  - `ai.service.ts`: AI model integration (Kimi/Claude)
  - `auth.service.ts`: Authentication logic
  - `document.service.ts`: Document CRUD operations
  - `session.service.ts`: Review session management
  - `report.service.ts`: PDF report generation
- **Routes** (`backend/src/routes/`): API endpoint definitions
- **Middleware** (`backend/src/middleware/`): Auth, error handling
- **Schemas** (`backend/src/schemas/`): Zod validation schemas

### Frontend Structure
- **Pages** (`feature-review-simulator/src/pages/`): Route components
  - `DashboardPage.tsx`: Document upload and management
  - `ReviewPage.tsx`: Interactive review session with SSE
- **Components** (`feature-review-simulator/src/components/`): Reusable UI components
- **Contexts** (`feature-review-simulator/src/contexts/`): React contexts (AuthContext)
- **Hooks** (`feature-review-simulator/src/hooks/`): Custom React hooks
- **Lib** (`feature-review-simulator/src/lib/`): Utilities and API client

## API Integration

### Authentication Flow
1. User registers at `/api/auth/register`
2. Verification code sent (currently logs to console in dev)
3. User verifies at `/api/auth/verify`
4. Login returns access token and refresh token
5. Axios interceptor automatically refreshes tokens

### Review Session Flow
1. Upload document via multipart form to `/api/documents`
2. Document parsed (Word/PDF) and stored in R2
3. Start review session at `/api/review-sessions` with selected roles
4. Connect to SSE endpoint `/api/review-sessions/:id/stream`
5. AI generates questions for each role in real-time
6. User can respond to questions, AI adjusts based on responses
7. Generate PDF report when all roles pass

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://..."  # Or SQLite file path
JWT_SECRET="random-string"
R2_ACCESS_KEY_ID="cloudflare-r2-key"
R2_SECRET_ACCESS_KEY="cloudflare-r2-secret"
R2_ENDPOINT="https://...r2.cloudflarestorage.com"
R2_BUCKET_NAME="bucket-name"
ANTHROPIC_API_KEY="claude-api-key"
```

## Important Implementation Details

1. **File Upload**: Supports .docx, .doc, .pdf files up to 10MB
2. **SSE Implementation**: Custom EventSource handling for real-time updates
3. **Token Refresh**: Automatic refresh using axios interceptors
4. **Role Simulation**: Four roles - PM, Developer, Tester, Designer
5. **Report Generation**: PDF reports include full conversation history
6. **Rate Limiting**: Implemented on backend using @fastify/rate-limit