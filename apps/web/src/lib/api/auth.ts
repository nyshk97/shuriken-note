import { tokenManager } from "./token";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
}

export interface LogoutResponse {
  message: string;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Login failed");
  }

  const data: LoginResponse = await response.json();

  // Store tokens
  tokenManager.setAccessToken(data.access_token);
  tokenManager.setRefreshToken(data.refresh_token);

  return data;
}

export async function refresh(): Promise<string | null> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      tokenManager.clearTokens();
      return null;
    }

    const data: RefreshResponse = await response.json();
    tokenManager.setAccessToken(data.access_token);
    return data.access_token;
  } catch {
    tokenManager.clearTokens();
    return null;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = tokenManager.getRefreshToken();

  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Ignore errors - we'll clear tokens anyway
    }
  }

  tokenManager.clearTokens();
}
