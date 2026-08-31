import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  zMessageCreate,
  zMessagesQuery,
  type Conversation,
  type Message,
  type MessageCreate,
  type MessagesQuery,
  type Page,
} from '@kadro/shared';
import { JwtAccessGuard } from '../auth/jwt-access.guard';
import type { JwtPayload } from '../auth/jwt-payload';
import { CurrentUser } from '../common/current-user.decorator';
import { parseObjectId } from '../common/object-id';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { ChatService } from './chat.service';

@Controller('conversations')
@UseGuards(JwtAccessGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload): Promise<Conversation[]> {
    return this.chat.listConversations(user);
  }

  @Get(':id/messages')
  messages(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(zMessagesQuery)) query: MessagesQuery,
  ): Promise<Page<Message>> {
    return this.chat.listMessages(user, parseObjectId(id), query);
  }

  @Post(':id/messages')
  send(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zMessageCreate)) dto: MessageCreate,
  ): Promise<Message> {
    return this.chat.send(user, parseObjectId(id), dto);
  }

  @Post(':id/read')
  @HttpCode(204)
  async read(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    await this.chat.markRead(user, parseObjectId(id));
  }
}
