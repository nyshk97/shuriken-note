import { tokenManager } from "./token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      code: string;
      message: string;
    }>;
  };
  request_id: string;
}

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public data: ApiError
  ) {
    super(data.error.message);
    this.name = "ApiClientError";
  }
}

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      // Refresh token is invalid or expired
      tokenManager.clearTokens();
      return null;
    }

    const data = await response.json();
    tokenManager.setAccessToken(data.access_token);
    return data.access_token;
  } catch {
    tokenManager.clearTokens();
    return null;
  }
}

async function getValidAccessToken(): Promise<string | null> {
  const currentToken = tokenManager.getAccessToken();
  if (currentToken) return currentToken;

  // No access token, try to refresh
  if (!tokenManager.hasRefreshToken()) return null;

  // Prevent multiple simultaneous refresh requests
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = refreshAccessToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });

  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, skipAuth = false, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  // Add Authorization header if not skipping auth
  if (!skipAuth) {
    const accessToken = await getValidAccessToken();
    if (accessToken) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${accessToken}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 - try to refresh token and retry
  if (response.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry the request with new token
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${newToken}`;
      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json();
        throw new ApiClientError(retryResponse.status, errorData);
      }

      // Handle 204 No Content
      if (retryResponse.status === 204) {
        return undefined as T;
      }

      return retryResponse.json();
    }

    // Refresh failed - redirect to login
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }

    // Still throw the error for proper error handling
    const errorData = await response.json();
    throw new ApiClientError(response.status, errorData);
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new ApiClientError(response.status, errorData);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
