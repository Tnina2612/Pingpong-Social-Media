import { GetUser, RequirePermission } from "@libs/common/decorators";
import { ServerPermission } from "@libs/common/enums";
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
import { JwtAuthGuard, ServerPermissionGuard } from "src/auth/guards";
import { CreateServerDto, JoinServerDto, UpdateServerDto } from "./dto";
import { ServerService } from "./server.service";

@ApiTags("Servers")
@ApiBearerAuth()
@Controller("servers")
@UseGuards(JwtAuthGuard, ServerPermissionGuard)
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  // POST /api/servers
  @ApiOperation({
    summary: "Create a new server",
    description: "Creates a new server with optional icon",
  })
  @ApiBody({ type: CreateServerDto })
  @ApiResponse({
    status: 201,
    description: "Server created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  create(
    @GetUser("id") userId: string,
    @Body() createServerDto: CreateServerDto,
  ) {
    return this.serverService.create(userId, createServerDto);
  }

  // GET /api/servers
  @ApiOperation({ summary: "Get all servers of the current user" })
  @ApiResponse({
    status: 200,
    description: "Servers retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get()
  findMyServers(@GetUser("id") userId: string) {
    return this.serverService.findMyServers(userId);
  }

  // GET /api/servers/:serverId
  @ApiOperation({ summary: "Get a specific server by its ID" })
  @ApiParam({ name: "id", description: "Server ID" })
  @ApiResponse({
    status: 200,
    description: "Server retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Server not found" })
  @Get(":serverId")
  findOne(@Param("serverId") serverId: string, @GetUser("id") userId: string) {
    return this.serverService.findOne(serverId, userId);
  }

  // PATCH /api/servers/:serverId
  @ApiOperation({ summary: "Update a server" })
  @ApiParam({ name: "id", description: "Server ID" })
  @ApiResponse({
    status: 200,
    description: "Server updated successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Server not found" })
  @RequirePermission(ServerPermission.MANAGE_SERVER)
  @Patch(":serverId")
  update(
    @Param("serverId") serverId: string,
    @GetUser("id") userId: string,
    @Body() updateServerDto: UpdateServerDto,
  ) {
    return this.serverService.update(serverId, userId, updateServerDto);
  }

  // DELETE /api/servers/:serverId
  @ApiOperation({ summary: "Delete a server" })
  @ApiParam({ name: "id", description: "Server ID" })
  @ApiResponse({
    status: 200,
    description: "Server deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Server not found" })
  @RequirePermission(ServerPermission.ADMINISTRATOR)
  @Delete(":serverId")
  remove(@Param("serverId") serverId: string, @GetUser("id") userId: string) {
    return this.serverService.remove(serverId, userId);
  }

  // POST /api/servers/join
  @ApiOperation({ summary: "Join a server" })
  @ApiBody({ type: JoinServerDto })
  @ApiResponse({
    status: 200,
    description: "Joined server successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Server not found" })
  @Post("join")
  joinServer(@GetUser("id") userId: string, @Body() dto: JoinServerDto) {
    return this.serverService.joinServer(userId, dto);
  }
}
