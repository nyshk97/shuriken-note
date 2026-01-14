// Token management
// Access token: stored in memory (XSS protection)
// Refresh token: stored in localStorage (persist across page reloads)

const REFRESH_TOKEN_KEY = "shuriken_refresh_token";

let accessToken: string | null = null;

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
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  clearTokens: () => {
    accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  },

  hasRefreshToken: () => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(REFRESH_TOKEN_KEY);
  },
};
