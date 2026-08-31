import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  zLogin,
  zRefresh,
  zRegisterCoach,
  type AuthSession,
  type Login,
  type Me,
  type Refresh,
  type RegisterCoach,
} from '@kadro/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CurrentUser } from '../common/current-user.decorator';
import { AuthService } from './auth.service';
import { JwtAccessGuard } from './jwt-access.guard';
import type { JwtPayload } from './jwt-payload';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register-coach')
  registerCoach(@Body(new ZodValidationPipe(zRegisterCoach)) dto: RegisterCoach): Promise<AuthSession> {
    return this.auth.registerCoach(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body(new ZodValidationPipe(zLogin)) dto: Login): Promise<AuthSession> {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body(new ZodValidationPipe(zRefresh)) dto: Refresh): Promise<AuthSession> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @UseGuards(JwtAccessGuard)
  async logout(@CurrentUser() user: JwtPayload): Promise<void> {
    await this.auth.logout(user.sub);
  }

  @Get('me')
  @UseGuards(JwtAccessGuard)
  me(@CurrentUser() user: JwtPayload): Promise<Me> {
    return this.auth.me(user);
  }
}
