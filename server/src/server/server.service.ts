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
    return this.prisma.server.create({
      data: {
        name: dto.name,
        iconUrl: uploadResult?.url,
        iconPublicId: uploadResult?.publicId,
        ownerId: userId,
        members: {
          create: {
            userId,
          },
        },
      },
      include: {
        members: true,
      },
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
}
