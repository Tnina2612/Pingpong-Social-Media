import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateMessageDto } from "./dto/create-message.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { UploadService } from "src/upload/upload.service";
import { MessageGateway } from "./message.gateway";

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
    private messageGateway: MessageGateway,
  ) {}
  async create(
    userId: string,
    dto: CreateMessageDto,
    files?: Express.Multer.File[],
  ) {
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

    if (!dto.content && (!files || files.length === 0)) {
      throw new BadRequestException("Message cannot be empty");
    }

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content: dto.content,
          channelId: dto.channelId,
          memberId: member.id,
          replyToId: dto.replyToId ?? null,
        },
      });

      if (files?.length) {
        for (const file of files) {
          const upload = await this.uploadService.uploadMedia(file);

          await tx.attachment.create({
            data: {
              url: upload.url,
              publicId: upload.publicId,
              type: upload.type,
              messageId: message.id,
            },
          });
        }
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

      this.messageGateway.server
        .to(dto.channelId)
        .emit("new-message", fullMessage);

      return fullMessage;
    });
  }

  async findByChannel(channelId: string, cursor?: string) {
    return this.prisma.message.findMany({
      where: { channelId },
      take: 20,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: "desc" },
      include: {
        attachments: true,
        sender: {
          include: { user: true },
        },
        replyTo: true,
      },
    });
  }
}
