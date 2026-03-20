// Core types for the Feature Review Simulator

// Role types based on the 4 personas
export type Role = 'user' | 'dev' | 'boss' | 'legal';

// Role status in the review process
export type RoleStatus = 'challenging' | 'partial' | 'approved' | 'generating' | 'error';

// Overall review session status
export type ReviewStatus = 'pending' | 'reviewing' | 'all_passed' | 'partial' | 'failed';

// Question structure from each role
export interface Question {
  id: string;
  text: string;
  timestamp: number;
}

// Message in the conversation thread
export interface Message {
  role: 'system' | 'assistant' | 'user';
  content: string;
  timestamp: number;
}

// Individual role thread
export interface RoleThread {
  role: Role;
  status: RoleStatus;
  questions: Question[];
  messages: Message[];
  roundCount: number;
  error?: string;
}

// Document information
export interface Document {
  id: string;
  filename: string;
  parsedText: string;
  uploadTime: number;
  status: ReviewStatus;
}

// Review session
export interface ReviewSession {
  id: string;
  documentId: string;
  document: Document;
  threads: RoleThread[];
  overallStatus: ReviewStatus;
  createdAt: number;
  completedAt?: number;
}

// Role configuration
export interface RoleConfig {
  key: Role;
  name: string;
  emoji: string;
  description: string;
  color: string;
  focusAreas: string[];
  systemPrompt: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// SSE event types
export interface SSEEvent {
  type: 'role_start' | 'content_chunk' | 'role_done' | 'session_done' | 'error';
  role?: Role;
  status?: RoleStatus;
  chunk?: string;
  summary?: string;
  error?: string;
}