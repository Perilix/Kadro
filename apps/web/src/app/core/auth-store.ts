import { Injectable, inject, signal } from '@angular/core';
import type { AthleteSummary, AuthSession, Login, Me, RegisterCoach, TeamSummary, User } from '@kadro/shared';
import { ApiClient } from './api-client';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(ApiClient);
  private loaded = false;

  readonly user = signal<User | null>(null);
  readonly team = signal<TeamSummary | null>(null);
  readonly athlete = signal<AthleteSummary | null>(null);

  async ensureLoaded(): Promise<boolean> {
    if (this.loaded) return this.user() != null;
    this.loaded = true;
    if (!this.api.hasSession) return false;
    try {
      const me = await this.api.get<Me>('/auth/me');
      this.user.set(me.user);
      this.team.set(me.team);
      this.athlete.set(me.athlete);
      return true;
    } catch {
      this.api.clearTokens();
      return false;
    }
  }

  async login(credentials: Login): Promise<void> {
    const session = await this.api.post<AuthSession>('/auth/login', credentials);
    await this.onSession(session);
  }

  async register(dto: RegisterCoach): Promise<void> {
    const session = await this.api.post<AuthSession>('/auth/register-coach', dto);
    await this.onSession(session);
  }

  async logout(): Promise<void> {
    await this.api.post('/auth/logout').catch(() => undefined);
    this.api.clearTokens();
    this.user.set(null);
    this.team.set(null);
    this.athlete.set(null);
    this.loaded = false;
  }

  private async onSession(session: AuthSession): Promise<void> {
    this.api.setTokens(session);
    const me = await this.api.get<Me>('/auth/me');
    this.user.set(me.user);
    this.team.set(me.team);
    this.athlete.set(me.athlete);
    this.loaded = true;
  }
}
