import { normalizeApiBaseUrl } from "./config";
import type {
  ApiHealth,
  ChatRequestOptions,
  ChatResponse,
  OllamaHealth,
} from "./types";

const CHAT_TIMEOUT_MS = 150_000;
const HEALTH_TIMEOUT_MS = 6_000;

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string | null;
  readonly threadId: string | null;

  constructor(
    message: string,
    status: number,
    detail: string | null = null,
    threadId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
    this.threadId = threadId;
  }
}

/** Send one chat turn to the FastAPI agent service. */
export async function sendChat(
  options: ChatRequestOptions,
): Promise<ChatResponse> {
  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort();
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, CHAT_TIMEOUT_MS);

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", onAbort, { once: true });
    }
  }

  const body: Record<string, unknown> = {
    message: options.message.trim(),
    thread_id: options.threadId,
  };
  if (options.userId.trim()) {
    body.user_id = options.userId.trim();
  }
  if (options.householdId.trim()) {
    body.household_id = options.householdId.trim();
  }
  if (options.profileId.trim()) {
    body.profile_id = options.profileId.trim();
  }

  let response: Response;
  try {
    response = await fetch(endpoint(options.apiBaseUrl, "/api/v1/chat"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) {
      throw new ApiError(
        "The request timed out. Check that Ollama is running and responsive.",
        0,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
  }

  const payload = await readPayload(response);
  if (!response.ok) {
    throw toApiError(response.status, payload);
  }

  if (
    !isRecord(payload) ||
    typeof payload.thread_id !== "string" ||
    typeof payload.message !== "string"
  ) {
    throw new ApiError("The API returned an unexpected response.", response.status);
  }

  return {
    success: payload.success !== false,
    thread_id: payload.thread_id,
    intent: typeof payload.intent === "string" ? payload.intent : "unknown",
    agent: typeof payload.agent === "string" ? payload.agent : "unknown",
    message: payload.message,
    metadata: isRecord(payload.metadata) ? payload.metadata : {},
  };
}

/** Check the FastAPI application itself (not Ollama). */
export async function fetchApiHealth(baseUrl: string): Promise<ApiHealth> {
  const response = await fetchWithTimeout(
    endpoint(baseUrl, "/health"),
    { headers: { Accept: "application/json" } },
    HEALTH_TIMEOUT_MS,
  );
  const payload = await readPayload(response);
  if (!response.ok) {
    throw toApiError(response.status, payload);
  }
  if (!isRecord(payload) || typeof payload.status !== "string") {
    throw new ApiError("The health endpoint returned an unexpected response.", response.status);
  }

  return {
    status: payload.status,
    service: typeof payload.service === "string" ? payload.service : "wardro-ai",
    version: typeof payload.version === "string" ? payload.version : "unknown",
    environment:
      typeof payload.environment === "string" ? payload.environment : "unknown",
  };
}

/** Check Ollama and configured model availability. A 503 still contains health data. */
export async function fetchOllamaHealth(baseUrl: string): Promise<OllamaHealth> {
  const response = await fetchWithTimeout(
    endpoint(baseUrl, "/health/ollama"),
    { headers: { Accept: "application/json" } },
    HEALTH_TIMEOUT_MS,
  );
  const payload = await readPayload(response);
  if (!response.ok && response.status !== 503) {
    throw toApiError(response.status, payload);
  }
  if (!isRecord(payload) || typeof payload.status !== "string") {
    throw new ApiError(
      "The Ollama health endpoint returned an unexpected response.",
      response.status,
    );
  }

  const status =
    payload.status === "ok" || payload.status === "degraded" || payload.status === "unavailable"
      ? payload.status
      : "unavailable";

  return {
    status,
    reachable: payload.reachable === true,
    base_url: typeof payload.base_url === "string" ? payload.base_url : "",
    chat_model: typeof payload.chat_model === "string" ? payload.chat_model : "",
    vision_model: typeof payload.vision_model === "string" ? payload.vision_model : "",
    chat_model_available:
      typeof payload.chat_model_available === "boolean"
        ? payload.chat_model_available
        : null,
    vision_model_available:
      typeof payload.vision_model_available === "boolean"
        ? payload.vision_model_available
        : null,
    installed_models: Array.isArray(payload.installed_models)
      ? payload.installed_models.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
    detail: typeof payload.detail === "string" ? payload.detail : null,
  };
}

function endpoint(baseUrl: string, path: string): string {
  const base = normalizeApiBaseUrl(baseUrl);
  if (base.endsWith("/api/v1") && path.startsWith("/api/v1/")) {
    return `${base}${path.slice("/api/v1".length)}`;
  }
  return `${base}${path}`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `The service did not respond within ${Math.round(timeoutMs / 1000)} seconds.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toApiError(status: number, payload: unknown): ApiError {
  if (isRecord(payload)) {
    const error = typeof payload.error === "string" ? payload.error : null;
    const detail = formatDetail(payload.detail);
    const threadId = typeof payload.thread_id === "string" ? payload.thread_id : null;
    const message =
      error && detail && detail !== error
        ? `${error}: ${detail}`
        : error || detail || `Request failed (${status})`;
    return new ApiError(message, status, detail, threadId);
  }

  if (typeof payload === "string" && payload.trim()) {
    return new ApiError(payload, status);
  }
  return new ApiError(`Request failed (${status})`, status);
}

function formatDetail(detail: unknown): string | null {
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (!isRecord(item)) {
        return String(item);
      }
      const location = Array.isArray(item.loc)
        ? item.loc.filter((part) => part !== "body").join(".")
        : "";
      const message = typeof item.msg === "string" ? item.msg : JSON.stringify(item);
      return location ? `${location}: ${message}` : message;
    });
    return parts.length ? parts.join("; ") : null;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
