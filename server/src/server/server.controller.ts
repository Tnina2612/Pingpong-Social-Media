import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { ServerService } from "./server.service";
import { CreateServerDto } from "./dto/create-server.dto";
import { UpdateServerDto } from "./dto/update-server.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { GetUser } from "src/auth/decorators/get-user.decorator";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags("servers")
@ApiBearerAuth()
@Controller("server")
@UseGuards(JwtAuthGuard)
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @Post()
  @UseInterceptors(FileInterceptor("icon"))
  @ApiOperation({ summary: "Create a new server" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: "Create server with optional icon",
    schema: {
      type: "object",
      properties: {
        name: { type: "string" },
        icon: {
          type: "string",
          format: "binary",
        },
      },
      required: ["name"],
    },
  })
  @ApiResponse({
    status: 201,
    description: "Server created successfully",
  })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  create(
    @GetUser("id") userId: string,
    @Body() createServerDto: CreateServerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.serverService.create(userId, createServerDto, file);
  }

  @Get()
  @ApiOperation({ summary: "Get all servers of the current user" })
  @ApiResponse({
    status: 200,
    description: "Servers retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findMyServers(@GetUser("id") userId: string) {
    return this.serverService.findMyServers(userId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a specific server by ID" })
  @ApiParam({ name: "id", description: "Server ID" })
  @ApiResponse({
    status: 200,
    description: "Server retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Server not found" })
  findOne(@Param("id") serverId: string) {
    return this.serverService.findOne(serverId);
  }

  @Patch(":id")
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
  update(
    @Param("id") serverId: string,
    @Body() updateServerDto: UpdateServerDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.serverService.update(serverId, updateServerDto, file);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a server" })
  @ApiParam({ name: "id", description: "Server ID" })
  @ApiResponse({
    status: 200,
    description: "Server deleted successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Server not found" })
  remove(@Param("id") serverId: string, @GetUser("id") userId: string) {
    return this.serverService.remove(serverId, userId);
  }
}
