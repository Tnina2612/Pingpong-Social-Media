import { ServerPermission } from "@libs/common/enums";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AttachmentType } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { UploadService } from "src/upload/upload.service";
import { extractPublicIdFromUrl } from "utils";
import { CreateServerDto, JoinServerDto, UpdateServerDto } from "./dto";
import { ServerResponseDto } from "./response";

@Injectable()
export class ServerService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  private mapToDto(server: any): ServerResponseDto {
    return {
      id: server.id,
      name: server.name,
      iconUrl: server.iconUrl,
      owner: {
        id: server.owner.id,
        username: server.owner.username,
        avatar: server.owner.avatar,
      },
      stats: {
        channelCount: server._count?.channels || 0,
        memberCount: server._count?.members || 0,
      },
    };
  }

  async create(userId: string, dto: CreateServerDto) {
    return this.prisma.$transaction(async (tx) => {
      let iconUrl: string | null = null;
      if (dto.iconAttachmentId) {
        const attachment = await tx.attachment.findUnique({
          where: { id: dto.iconAttachmentId },
        });

        if (!attachment || attachment.status !== "TEMP") {
          throw new BadRequestException("Invalid attachment");
        }
        iconUrl = attachment.url;
        await tx.attachment.update({
          where: { id: attachment.id },
          data: {
            status: "USED",
          },
        });
      }

      const server = await tx.server.create({
        data: {
          name: dto.name,
          iconUrl,
          ownerId: userId,
        },
      });

      const ownerRole = await tx.role.create({
        data: {
          name: "administrator",
          color: "#3498db",
          serverId: server.id,
          permissions: ServerPermission.ADMINISTRATOR,
        },
      });

      const everyoneRole = await tx.role.create({
        data: {
          name: "everyone",
          color: "#3498db",
          serverId: server.id,
          permissions: ServerPermission.SEND_MESSAGES,
        },
      });

      await tx.member.create({
        data: {
          userId,
          serverId: server.id,
          roles: {
            connect: [{ id: ownerRole.id }, { id: everyoneRole.id }],
          },
        },
      });

      const createdServer = await tx.server.findUnique({
        where: { id: server.id },
        include: {
          owner: { select: { id: true, username: true, avatar: true } },
          _count: { select: { channels: true, members: true } },
        },
      });

      return this.mapToDto(createdServer);
    });
  }

  async findMyServers(userId: string): Promise<ServerResponseDto[]> {
    const servers = await this.prisma.server.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        _count: { select: { channels: true, members: true } },
      },
    });

    return servers.map((server) => this.mapToDto(server));
  }

  async findOne(serverId: string, userId: string): Promise<ServerResponseDto> {
    const server = await this.prisma.server.findFirst({
      where: {
        id: serverId,
        members: { some: { userId } },
      },
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        channels: true,
        members: true,
        _count: { select: { channels: true, members: true } },
      },
    });

    if (!server)
      throw new ForbiddenException(
        "Server does not exist or you are not a member of this server",
      );

    return this.mapToDto(server);
  }

  async update(
    serverId: string,
    userId: string,
    dto: UpdateServerDto,
  ): Promise<ServerResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const server = await tx.server.findUnique({
        where: { id: serverId },
      });

      if (!server) {
        throw new NotFoundException("Server not found");
      }
      if (server.ownerId !== userId) {
        throw new ForbiddenException("You are not the owner");
      }

      let newIconUrl: string | null = null;
      if (dto.iconAttachmentId) {
        const attachment = await tx.attachment.findUnique({
          where: { id: dto.iconAttachmentId },
        });

        if (!attachment || attachment.status !== "TEMP") {
          throw new BadRequestException("Invalid attachment");
        }
        newIconUrl = attachment.url;
        await tx.attachment.update({
          where: { id: attachment.id },
          data: {
            status: "USED",
          },
        });
      }

      const updatedServer = await tx.server.update({
        where: { id: serverId },
        data: {
          name: dto?.name ?? server.name,
          iconUrl: newIconUrl ?? server.iconUrl,
        },
        include: {
          owner: { select: { id: true, username: true, avatar: true } },
          _count: { select: { channels: true, members: true } },
        },
      });

      return this.mapToDto(updatedServer);
    });
  }

  async remove(serverId: string, userId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) throw new NotFoundException("Server not found");
    if (server.ownerId !== userId)
      throw new ForbiddenException("You are not the owner");

    if (server.iconUrl) {
      const iconPublicId = extractPublicIdFromUrl(server.iconUrl);
      if (iconPublicId) {
        await this.uploadService.deleteAttachment({
          publicId: iconPublicId,
          attachmentType: AttachmentType.IMAGE,
        });
      }
    }

    await this.prisma.server.delete({
      where: { id: serverId },
    });

    return { message: "Server deleted successfully" };
  }

  async joinServer(userId: string, dto: JoinServerDto) {
    const serverId = dto.serverId;

    return this.prisma.$transaction(async (tx) => {
      const server = await tx.server.findUnique({
        where: { id: serverId },
      });

      if (!server) {
        throw new NotFoundException("Server not found");
      }

      if (server.ownerId === userId) {
        throw new ForbiddenException("Owner is already in server");
      }

      const existingMember = await tx.member.findUnique({
        where: {
          userId_serverId: {
            userId,
            serverId,
          },
        },
      });

      if (existingMember) {
        throw new ForbiddenException("You are already a member");
      }

      // Assign the EVERYONE role to the newly joined member so they get default permissions
      const everyoneRole = await tx.role.findFirst({
        where: {
          serverId,
          name: "everyone",
        },
      });

      const member = await tx.member.create({
        data: {
          userId,
          serverId,
          roles: everyoneRole
            ? { connect: [{ id: everyoneRole.id }] }
            : undefined,
        },
      });

      return member;
    });
  }
}
