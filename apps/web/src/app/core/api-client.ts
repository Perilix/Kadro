import { Injectable } from '@angular/core';
import type { AuthSession } from '@kadro/shared';
import { environment } from '../../environments/environment';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

const ACCESS_KEY = 'kadro.access';
const REFRESH_KEY = 'kadro.refresh';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private accessToken: string | null = localStorage.getItem(ACCESS_KEY);
  private refreshToken: string | null = localStorage.getItem(REFRESH_KEY);

  get hasSession(): boolean {
    return this.refreshToken != null;
  }

  get currentAccessToken(): string | null {
    return this.accessToken;
  }

  setTokens(session: Pick<AuthSession, 'accessToken' | 'refreshToken'>): void {
    this.accessToken = session.accessToken;
    this.refreshToken = session.refreshToken;
    localStorage.setItem(ACCESS_KEY, session.accessToken);
    localStorage.setItem(REFRESH_KEY, session.refreshToken);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  delete(path: string): Promise<void> {
    return this.request<void>('DELETE', path);
  }

  private async request<T>(method: string, path: string, body?: unknown, retried = false): Promise<T> {
    const res = await fetch(`${environment.apiUrl}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return undefined as T;
    if (res.ok) return (await res.json()) as T;

    if (res.status === 401 && !retried && this.refreshToken) {
      const refreshed = await this.tryRefresh();
      if (refreshed) return this.request<T>(method, path, body, true);
    }
    const payload = (await res.json().catch(() => ({}))) as { code?: string };
    throw new ApiError(res.status, payload.code ?? 'unknown_error');
  }

  private async tryRefresh(): Promise<boolean> {
    const res = await fetch(`${environment.apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });
    if (!res.ok) {
      this.clearTokens();
      return false;
    }
    const session = (await res.json()) as AuthSession;
    this.setTokens(session);
    return true;
  }
}
