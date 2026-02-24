import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateServerDto } from "./dto/create-server.dto";
import { UpdateServerDto } from "./dto/update-server.dto";
import { PrismaService } from "src/prisma/prisma.service";
import { UploadService } from "src/upload/upload.service";
import { UploadResponseDto } from "src/upload/response/upload.response";

@Injectable()
export class ServerService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}
  async create(
    userId: string,
    dto: CreateServerDto,
    file?: Express.Multer.File,
  ) {
    let uploadResult: UploadResponseDto | null = null;

    if (file) {
      uploadResult = await this.uploadService.uploadMedia(file);
    }
    return this.prisma.$transaction(async (tx) => {
      const server = await tx.server.create({
        data: {
          name: dto.name,
          iconUrl: uploadResult?.url,
          iconPublicId: uploadResult?.publicId,
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
        members: {
          some: {
            userId,
          },
        },
      },
    });
  }

  async findOne(serverId: string) {
    return this.prisma.server.findUnique({
      where: {
        id: serverId,
      },
      include: {
        channels: true,
        members: true,
      },
    });
  }

  async update(
    serverId: string,
    dto: UpdateServerDto,
    file?: Express.Multer.File,
  ) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });
    if (!server) {
      throw new NotFoundException("Server not found");
    }

    let uploadResult: UploadResponseDto | null = null;
    if (file) {
      if (server.iconPublicId) {
        await this.uploadService.deleteMedia(server.iconPublicId);
      }
      uploadResult = await this.uploadService.uploadMedia(file);
    }

    return this.prisma.server.update({
      where: { id: serverId },
      data: {
        name: dto.name ?? server.name,
        iconUrl: uploadResult?.url ?? server.iconUrl,
        iconPublicId: uploadResult?.publicId ?? server.iconPublicId,
      },
    });
  }

  async remove(serverId: string, userId: string) {
    const server = await this.prisma.server.findUnique({
      where: { id: serverId },
    });
    if (!server || server.ownerId !== userId) {
      throw new ForbiddenException("You are not the owner");
    }
    if (server.iconPublicId) {
      await this.uploadService.deleteMedia(server.iconPublicId);
    }
    return this.prisma.server.delete({
      where: { id: serverId },
    });
  }

  async joinServer(userId: string, serverId: string) {
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

      const member = await tx.member.create({
        data: {
          userId,
          serverId,
        },
      });

      return member;
    });
  }
}
