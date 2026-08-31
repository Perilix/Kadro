import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { JwtPayload } from './jwt-payload';

/** À poser après JwtAccessGuard : réservé aux coachs. */
@Injectable()
export class CoachGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const { user } = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    if (user?.role !== 'coach') {
      throw new ForbiddenException({ code: 'auth.coach_only' });
    }
    return true;
  }
}
