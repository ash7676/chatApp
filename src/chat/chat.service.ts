import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface CreateChatDto {
  userAId: string;
  userBId: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createChat(dto: CreateChatDto): Promise<{ chatId: string }> {
    if (!dto?.userAId || !dto?.userBId) {
      throw new BadRequestException('userAId and userBId are required');
    }

    if (dto.userAId === dto.userBId) {
      throw new BadRequestException('A chat requires two different users');
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { in: [dto.userAId, dto.userBId] },
      },
      select: { id: true },
    });

    if (users.length !== 2) {
      throw new NotFoundException('One or both users do not exist');
    }

    // Check whether a chat already exists between these users
    const existingChat = await this.prisma.chat.findFirst({
      where: {
        AND: [
          { chatMembers: { some: { userId: dto.userAId } } },
          { chatMembers: { some: { userId: dto.userBId } } },
        ],
      },
      select: { id: true },
    });

    if (existingChat) {
      return { chatId: existingChat.id };
    }

    // Create a new chat with both members
    const chat = await this.prisma.chat.create({
      data: {
        chatMembers: {
          create: [{ userId: dto.userAId }, { userId: dto.userBId }],
        },
      },
    });

    return { chatId: chat.id };
  }
}
