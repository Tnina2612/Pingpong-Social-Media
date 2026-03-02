import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateChannelDto } from "./dto";

@Injectable()
export class ChannelService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateChannelDto) {
    const server = await this.prisma.server.findUnique({
      where: {
        id: dto.serverId,
        ownerId: userId,
      },
    });

    if (!server) {
      throw new ForbiddenException("Server not found or you do not own it");
    }

    return this.prisma.channel.create({
      data: {
        name: dto.name,
        type: dto.type,
        serverId: dto.serverId,
      },
    });
  }

  async findByServer(serverId: string, userId: string) {
    const server = await this.prisma.server.findFirst({
      where: {
        id: serverId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        channels: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!server) {
      throw new ForbiddenException("Access denied");
    }

    return server.channels;
  }

  async delete(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: { server: true },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    if (channel.server.ownerId !== userId) {
      throw new ForbiddenException(
        "You can not delete this channel because you are not the owner",
      );
    }

    return this.prisma.channel.delete({
      where: { id: channelId },
    });
  }
}
