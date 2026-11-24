/**
 * API client stub.
 *
 * TODO (real backend): point EXPO_PUBLIC_API_URL at the Node.js + MongoDB
 * backend and replace the mock services in src/services with real calls
 * through this client. No backend exists yet — everything runs on mock data.
 */

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`);
  return (await res.json()) as T;
}
