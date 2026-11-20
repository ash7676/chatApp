import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import type { CreateChatDto } from './chat.service.js';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('create')
  async create(@Body() dto: CreateChatDto): Promise<{ chatId: string }> {
    return this.chatService.createChat(dto);
  }
}
