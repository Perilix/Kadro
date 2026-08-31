export type PaidPlan = 'solo' | 'coach' | 'structure';

export interface PlanDef {
  plan: PaidPlan;
  monthlyEurHt: number;
  athleteLimit: number;
  coachLimit: number;
  extraAthleteEurHt: number;
}

export const PLANS: Record<PaidPlan, PlanDef> = {
  solo: { plan: 'solo', monthlyEurHt: 19, athleteLimit: 5, coachLimit: 1, extraAthleteEurHt: 1.5 },
  coach: { plan: 'coach', monthlyEurHt: 39, athleteLimit: 25, coachLimit: 1, extraAthleteEurHt: 1.5 },
  structure: { plan: 'structure', monthlyEurHt: 89, athleteLimit: 80, coachLimit: 3, extraAthleteEurHt: 1.5 },
};

export function yearlyEurHt(plan: PaidPlan): number {
  return PLANS[plan].monthlyEurHt * 10;
}
