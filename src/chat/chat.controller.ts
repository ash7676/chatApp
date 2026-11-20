import { Body, Controller, Param, Post } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import type { CreateChatDto, SendMessageDto } from './chat.service.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('create')
  async create(@Body() dto: CreateChatDto): Promise<{ chatId: string }> {
    return this.chatService.createChat(dto);
  }

  @Post(':chatId/message/send')
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      chatId,
      dto.senderId,
      dto.text,
    );
  }
}
