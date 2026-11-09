import { auth } from "~/lib/firebase";
import { apiBaseUrl, requestTimeoutMs } from "~/lib/firebase-config";
import type { PickedPhoto } from "~/lib/types";

let activeProfileId: number | null = null;

/** Set the active profile for all wardrobe/item requests. */
export function setApiProfileId(profileId: number | null) {
  activeProfileId = profileId;
}

/** Thrown when the backend responds with a non-2xx status or the request cannot complete. */
export class ApiException extends Error {
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ApiException";
    this.statusCode = statusCode;
  }

  get isNetworkError(): boolean {
    return this.statusCode === undefined;
  }
}

function decode(body: string): unknown {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function errorMessage(decoded: unknown): string | null {
  if (decoded && typeof decoded === "object") {
    const record = decoded as Record<string, unknown>;
    const error = record.error;
    if (typeof error === "string" && error) return error;
    if (Array.isArray(error)) {
      const parts = error
        .map((entry) =>
          entry && typeof entry === "object"
            ? String((entry as Record<string, unknown>).message ?? "")
            : "",
        )
        .filter(Boolean);
      if (parts.length > 0) return parts.join(" ");
    }
    if (typeof record.message === "string" && record.message) {
      return record.message;
    }
  }
  if (typeof decoded === "string" && decoded && decoded.length < 300) {
    return decoded;
  }
  return null;
}

/**
 * Thin wrapper over `fetch` that understands the backend's `{ "data": ... }`
 * envelope and attaches the current Firebase ID token to every request.
 */
class ApiClient {
  constructor(private readonly baseUrl: string = apiBaseUrl) {}

  private async headers(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (activeProfileId) {
      headers["X-Profile-Id"] = String(activeProfileId);
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      // Requests without a token let the backend answer 401, which is mapped
      // to the friendly "session expired" message below.
    }

    return headers;
  }

  private uri(path: string): string {
    return `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  }

  private async send<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    timeoutMs: number = requestTimeoutMs,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(this.uri(path), {
        method,
        headers: await this.headers(),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      const text = await response.text();
      const decoded = decode(text);

      if (response.status === 401) {
        throw new ApiException(
          "Your session has expired. Please sign in again.",
          401,
        );
      }

      if (!response.ok) {
        throw new ApiException(
          errorMessage(decoded) ??
            `Request failed with status ${response.status}.`,
          response.status,
        );
      }

      if (
        decoded &&
        typeof decoded === "object" &&
        "data" in (decoded as Record<string, unknown>)
      ) {
        return (decoded as Record<string, unknown>).data as T;
      }

      return decoded as T;
    } catch (error) {
      if (error instanceof ApiException) throw error;
      if ((error as { name?: string })?.name === "AbortError") {
        throw new ApiException("The request timed out.");
      }
      throw new ApiException(
        "Could not reach the server. Check your connection.",
      );
    } finally {
      clearTimeout(timer);
    }
  }

  get<T>(path: string): Promise<T> {
    return this.send<T>("GET", path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.send<T>("POST", path, body ?? {});
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.send<T>("PATCH", path, body ?? {});
  }

  delete<T = void>(path: string): Promise<T> {
    return this.send<T>("DELETE", path);
  }

  /**
   * Uploads a picked photo through the authenticated API, which writes it to
   * Google Cloud Storage and returns the signed URL to store as `photoUri`.
   */
  async uploadPhoto(photo: PickedPhoto): Promise<string> {
    if (!auth.currentUser) {
      throw new ApiException("Sign in again to upload photos.");
    }

    // ImagePicker returns raw base64, but data URIs are accepted defensively.
    let base64 = photo.base64;
    if (!base64 && photo.uri.startsWith("data:")) {
      base64 = photo.uri.split(",")[1] ?? null;
    }
    base64 = base64?.includes(",") ? base64.split(",").pop()! : base64;
    if (!base64) {
      throw new ApiException("Could not read the selected photo.");
    }

    const contentType = (photo.mimeType ?? "").startsWith("image/")
      ? photo.mimeType!
      : "image/jpeg";

    try {
      const uploaded = await this.send<{ photoUri?: string }>(
        "POST",
        "/photos",
        { base64, contentType },
        60_000,
      );
      if (!uploaded?.photoUri) {
        throw new ApiException("Could not upload the photo.");
      }
      return uploaded.photoUri;
    } catch (error) {
      if (error instanceof ApiException) throw error;
      throw new ApiException(
        (error as Error)?.message || "Could not upload the photo.",
      );
    }
  }
}

export const api = new ApiClient();
