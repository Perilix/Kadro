import { z } from 'zod';
import { zIsoInstant } from './common';

export const zBillingPlan = z.enum(['trial', 'solo', 'coach', 'structure']);
export const zBillingStatus = z.enum(['trialing', 'active', 'past_due', 'canceled']);

export const zBilling = z.object({
  plan: zBillingPlan,
  status: zBillingStatus,
  interval: z.enum(['month', 'year']).nullable(),
  athleteLimit: z.number().int(),
  athleteCount: z.number().int(),
  coachLimit: z.number().int(),
  extraAthletes: z.number().int(),
  trialEndsAt: zIsoInstant.nullable(),
  currentPeriodEnd: zIsoInstant.nullable(),
  amounts: z.array(
    z.object({
      plan: z.enum(['solo', 'coach', 'structure']),
      monthlyEurHt: z.number(),
      yearlyEurHt: z.number(),
      athleteLimit: z.number().int(),
      coachLimit: z.number().int(),
      extraAthleteEurHt: z.number(),
    }),
  ),
  checkoutAvailable: z.boolean(),
});
export type Billing = z.infer<typeof zBilling>;

export const zCheckoutRequest = z.object({
  plan: z.enum(['solo', 'coach', 'structure']),
  interval: z.enum(['month', 'year']),
});
export type CheckoutRequest = z.infer<typeof zCheckoutRequest>;

export const zCheckoutUrl = z.object({ url: z.string().url() });
export type CheckoutUrl = z.infer<typeof zCheckoutUrl>;
