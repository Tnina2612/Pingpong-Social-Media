import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ChannelService } from "./channel.service";
import { CreateChannelDto, UpdateChannelDto } from "./dto";

@ApiTags("Channels")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("channels")
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  // POST /api/channels
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

  // GET /api/channels/:serverId
  @ApiOperation({ summary: "Get all channels in a server" })
  @ApiParam({ name: "serverId", description: "Server ID" })
  @ApiResponse({
    status: 200,
    description: "Channels retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Server not found" })
  @Get(":serverId")
  findByServer(
    @Param("serverId") serverId: string,
    @GetUser("id") userId: string,
  ) {
    return this.channelService.findByServer(serverId, userId);
  }

  // DELETE /api/channels/:channelId
  @ApiOperation({ summary: "Delete a channel" })
  @ApiParam({ name: "channelId", description: "Channel ID" })
  @ApiResponse({
    status: 200,
    description: "Channel deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Channel not found" })
  @Delete(":channelId")
  delete(@Param("channelId") channelId: string, @GetUser("id") userId: string) {
    return this.channelService.delete(channelId, userId);
  }

  // PATCH /api/channels/:channelId
  @ApiOperation({ summary: "Update a channel" })
  @ApiParam({ name: "channelId", description: "Channel ID" })
  @ApiBody({ type: UpdateChannelDto })
  @ApiResponse({ status: 200, description: "Channel updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - insufficient permissions",
  })
  @ApiResponse({ status: 404, description: "Channel not found" })
  @Patch(":channelId")
  update(
    @Param("channelId") channelId: string,
    @GetUser("id") userId: string,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelService.update(channelId, userId, updateChannelDto);
  }
}
