import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateChannelDto } from "./dto/create-channel.dto";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ChannelService {
  constructor(private prisma: PrismaService) {}
  async create(userId: string, dto: CreateChannelDto) {
    const server = await this.prisma.server.findUnique({
      where: { id: dto.serverId },
    });
    if (!server) {
      throw new NotFoundException("Server not found");
    }
    if (server.ownerId !== userId) {
      throw new ForbiddenException("Only server owner can create channel");
    }

    return this.prisma.channel.create({
      data: {
        name: dto.name,
        type: dto.type,
        serverId: dto.serverId,
      },
    });
  }

  async findByServer(serverId: string) {
    return this.prisma.channel.findMany({
      where: { serverId },
      orderBy: { name: "asc" },
    });
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
        "You can not delete this channel because u r not the owner",
      );
    }
    return this.prisma.channel.delete({
      where: { id: channelId },
    });
  }
}
