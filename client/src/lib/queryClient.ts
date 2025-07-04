import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Secure auth token storage using httpOnly cookies
// Note: Tokens are now stored server-side in sessions for security
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  // Remove localStorage usage for security - tokens are now in httpOnly cookies
  if (!token) {
    // Clear any legacy localStorage tokens
    localStorage.removeItem('authToken');
  }
}

export function getAuthToken(): string | null {
  // First check if we have token in memory from login response
  if (authToken) {
    return authToken;
  }
  
  // Remove insecure localStorage fallback
  // Tokens are now managed via secure httpOnly cookies
  return null;
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    mode: 'cors'
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    };

    const res = await fetch(queryKey[0] as string, {
      method: 'GET',
      headers,
      credentials: "include",
      mode: 'cors'
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Initialize auth token from localStorage on app start
getAuthToken();

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
