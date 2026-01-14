// Token management
// Access token: stored in memory (XSS protection)
// Refresh token: stored in localStorage + cookie (persist across page reloads, accessible by middleware)

const REFRESH_TOKEN_KEY = "shuriken_refresh_token";
const REFRESH_TOKEN_COOKIE = "has_refresh_token";

let accessToken: string | null = null;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export const tokenManager = {
  getAccessToken: () => accessToken,

  setAccessToken: (token: string | null) => {
    accessToken = token;
  },

  getRefreshToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken: (token: string | null) => {
    if (typeof window === "undefined") return;
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
      // Set a flag cookie for middleware to check (not the actual token for security)
      setCookie(REFRESH_TOKEN_COOKIE, "1", 30);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      deleteCookie(REFRESH_TOKEN_COOKIE);
    }
  },

  clearTokens: () => {
    accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      deleteCookie(REFRESH_TOKEN_COOKIE);
    }
  },

  hasRefreshToken: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(REFRESH_TOKEN_KEY);
  },
};
