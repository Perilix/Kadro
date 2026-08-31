import { BadRequestException, Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConnectionsService } from './connections.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(
    private readonly connections: ConnectionsService,
    private readonly config: ConfigService,
  ) {}

  @Get('strava')
  verify(@Query() query: Record<string, string>): { 'hub.challenge': string } {
    const expected = this.config.get<string>('STRAVA_VERIFY_TOKEN');
    if (!expected || query['hub.verify_token'] !== expected || !query['hub.challenge']) {
      throw new BadRequestException({ code: 'webhook.verification_failed' });
    }
    return { 'hub.challenge': query['hub.challenge'] };
  }

  @Post('strava')
  @HttpCode(200)
  async receive(@Body() body: Record<string, unknown>): Promise<{ ok: true }> {
    void this.connections.handleStravaWebhook(body);
    return { ok: true };
  }

  @Post('polar')
  @HttpCode(200)
  async receivePolar(@Body() body: Record<string, unknown>): Promise<{ ok: true }> {
    void this.connections.handlePolarWebhook(body);
    return { ok: true };
  }
}
