import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from './jwt-payload';

@Injectable()
export class JwtAccessGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest<{ headers: Record<string, string | undefined>; user?: JwtPayload }>();
    const header = request.headers['authorization'];
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 'auth.missing_token' });
    }
    let payload: JwtPayload;
    try {
      payload = this.jwt.verify<JwtPayload>(header.slice(7), {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException({ code: 'auth.invalid_token' });
    }
    if (payload.type !== 'access') {
      throw new UnauthorizedException({ code: 'auth.invalid_token' });
    }
    request.user = payload;
    return true;
  }
}
