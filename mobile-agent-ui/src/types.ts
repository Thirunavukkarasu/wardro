export type ChatRole = "user" | "assistant" | "system";

export type ChatMessageVariant = "normal" | "error" | "muted";

export interface ChatMeta {
  intent?: string;
  agent?: string;
  model?: string;
  threadId?: string;
  persistence?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  variant?: ChatMessageVariant;
  meta?: ChatMeta;
  retryable?: boolean;
}

export interface ChatResponse {
  success: boolean;
  thread_id: string;
  intent: string;
  agent: string;
  message: string;
  metadata: Record<string, unknown>;
}

export interface ChatRequestOptions {
  apiBaseUrl: string;
  message: string;
  threadId: string;
  userId: string;
  householdId: string;
  profileId: string;
  signal?: AbortSignal;
}

export interface ApiHealth {
  status: string;
  service: string;
  version: string;
  environment: string;
}

export interface OllamaHealth {
  status: "ok" | "degraded" | "unavailable";
  reachable: boolean;
  base_url: string;
  chat_model: string;
  vision_model: string;
  chat_model_available?: boolean | null;
  vision_model_available?: boolean | null;
  installed_models?: string[];
  detail?: string | null;
}
