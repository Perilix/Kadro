import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { zInviteCode, zJoin, type AuthSession, type InvitePreview, type Join } from '@kadro/shared';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { InviteService } from './invite.service';

/** Routes publiques du flux « rejoindre par code ». */
@Controller('invite')
export class InviteController {
  constructor(private readonly invite: InviteService) {}

  @Get('preview/:code')
  preview(@Param('code', new ZodValidationPipe(zInviteCode)) code: string): Promise<InvitePreview> {
    return this.invite.preview(code);
  }

  @Post('join')
  join(@Body(new ZodValidationPipe(zJoin)) dto: Join): Promise<AuthSession> {
    return this.invite.join(dto);
  }
}
