import { agentBaseUrl } from "~/lib/firebase-config";
import { auth } from "~/lib/firebase";

/**
 * Local FastAPI agent client.
 *
 * This is the development integration: the agent service is running in
 * APP_ENV=development and accepts the user/profile ids in the body. Production
 * traffic will go through the Bun `/api/ai/*` proxy with Firebase auth and a
 * short-lived internal JWT.
 */
const AGENT_TIMEOUT_MS = 150_000;

export class AgentException extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "AgentException";
    this.statusCode = statusCode;
  }

  get isNetworkError(): boolean {
    return this.statusCode === undefined;
  }
}

export interface AgentReply {
  threadId: string;
  intent: string;
  agent: string;
  message: string;
  metadata: Record<string, unknown>;
}

interface SendAgentMessageInput {
  message: string;
  threadId: string;
  userId: string;
  profileId: string;
  signal?: AbortSignal;
}

function endpoint(): string {
  const base = agentBaseUrl.replace(/\/+$/, "");
  return base.endsWith("/api/v1")
    ? `${base}/chat`
    : `${base}/api/v1/chat`;
}

function errorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const error = typeof record.error === "string" ? record.error : "";
  const detail = typeof record.detail === "string" ? record.detail : "";
  if (error && detail && detail !== error) return `${error}: ${detail}`;
  return error || detail || null;
}

/** Send one turn to the local agent service. */
export async function sendAgentMessage({
  message,
  threadId,
  userId,
  profileId,
  signal,
}: SendAgentMessageInput): Promise<AgentReply> {
  const controller = new AbortController();
  let timedOut = false;

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", onAbort, { once: true });
  }

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, AGENT_TIMEOUT_MS);

  let firebaseToken: string | undefined;
  try {
    firebaseToken = await auth.currentUser?.getIdToken();
  } catch {
    // The agent will return an illustrative answer if it cannot read inventory.
  }

  try {
    const response = await fetch(endpoint(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message.trim(),
        thread_id: threadId,
        user_id: userId,
        profile_id: profileId,
        ...(firebaseToken ? { firebase_token: firebaseToken } : {}),
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    let payload: unknown = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    if (!response.ok) {
      throw new AgentException(
        errorMessage(payload) ?? `The agent failed (${response.status}).`,
        response.status,
      );
    }

    if (
      !payload ||
      typeof payload !== "object" ||
      typeof (payload as Record<string, unknown>).message !== "string"
    ) {
      throw new AgentException("The agent returned an unexpected response.");
    }

    const record = payload as Record<string, unknown>;
    return {
      threadId:
        typeof record.thread_id === "string" ? record.thread_id : threadId,
      intent: typeof record.intent === "string" ? record.intent : "unknown",
      agent: typeof record.agent === "string" ? record.agent : "unknown",
      message: record.message as string,
      metadata:
        record.metadata && typeof record.metadata === "object"
          ? (record.metadata as Record<string, unknown>)
          : {},
    };
  } catch (error) {
    if (error instanceof AgentException) throw error;
    if (timedOut || (error as { name?: string })?.name === "AbortError") {
      throw new AgentException(
        "The agent took too long to answer. Check that Ollama is running.",
      );
    }
    throw new AgentException(
      `Could not reach the agent at ${agentBaseUrl}. Start wardro-agent and try again.`,
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
