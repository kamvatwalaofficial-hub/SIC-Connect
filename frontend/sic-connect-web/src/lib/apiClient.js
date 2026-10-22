import axios from 'axios';

const TOKEN_KEY = 'sic_connect_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/**
 * Single Axios instance for the whole app.
 * - request interceptor attaches the JWT bearer token
 * - response interceptor normalises errors and handles 401 by clearing the token
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Callback the AuthContext registers so a 401 can force a logout in React state.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null);
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(normaliseError(error));
  },
);

/** Turn an Axios error into a plain Error with a friendly message. */
function normaliseError(error) {
  const data = error.response?.data;
  const message =
    data?.error ||
    data?.title ||
    (typeof data === 'string' ? data : null) ||
    error.message ||
    'Something went wrong.';
  const normalised = new Error(message);
  normalised.status = error.response?.status;
  normalised.details = data?.details ?? data?.errors ?? null;
  // Account-approval status (Pending/Rejected/InfoRequested) when the API reports one.
  normalised.accountStatus = data?.status ?? null;
  return normalised;
}
