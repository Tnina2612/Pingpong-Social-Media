import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { ChannelService } from "./channel.service";
import { CreateChannelDto } from "./dto/create-channel.dto";

import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { GetUser } from "src/auth/decorators/get-user.decorator";

@ApiTags("channels")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("channel")
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @ApiOperation({ summary: "Create a new channel in a server" })
  @ApiBody({ type: CreateChannelDto })
  @ApiResponse({
    status: 201,
    description: "Channel created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  create(@GetUser("id") userId: string, @Body() dto: CreateChannelDto) {
    return this.channelService.create(userId, dto);
  }

  @Get(":serverId")
  @ApiOperation({ summary: "Get all channels in a server" })
  @ApiParam({ name: "serverId", description: "Server ID" })
  @ApiResponse({
    status: 200,
    description: "Channels retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Server not found" })
  findByServer(@Param("serverId") serverId: string) {
    return this.channelService.findByServer(serverId);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a channel" })
  @ApiParam({ name: "id", description: "Channel ID" })
  @ApiResponse({
    status: 200,
    description: "Channel deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Channel not found" })
  delete(@Param("id") channelId: string, @GetUser("id") userId: string) {
    return this.channelService.delete(channelId, userId);
  }
}
