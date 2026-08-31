import { Injectable, NotImplementedException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ActivitySport } from '@kadro/shared';
import type { MappedActivity } from './strava.service';

export interface PolarTokens {
  accessToken: string;
  externalUserId: string;
  expiresAt: Date | null;
}

export interface PolarExercise {
  id: string;
  start_time: string;
  start_time_utc_offset?: number;
  duration: string;
  sport?: string;
  detailed_sport_info?: string;
  distance?: number;
  heart_rate?: { average?: number; maximum?: number };
  device?: string;
}

const AUTH_BASE = 'https://flow.polar.com';
const TOKEN_URL = 'https://polarremote.com/v2/oauth2/token';
const API_BASE = 'https://www.polaraccesslink.com/v3';

@Injectable()
export class PolarService {
  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get('POLAR_CLIENT_ID') && this.config.get('POLAR_CLIENT_SECRET'));
  }

  private creds(): { clientId: string; clientSecret: string } {
    if (!this.isConfigured) {
      throw new NotImplementedException({ code: 'connection.provider_not_configured' });
    }
    return {
      clientId: this.config.getOrThrow<string>('POLAR_CLIENT_ID'),
      clientSecret: this.config.getOrThrow<string>('POLAR_CLIENT_SECRET'),
    };
  }

  authorizeUrl(state: string): string {
    const { clientId } = this.creds();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      state,
    });
    return `${AUTH_BASE}/oauth2/authorization?${params}`;
  }

  async exchangeCode(code: string): Promise<PolarTokens> {
    const { clientId, clientSecret } = this.creds();
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json;charset=UTF-8',
      },
      body: new URLSearchParams({ grant_type: 'authorization_code', code }),
    });
    if (!res.ok) throw new ServiceUnavailableException({ code: 'connection.oauth_failed' });
    const data = (await res.json()) as { access_token: string; x_user_id: number; expires_in?: number };
    return {
      accessToken: data.access_token,
      externalUserId: String(data.x_user_id),
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null,
    };
  }

  async registerUser(accessToken: string, memberId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ 'member-id': memberId }),
    });
    if (!res.ok && res.status !== 409) {
      throw new ServiceUnavailableException({ code: 'connection.provider_error' });
    }
  }

  async deauthorize(accessToken: string, externalUserId: string): Promise<void> {
    await fetch(`${API_BASE}/users/${externalUserId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => undefined);
  }

  async fetchExercises(accessToken: string): Promise<PolarExercise[]> {
    const res = await fetch(`${API_BASE}/exercises`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new ServiceUnavailableException({ code: 'connection.provider_error' });
    return (await res.json()) as PolarExercise[];
  }

  async fetchExerciseByUrl(accessToken: string, url: string): Promise<PolarExercise> {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
    if (!res.ok) throw new ServiceUnavailableException({ code: 'connection.provider_error' });
    return (await res.json()) as PolarExercise;
  }

  mapExercise(exercise: PolarExercise): MappedActivity {
    const durationSec = parseIsoDuration(exercise.duration);
    const distanceM = exercise.distance != null && exercise.distance > 0 ? Math.round(exercise.distance) : null;
    return {
      externalId: exercise.id,
      sport: mapSport(exercise.detailed_sport_info ?? exercise.sport ?? ''),
      startedAt: new Date(exercise.start_time),
      timezone: 'Europe/Paris',
      durationSec,
      distanceM,
      elevGainM: null,
      avgPaceSecPerKm: distanceM && durationSec ? Math.round((durationSec / distanceM) * 1000) : null,
      avgHrBpm: exercise.heart_rate?.average ?? null,
      maxHrBpm: exercise.heart_rate?.maximum ?? null,
      avgCadenceSpm: null,
      deviceName: exercise.device ?? null,
    };
  }
}

function mapSport(polarSport: string): ActivitySport {
  const value = polarSport.toUpperCase();
  if (value.includes('TRAIL')) return 'trail';
  if (value.includes('RUN') || value.includes('JOGGING') || value.includes('TREADMILL')) return 'run';
  if (value.includes('CYCLING') || value.includes('BIKING')) return 'bike';
  if (value.includes('STRENGTH') || value.includes('GYM') || value.includes('CIRCUIT')) return 'strength';
  return 'other';
}

function parseIsoDuration(value: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/.exec(value ?? '');
  if (!match) return 0;
  return Math.round(
    Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0),
  );
}
