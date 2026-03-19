import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateMessageDto, UpdateMessageDto } from "./dto";
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
      content: msg?.content,
      attachments: msg.attachments,
      reactions: msg.reactions,
      replyTo: {
        id: msg.replyTo?.id,
        content: msg.replyTo?.content,
      },
      sender: {
        id: msg.sender.user.id,
        avatar: msg.sender.user.avatar,
        username: msg.sender.user.username,
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

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content: dto.content ?? null,
          channelId: dto.channelId,
          replyToId: dto.replyToId ?? null,
          memberId: member.id,
        },
      });

      if (dto.attachmentIds?.length) {
        const attachments = await tx.attachment.findMany({
          where: {
            id: { in: dto.attachmentIds },
            status: "TEMP",
          },
        });

        if (attachments.length !== dto.attachmentIds.length) {
          throw new BadRequestException("Invalid attachment ids");
        }

        await tx.attachment.updateMany({
          where: {
            id: { in: dto.attachmentIds },
          },
          data: {
            messageId: message.id,
            status: "USED",
          },
        });
      }

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

      const formatMessage = this.mapToDto(fullMessage);
      this.messageGateway.server
        .to(dto.channelId)
        .emit("send-message", formatMessage);

      return formatMessage;
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
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        content: true,
        attachments: true,
        sender: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
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

    return messages.map((msg) => this.mapToDto(msg)).reverse();
  }

  async update(
    messageId: string,
    userId: string,
    dto: UpdateMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { channel: true },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    const member = await this.prisma.member.findUnique({
      where: {
        userId_serverId: {
          userId,
          serverId: message.channel.serverId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException("Not a member");
    }

    if (message.memberId !== member.id) {
      throw new ForbiddenException("Message is sent by another user");
    }

    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: dto?.content ?? message.content,
      },
      include: {
        replyTo: true,
        attachments: true,
        reactions: true,
        sender: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    const formatMessage = this.mapToDto(updatedMessage);
    this.messageGateway.server
      .to(message.channelId)
      .emit("update-message", formatMessage);

    return formatMessage;
  }

  async delete(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { channel: true },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    const member = await this.prisma.member.findUnique({
      where: {
        userId_serverId: {
          userId,
          serverId: message.channel.serverId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException("Not a member");
    }

    if (message.memberId !== member.id) {
      throw new ForbiddenException("Message is sent by another user");
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { deleted: true },
    });

    this.messageGateway.server
      .to(message.channelId)
      .emit("delete-message", { id: messageId });
  }
}
