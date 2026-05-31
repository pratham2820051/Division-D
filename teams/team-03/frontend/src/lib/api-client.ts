import { API_BASE } from "@/lib/constants";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface FetchWithRetryOptions {
  retries?: number;
  retryDelayMs?: number;
  retryOnStatuses?: number[];
}

const DEFAULT_RETRY_STATUSES = [408, 429, 500, 502, 503, 504];

function isRetryableStatus(status: number, retryOn: number[]): boolean {
  return retryOn.includes(status);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const {
    retries = 2,
    retryDelayMs = 800,
    retryOnStatuses = DEFAULT_RETRY_STATUSES,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, init);

      if (response.ok) {
        return response;
      }

      const retryable = isRetryableStatus(response.status, retryOnStatuses);
      if (!retryable || attempt === retries) {
        throw new ApiError(
          `Request failed (${response.status})`,
          response.status,
          retryable,
        );
      }

      await delay(retryDelayMs * (attempt + 1));
    } catch (error) {
      lastError = error;

      if (error instanceof ApiError) {
        if (!error.retryable || attempt === retries) {
          throw error;
        }
        await delay(retryDelayMs * (attempt + 1));
        continue;
      }

      if (attempt === retries) {
        throw error instanceof Error
          ? error
          : new ApiError("Network request failed", 0, true);
      }

      await delay(retryDelayMs * (attempt + 1));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new ApiError("Request failed after retries", 0, true);
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  retryOptions?: FetchWithRetryOptions,
): Promise<T> {
  const response = await fetchWithRetry(
    `${API_BASE}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    },
    retryOptions,
  );

  return response.json() as Promise<T>;
}

export async function apiFetchBlob(
  path: string,
  options?: RequestInit,
  retryOptions?: FetchWithRetryOptions,
): Promise<{ blob: Blob; headers: Headers }> {
  const response = await fetchWithRetry(
    `${API_BASE}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    },
    retryOptions,
  );

  const blob = await response.blob();
  return { blob, headers: response.headers };
}

export interface UploadJsonOptions extends FetchWithRetryOptions {
  timeoutMs?: number;
}

export async function apiUploadJson<T>(
  path: string,
  formData: FormData,
  options?: UploadJsonOptions,
): Promise<T> {
  const { timeoutMs, ...retryOptions } = options ?? {};
  const controller = timeoutMs ? new AbortController() : undefined;
  const timeoutId =
    controller && timeoutMs
      ? setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

  try {
    const response = await fetchWithRetry(
      `${API_BASE}${path}`,
      {
        method: "POST",
        body: formData,
        signal: controller?.signal,
      },
      retryOptions,
    );

    if (!response.ok) {
      const retryable = isRetryableStatus(
        response.status,
        retryOptions?.retryOnStatuses ?? DEFAULT_RETRY_STATUSES,
      );
      throw new ApiError(
        `Upload failed (${response.status})`,
        response.status,
        retryable,
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Upload timed out", 408, true);
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
