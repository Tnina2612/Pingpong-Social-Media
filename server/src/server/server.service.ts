import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AttachmentType } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { UploadResponseDto } from "src/upload/response/upload.response";
import { UploadService } from "src/upload/upload.service";
import { extractPublicIdFromUrl } from "utils";
import { CreateServerDto, JoinServerDto, UpdateServerDto } from "./dto";

@Injectable()
export class ServerService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  async create(userId: string, dto: CreateServerDto) {
    return this.prisma.$transaction(async (tx) => {
      const server = await tx.server.create({
        data: {
          ...dto,
          ownerId: userId,
        },
      });

      const permissions = await tx.permission.findMany();

      const ownerRole = await tx.role.create({
        data: {
          name: "OWNER",
          position: 100,
          serverId: server.id,
          permissions: {
            connect: permissions.map((p) => ({ id: p.id })),
          },
        },
      });

      const everyoneRole = await tx.role.create({
        data: {
          name: "EVERYONE",
          position: 0,
          serverId: server.id,
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

      return server;
    });
  }

  async findMyServers(userId: string) {
    return this.prisma.server.findMany({
      where: {
        members: { some: { userId } },
      },
    });
  }

  async findOne(serverId: string, userId: string) {
    const server = await this.prisma.server.findFirst({
      where: {
        id: serverId,
        members: { some: { userId } },
      },
      include: {
        channels: true,
        members: true,
      },
    });

    if (!server)
      throw new ForbiddenException(
        "Server does not exist or you are not a member of this server",
      );

    return server;
  }

  async update(
    serverId: string,
    userId: string,
    dto?: UpdateServerDto,
    file?: Express.Multer.File,
  ) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException("Server not found");
    }
    if (server.ownerId !== userId) {
      throw new ForbiddenException("You are not the owner");
    }

    let uploadResult: UploadResponseDto | null = null;
    if (file) {
      if (server.iconUrl) {
        const iconPublicId = extractPublicIdFromUrl(server.iconUrl);
        if (iconPublicId) {
          await this.uploadService.deleteAttachment({
            publicId: iconPublicId,
            attachmentType: AttachmentType.IMAGE,
          });
        }
      }
      uploadResult = await this.uploadService.uploadAttachment(file);
    }

    return this.prisma.server.update({
      where: { id: serverId },
      data: {
        name: dto?.name ?? server.name,
        iconUrl: uploadResult?.url ?? server.iconUrl,
      },
    });
  }

  async remove(serverId: string, userId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });

    if (!server) {
      throw new NotFoundException("Server not found");
    }
    if (server.ownerId !== userId) {
      throw new ForbiddenException("You are not the owner");
    }

    if (server.iconUrl) {
      const iconPublicId = extractPublicIdFromUrl(server.iconUrl);
      if (iconPublicId) {
        await this.uploadService.deleteAttachment({
          publicId: iconPublicId,
          attachmentType: AttachmentType.IMAGE,
        });
      }
    }

    // TODO: remove also everything inside a server (channel,...)

    return this.prisma.server.delete({
      where: { id: serverId },
    });
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
          name: "EVERYONE",
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
