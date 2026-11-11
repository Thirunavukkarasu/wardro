import { agentBaseUrl } from "~/lib/firebase-config";
import { auth } from "~/lib/firebase";

/**
 * FastAPI agent client.
 *
 * Deployed requests carry a Firebase ID token in the Authorization header;
 * development can also send identity in the body. The same token is forwarded
 * to the read-only wardrobe backend.
 */
// Vision requests can take longer than text on a cloud Ollama model.
const AGENT_TIMEOUT_MS = 300_000;

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
  imageBase64?: string;
  imageMediaType?: string;
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
  imageBase64,
  imageMediaType,
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
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
    if (firebaseToken) {
      headers.Authorization = `Bearer ${firebaseToken}`;
    }

    const response = await fetch(endpoint(), {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: message.trim(),
        thread_id: threadId,
        user_id: userId,
        profile_id: profileId,
        ...(firebaseToken ? { firebase_token: firebaseToken } : {}),
        ...(imageBase64
          ? {
              image_base64: imageBase64,
              image_media_type: imageMediaType ?? "image/jpeg",
            }
          : {}),
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
        "The AI service took too long to answer. Try again.",
      );
    }
    throw new AgentException(
      "Could not reach the AI service. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
