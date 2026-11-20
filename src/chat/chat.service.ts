import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ForbiddenException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service.js';
import { FieldValue } from 'firebase-admin/firestore';
export interface CreateChatDto {
  userAId: string;
  userBId: string;
}

export interface SendMessageDto {
  senderId: string;
  text: string;
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly firebase: FirebaseService,
  ) {}

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
  async sendMessage(chatId: string, senderId: string, text: string) {
    if (!senderId || !text?.trim()) {
      throw new BadRequestException('senderId and text are required');
    }

    // Verify chat exists and retrieve its members
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        chatMembers: {
          select: { userId: true },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Verify sender belongs to this chat
    const isMember = chat.chatMembers.some(
      (member) => member.userId === senderId,
    );

    if (!isMember) {
      throw new ForbiddenException('User is not a member of this chat');
    }

    // Store message in Firestore
    const messageRef = await this.firebase.db
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .add({
        senderId,
        text: text.trim(),
        timestamp: FieldValue.serverTimestamp(),
      });

    const savedMessage = await messageRef.get();
    const message = savedMessage.data();

    return {
      messageId: messageRef.id,
      senderId,
      text: text.trim(),
      timestamp: message?.timestamp?.toDate().toISOString(),
    };
  }
}
