import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { AuthSession } from '@kadro/shared';

const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ && devHost ? `http://${devHost}:3000/v1` : 'https://kadro-api.onrender.com/v1');

const ACCESS_KEY = 'kadro.access';
const REFRESH_KEY = 'kadro.refresh';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private loaded = false;

  async loadTokens(): Promise<boolean> {
    if (!this.loaded) {
      const [access, refresh] = await Promise.all([
        AsyncStorage.getItem(ACCESS_KEY),
        AsyncStorage.getItem(REFRESH_KEY),
      ]);
      this.accessToken = access;
      this.refreshToken = refresh;
      this.loaded = true;
    }
    return this.refreshToken != null;
  }

  async setTokens(session: Pick<AuthSession, 'accessToken' | 'refreshToken'>): Promise<void> {
    this.accessToken = session.accessToken;
    this.refreshToken = session.refreshToken;
    this.loaded = true;
    await Promise.all([
      AsyncStorage.setItem(ACCESS_KEY, session.accessToken),
      AsyncStorage.setItem(REFRESH_KEY, session.refreshToken),
    ]);
  }

  async clearTokens(): Promise<void> {
    this.accessToken = null;
    this.refreshToken = null;
    await Promise.all([AsyncStorage.removeItem(ACCESS_KEY), AsyncStorage.removeItem(REFRESH_KEY)]);
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
    await this.loadTokens();
    const res = await fetch(`${API_URL}${path}`, {
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
      if (await this.tryRefresh()) return this.request<T>(method, path, body, true);
    }
    const payload = (await res.json().catch(() => ({}))) as { code?: string };
    throw new ApiError(res.status, payload.code ?? 'unknown_error');
  }

  private async tryRefresh(): Promise<boolean> {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });
    if (!res.ok) {
      await this.clearTokens();
      return false;
    }
    await this.setTokens((await res.json()) as AuthSession);
    return true;
  }
}

export const api = new ApiClient();
