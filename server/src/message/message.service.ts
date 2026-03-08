import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateMessageDto } from "./dto";
import { MessageGateway } from "./message.gateway";
import { MessageResponseDto } from "./response";

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private messageGateway: MessageGateway,
  ) {}

  private mapToDto(msg: any): MessageResponseDto {
    return {
      id: msg.id,
      createdAt: msg.createdAt,
      deleted: msg.deleted,
      content: msg?.content,
      attachments: msg.attachments,
      reactions: msg.reactions,
      replyTo: {
        id: msg.replyTo.id,
        content: msg.replyTo.content,
      },
      sender: {
        id: msg.sender.id,
        avatar: msg.sender.avatar,
        username: msg.sender.username,
      },
    };
  }

  async create(userId: string, dto: CreateMessageDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: dto.channelId },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    const member = await this.prisma.member.findUnique({
      where: {
        userId_serverId: {
          userId,
          serverId: channel.serverId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException("Not a member");
    }

    if (dto.replyToId) {
      const replyToMessage = await this.prisma.message.findUnique({
        where: { id: dto.replyToId },
      });

      if (!replyToMessage) {
        throw new NotFoundException("Reply target message not found");
      }

      if (replyToMessage.channelId !== dto.channelId) {
        throw new ForbiddenException(
          "Cannot reply to a message in a different channel",
        );
      }
    }

    // Format attachments for Prisma
    const attachmentsData =
      dto.attachments?.map((att) => ({
        url: att.url,
        publicId: att.publicId,
        type: att.type,
        filename: att.filename,
        mimeType: att.mimeType,
        size: att.size,
      })) || [];

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content: dto.content ?? null,
          channelId: dto.channelId,
          replyToId: dto.replyToId ?? null,
          memberId: member.id,
          attachments: {
            create: attachmentsData,
          },
        },
      });

      const fullMessage = await tx.message.findUnique({
        where: { id: message.id },
        include: {
          attachments: true,
          sender: {
            include: { user: true },
          },
          replyTo: {
            select: { id: true, content: true },
          },
        },
      });

      this.messageGateway.server
        .to(dto.channelId)
        .emit("new-message", fullMessage);

      return fullMessage;
    });
  }

  async findByChannel(
    userId: string,
    channelId: string,
    cursor?: string,
  ): Promise<MessageResponseDto[]> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    const member = await this.prisma.member.findUnique({
      where: {
        userId_serverId: {
          userId,
          serverId: channel.serverId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException("Not a member");
    }

    const messages = await this.prisma.message.findMany({
      where: { channelId },
      take: 20,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        deleted: true,
        content: true,
        attachments: true,
        sender: {
          select: {
            user: {
              select: { id: true, username: true, avatar: true },
            },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
          },
        },
        reactions: {
          select: {
            icon: true,
            count: true,
            users: {
              select: {
                user: {
                  select: { id: true, username: true, avatar: true },
                },
              },
            },
          },
        },
      },
    });

    return messages.map((msg) => this.mapToDto(msg));
  }
}
