import { GraphQLClient } from "graphql-request";
import { vendureApi, CHANNEL_TOKEN } from "../../config";

const AUTH_TOKEN_KEY = "vendure-auth-token";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Creates a GraphQLClient that persists the Vendure auth token
 * in localStorage, so sessions survive cross-origin cookie restrictions.
 */
export function vendureClient(locale: string): GraphQLClient {
  return new GraphQLClient(vendureApi(locale), {
    fetch: async (url, options) => {
      const token = getAuthToken();

      options = { ...options, cache: 'no-store'};

      if (token || CHANNEL_TOKEN) {
        const headers = new Headers(
          options?.headers as HeadersInit | undefined,
        );
        if (CHANNEL_TOKEN) {
          headers.set("vendure-token", CHANNEL_TOKEN);
        }
        if (token) {
          headers.set("authorization", `Bearer ${token}`);
        }
        options = { ...options, headers };
      }
      const response = await fetch(url, options);
      const newToken = response.headers.get("vendure-auth-token");
      if (newToken) {
        setAuthToken(newToken);
      }
      return response;
    },
  });
}
