import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { PermissionGuard } from "permission/permission.guard";
import { RequirePermission } from "permission/require-permission.decorator";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CreateServerDto, JoinServerDto, UpdateServerDto } from "./dto";
import { ServerService } from "./server.service";

@ApiTags("Servers")
@ApiBearerAuth()
@Controller("servers")
@UseGuards(JwtAuthGuard)
export class ServerController {
  constructor(private readonly serverService: ServerService) {}
  // POST api/servers
  @ApiOperation({
    summary: "Create a new server",
    description: "Creates a new server with optional icon",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: CreateServerDto })
  @ApiResponse({
    status: 201,
    description: "Server created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Post()
  @UseInterceptors(FileInterceptor("icon"))
  create(
    @GetUser("id") userId: string,
    @Body() createServerDto: CreateServerDto,
  ) {
    return this.serverService.create(userId, createServerDto);
  }

  // GET api/servers
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

  // TODO: Add permisson using global RBAC for a similar endpoint
  // i.e., admin can access any server
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

  // TODO: Add permisson for update also
  @UseInterceptors(FileInterceptor("icon"))
  @ApiOperation({ summary: "Update a server" })
  @ApiParam({ name: "id", description: "Server ID" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Update server with optional new icon",
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        icon: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Server updated successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Server not found" })
  @Patch(":serverId")
  update(
    @Param("serverId") serverId: string,
    @GetUser("id") userId: string,
    @Body() updateServerDto: UpdateServerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.serverService.update(serverId, userId, updateServerDto, file);
  }

  @ApiOperation({ summary: "Delete a server" })
  @ApiParam({ name: "id", description: "Server ID" })
  @ApiResponse({
    status: 200,
    description: "Server deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Server not found" })
  @RequirePermission("MANAGE_SERVER")
  @UseGuards(PermissionGuard)
  @Delete(":serverId")
  remove(@Param("serverId") serverId: string, @GetUser("id") userId: string) {
    return this.serverService.remove(serverId, userId);
  }

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
