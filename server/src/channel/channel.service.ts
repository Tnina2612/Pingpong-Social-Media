import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateChannelDto, UpdateChannelDto } from "./dto";
import { ChannelResponseDto } from "./response";

@Injectable()
export class ChannelService {
  constructor(private prisma: PrismaService) {}

  private mapToDto(channel: any): ChannelResponseDto {
    return {
      id: channel.id,
      name: channel.name,
      type: channel.type,
      messageCount: channel._count?.messages || 0,
    };
  }

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

    const channel = await this.prisma.channel.create({
      data: {
        name: dto.name,
        type: dto.type,
        serverId: dto.serverId,
      },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return this.mapToDto(channel);
  }

  async findById(
    channelId: string,
    userId: string,
  ): Promise<ChannelResponseDto> {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: true,
        _count: { select: { messages: true } },
      },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    const isMember = await this.prisma.server.findFirst({
      where: {
        id: channel.serverId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });

    if (!isMember) {
      throw new ForbiddenException("Access denied");
    }

    return this.mapToDto(channel);
  }

  async findByServer(
    serverId: string,
    userId: string,
  ): Promise<ChannelResponseDto[]> {
    const server = await this.prisma.server.findFirst({
      where: {
        id: serverId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: {
        channels: {
          include: {
            _count: { select: { messages: true } },
          },
          orderBy: { name: "asc" },
        },
      },
    });

    if (!server) {
      throw new ForbiddenException("Access denied");
    }

    return server.channels.map((channel) => this.mapToDto(channel));
  }

  async delete(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        server: true,
        _count: { select: { messages: true } },
      },
    });

    if (!channel) {
      throw new NotFoundException("Channel not found");
    }

    if (channel.server.ownerId !== userId) {
      throw new ForbiddenException(
        "You can not delete this channel because you are not the owner",
      );
    }

    await this.prisma.channel.delete({
      where: { id: channelId },
    });

    return this.mapToDto(channel);
  }

  async update(
    channelId: string,
    userId: string,
    dto: UpdateChannelDto,
  ): Promise<ChannelResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const channel = await tx.channel.findUnique({
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

      const updatedChannel = await tx.channel.update({
        where: { id: channelId },
        data: {
          name: dto?.name ?? channel.name,
        },
        include: {
          _count: { select: { messages: true } },
        },
      });

      return this.mapToDto(updatedChannel);
    });
  }
}
