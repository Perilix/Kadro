import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';
import type { Billing, CheckoutRequest, PaidPlan } from '@kadro/shared';
import { PLANS, yearlyEurHt } from '@kadro/shared';
import { Athlete } from '../athletes/athlete.schema';
import { WebhookEvent } from '../connections/webhook-event.schema';
import { Team, TeamDocument } from '../teams/team.schema';
import { UsersService } from '../users/users.service';

const PRICE_ENV_KEYS: [PaidPlan, 'month' | 'year', string][] = [
  ['solo', 'month', 'STRIPE_PRICE_SOLO_MONTH'],
  ['solo', 'year', 'STRIPE_PRICE_SOLO_YEAR'],
  ['coach', 'month', 'STRIPE_PRICE_COACH_MONTH'],
  ['coach', 'year', 'STRIPE_PRICE_COACH_YEAR'],
  ['structure', 'month', 'STRIPE_PRICE_STRUCTURE_MONTH'],
  ['structure', 'year', 'STRIPE_PRICE_STRUCTURE_YEAR'],
];

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null;

  constructor(
    @InjectModel(Team.name) private readonly teams: Model<Team>,
    @InjectModel(Athlete.name) private readonly athletes: Model<Athlete>,
    @InjectModel(WebhookEvent.name) private readonly events: Model<WebhookEvent>,
    private readonly config: ConfigService,
    private readonly users: UsersService,
  ) {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    this.stripe = key ? new Stripe(key) : null;
  }

  async get(team: TeamDocument): Promise<Billing> {
    const s = team.subscription;
    return {
      plan: s.plan,
      status: s.status,
      interval: s.interval,
      athleteLimit: s.athleteLimit,
      athleteCount: await this.athletes.countDocuments({ teamId: team._id, status: 'active' }).exec(),
      coachLimit: s.coachLimit,
      extraAthletes: s.extraAthletes,
      trialEndsAt: s.trialEndsAt?.toISOString() ?? null,
      currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
      amounts: (Object.values(PLANS) as (typeof PLANS)[PaidPlan][]).map((p) => ({
        plan: p.plan,
        monthlyEurHt: p.monthlyEurHt,
        yearlyEurHt: yearlyEurHt(p.plan),
        athleteLimit: p.athleteLimit,
        coachLimit: p.coachLimit,
        extraAthleteEurHt: p.extraAthleteEurHt,
      })),
      checkoutAvailable: this.stripe != null && this.priceId('solo', 'month') != null,
    };
  }

  async checkout(team: TeamDocument, dto: CheckoutRequest): Promise<{ url: string }> {
    const stripe = this.requireStripe();
    const price = this.priceId(dto.plan, dto.interval);
    if (!price) throw new NotImplementedException({ code: 'billing.price_not_configured' });
    const customerId = await this.ensureCustomer(team);
    const webUrl = this.config.getOrThrow<string>('WEB_APP_URL');
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      success_url: `${webUrl}/equipe?billing=success`,
      cancel_url: `${webUrl}/equipe?billing=cancel`,
      subscription_data: { metadata: { teamId: team._id.toString() } },
      metadata: { teamId: team._id.toString() },
    });
    if (!session.url) throw new NotImplementedException({ code: 'billing.checkout_failed' });
    return { url: session.url };
  }

  async portal(team: TeamDocument): Promise<{ url: string }> {
    const stripe = this.requireStripe();
    const customerId = await this.ensureCustomer(team);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${this.config.getOrThrow<string>('WEB_APP_URL')}/equipe`,
    });
    return { url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
    const stripe = this.requireStripe();
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret || !signature) throw new NotImplementedException({ code: 'billing.webhook_not_configured' });
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    try {
      await this.events.create({ provider: 'stripe', externalEventId: event.id, receivedAt: new Date() });
    } catch {
      return;
    }
    try {
      if (
        event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
      ) {
        await this.applySubscription(event.data.object as Stripe.Subscription);
      }
      await this.events
        .updateOne(
          { provider: 'stripe', externalEventId: event.id },
          { $set: { status: 'processed', processedAt: new Date() } },
        )
        .exec();
    } catch (err) {
      await this.events
        .updateOne(
          { provider: 'stripe', externalEventId: event.id },
          { $set: { status: 'failed', error: String(err).slice(0, 300) } },
        )
        .exec();
      throw err;
    }
  }

  private async applySubscription(subscription: Stripe.Subscription): Promise<void> {
    const teamId = subscription.metadata?.['teamId'];
    const team = teamId
      ? await this.teams.findById(teamId).exec()
      : await this.teams
          .findOne({ 'subscription.stripeCustomerId': String(subscription.customer) })
          .exec();
    if (!team) {
      this.logger.warn(`abonnement stripe sans équipe : ${subscription.id}`);
      return;
    }
    const priceId = subscription.items.data[0]?.price.id ?? '';
    const mapped = this.planForPrice(priceId);
    const status = mapStatus(subscription.status);
    const periodEnd = subscription.items.data[0]?.current_period_end;
    const set: Record<string, unknown> = {
      'subscription.status': status,
      'subscription.stripeSubscriptionId': subscription.id,
      'subscription.currentPeriodEnd': periodEnd ? new Date(periodEnd * 1000) : null,
    };
    if (mapped && status !== 'canceled') {
      const def = PLANS[mapped.plan];
      set['subscription.plan'] = mapped.plan;
      set['subscription.interval'] = mapped.interval;
      set['subscription.athleteLimit'] = def.athleteLimit;
      set['subscription.coachLimit'] = def.coachLimit;
      set['subscription.trialEndsAt'] = null;
    }
    await this.teams.updateOne({ _id: team._id }, { $set: set }).exec();
  }

  private async ensureCustomer(team: TeamDocument): Promise<string> {
    if (team.subscription.stripeCustomerId) return team.subscription.stripeCustomerId;
    const stripe = this.requireStripe();
    const owner = await this.users.findById(team.ownerId);
    const customer = await stripe.customers.create({
      email: owner?.email,
      name: team.name,
      metadata: { teamId: team._id.toString() },
    });
    await this.teams
      .updateOne({ _id: team._id }, { $set: { 'subscription.stripeCustomerId': customer.id } })
      .exec();
    return customer.id;
  }

  private planForPrice(priceId: string): { plan: PaidPlan; interval: 'month' | 'year' } | null {
    for (const [plan, interval, envKey] of PRICE_ENV_KEYS) {
      if (this.config.get<string>(envKey) === priceId) return { plan, interval };
    }
    return null;
  }

  private priceId(plan: PaidPlan, interval: 'month' | 'year'): string | undefined {
    const entry = PRICE_ENV_KEYS.find(([p, i]) => p === plan && i === interval);
    return entry ? this.config.get<string>(entry[2]) : undefined;
  }

  private requireStripe(): Stripe {
    if (!this.stripe) throw new NotImplementedException({ code: 'billing.not_configured' });
    return this.stripe;
  }
}

function mapStatus(status: Stripe.Subscription.Status): 'trialing' | 'active' | 'past_due' | 'canceled' {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
    case 'incomplete':
    case 'unpaid':
      return 'past_due';
    default:
      return 'canceled';
  }
}
