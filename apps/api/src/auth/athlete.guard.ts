import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { JwtPayload } from './jwt-payload';

@Injectable()
export class AthleteGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const { user } = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (user?.role !== 'athlete' || !user.athleteId) {
      throw new ForbiddenException({ code: 'auth.athlete_only' });
    }
    return true;
  }
}
