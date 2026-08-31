import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  zCheckoutRequest,
  type Billing,
  type CheckoutRequest,
  type CheckoutUrl,
} from '@kadro/shared';
import { CoachGuard } from '../auth/coach.guard';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { teamIdOf } from '../groups/groups.controller';
import { TeamsService } from '../teams/teams.service';
import type { TeamDocument } from '../teams/team.schema';
import { BillingService } from './billing.service';

@Controller()
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly teams: TeamsService,
  ) {}

  @Get('billing')
  @UseGuards(JwtAccessGuard, CoachGuard)
  async get(@CurrentUser() user: JwtPayload): Promise<Billing> {
    return this.billing.get(await this.requireTeam(user));
  }

  @Post('billing/checkout')
  @UseGuards(JwtAccessGuard, CoachGuard)
  async checkout(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(zCheckoutRequest)) dto: CheckoutRequest,
  ): Promise<CheckoutUrl> {
    return this.billing.checkout(await this.requireTeam(user), dto);
  }

  @Post('billing/portal')
  @UseGuards(JwtAccessGuard, CoachGuard)
  async portal(@CurrentUser() user: JwtPayload): Promise<CheckoutUrl> {
    return this.billing.portal(await this.requireTeam(user));
  }

  @Post('webhooks/stripe')
  @HttpCode(200)
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<{ ok: true }> {
    if (!req.rawBody) throw new BadRequestException({ code: 'billing.webhook_invalid' });
    await this.billing.handleWebhook(req.rawBody, signature);
    return { ok: true };
  }

  private async requireTeam(user: JwtPayload): Promise<TeamDocument> {
    const team = await this.teams.findById(teamIdOf(user));
    if (!team) throw new ForbiddenException({ code: 'team.not_found' });
    return team;
  }
}
