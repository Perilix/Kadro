import { Injectable, NotImplementedException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ActivitySport } from '@kadro/shared';

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  externalUserId: string;
  scopes: string[];
}

export interface StravaActivity {
  id: number;
  sport_type?: string;
  type?: string;
  start_date: string;
  timezone?: string;
  moving_time: number;
  elapsed_time: number;
  distance: number;
  total_elevation_gain: number | null;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  device_name?: string;
}

export interface MappedActivity {
  externalId: string;
  sport: ActivitySport;
  startedAt: Date;
  timezone: string;
  durationSec: number;
  distanceM: number | null;
  elevGainM: number | null;
  avgPaceSecPerKm: number | null;
  avgHrBpm: number | null;
  maxHrBpm: number | null;
  avgCadenceSpm: number | null;
  deviceName: string | null;
}

const BASE = 'https://www.strava.com';

@Injectable()
export class StravaService {
  constructor(private readonly config: ConfigService) {}

  get isConfigured(): boolean {
    return Boolean(this.config.get('STRAVA_CLIENT_ID') && this.config.get('STRAVA_CLIENT_SECRET'));
  }

  private creds(): { clientId: string; clientSecret: string } {
    if (!this.isConfigured) {
      throw new NotImplementedException({ code: 'connection.provider_not_configured' });
    }
    return {
      clientId: this.config.getOrThrow<string>('STRAVA_CLIENT_ID'),
      clientSecret: this.config.getOrThrow<string>('STRAVA_CLIENT_SECRET'),
    };
  }

  authorizeUrl(state: string): string {
    const { clientId } = this.creds();
    const redirect = `${this.config.getOrThrow<string>('API_PUBLIC_URL')}/v1/connections/strava/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirect,
      response_type: 'code',
      approval_prompt: 'auto',
      scope: 'read,activity:read_all',
      state,
    });
    return `${BASE}/oauth/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<StravaTokens> {
    const { clientId, clientSecret } = this.creds();
    return this.tokenRequest({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    });
  }

  async refresh(refreshToken: string): Promise<StravaTokens> {
    const { clientId, clientSecret } = this.creds();
    return this.tokenRequest({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
  }

  async deauthorize(accessToken: string): Promise<void> {
    await fetch(`${BASE}/oauth/deauthorize`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => undefined);
  }

  async fetchActivities(accessToken: string, afterEpochSec: number): Promise<StravaActivity[]> {
    const res = await fetch(
      `${BASE}/api/v3/athlete/activities?after=${afterEpochSec}&per_page=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) throw new ServiceUnavailableException({ code: 'connection.provider_error' });
    return (await res.json()) as StravaActivity[];
  }

  async fetchActivity(accessToken: string, id: string): Promise<StravaActivity> {
    const res = await fetch(`${BASE}/api/v3/activities/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new ServiceUnavailableException({ code: 'connection.provider_error' });
    return (await res.json()) as StravaActivity;
  }

  mapActivity(activity: StravaActivity): MappedActivity {
    const sport = mapSport(activity.sport_type ?? activity.type ?? '');
    const durationSec = activity.moving_time || activity.elapsed_time;
    const distanceM = activity.distance > 0 ? Math.round(activity.distance) : null;
    return {
      externalId: String(activity.id),
      sport,
      startedAt: new Date(activity.start_date),
      timezone: parseTimezone(activity.timezone),
      durationSec,
      distanceM,
      elevGainM: activity.total_elevation_gain != null ? Math.round(activity.total_elevation_gain) : null,
      avgPaceSecPerKm:
        distanceM && durationSec ? Math.round((durationSec / distanceM) * 1000) : null,
      avgHrBpm: activity.average_heartrate != null ? Math.round(activity.average_heartrate) : null,
      maxHrBpm: activity.max_heartrate != null ? Math.round(activity.max_heartrate) : null,
      avgCadenceSpm:
        activity.average_cadence != null && (sport === 'run' || sport === 'trail')
          ? Math.round(activity.average_cadence * 2)
          : (activity.average_cadence ?? null),
      deviceName: activity.device_name ?? null,
    };
  }

  private async tokenRequest(body: Record<string, string>): Promise<StravaTokens> {
    const res = await fetch(`${BASE}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new ServiceUnavailableException({ code: 'connection.oauth_failed' });
    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      athlete?: { id: number };
      scope?: string;
    };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(data.expires_at * 1000),
      externalUserId: data.athlete ? String(data.athlete.id) : '',
      scopes: data.scope?.split(',') ?? [],
    };
  }
}

function mapSport(stravaType: string): ActivitySport {
  switch (stravaType) {
    case 'Run':
    case 'VirtualRun':
      return 'run';
    case 'TrailRun':
      return 'trail';
    case 'Ride':
    case 'VirtualRide':
    case 'GravelRide':
    case 'MountainBikeRide':
      return 'bike';
    case 'WeightTraining':
    case 'Workout':
    case 'Crossfit':
      return 'strength';
    default:
      return 'other';
  }
}

function parseTimezone(value: string | undefined): string {
  if (!value) return 'Europe/Paris';
  const parts = value.split(' ');
  return parts[parts.length - 1] ?? 'Europe/Paris';
}
